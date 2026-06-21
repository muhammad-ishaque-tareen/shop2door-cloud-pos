// controllers/sales.controller.js

//  CREATE SALE 
exports.createSale = async (req, res) => {
  const { client_sale_id, items, subtotal, tax, discount, total, payment_method } = req.body;

  if (!items || !items.length)
    return res.status(400).json({ error: 'No items provided' });

  if (!client_sale_id)
    return res.status(400).json({ error: 'client_sale_id is required' });

  const userId  = req.user.id;
  const storeId = req.user.store_id || null;   // cashier/manager carry store_id in JWT

  try {
    // Idempotency check — this exact sale may have already been committed
    // by an earlier attempt whose response never reached the browser
    // (e.g. connection dropped right after COMMIT). Same client_sale_id
    // means same real-world transaction: return what already exists
    // instead of inserting a duplicate sale and double-deducting stock.
    const existing = await req.shopDB.query(
      `SELECT * FROM sales WHERE client_sale_id = $1`,
      [client_sale_id]
    );
    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        receipt_no: existing.rows[0].receipt_no,
        sale: existing.rows[0],
        already_existed: true,
      });
    }

    await req.shopDB.query('BEGIN');

    // Generate unique receipt number
    const receiptNo = 'RCP-' + Date.now();

    // Insert sale header
    const saleResult = await req.shopDB.query(
      `INSERT INTO sales
         (receipt_no, store_id, user_id, subtotal, tax, discount, total, payment_method, client_sale_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [receiptNo, storeId, userId, subtotal, tax, discount, total, payment_method, client_sale_id]
    );

    const sale = saleResult.rows[0];

    for (const item of items) {
      const lineTotal = parseFloat(item.price) * parseFloat(item.quantity);

      // Insert sale line item
      await req.shopDB.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.sale_id, item.product_id, item.quantity, item.price, lineTotal]
      );

      if (storeId) {
        // Store user: check & deduct store_inventory first (authoritative for that store)
        const invUpdate = await req.shopDB.query(
          `UPDATE store_inventory
           SET quantity = quantity - $1
           WHERE store_id = $2 AND product_id = $3 AND quantity >= $1
           RETURNING product_id, quantity`,
          [item.quantity, storeId, item.product_id]
        );

        if (invUpdate.rows.length === 0) {
          throw new Error(`Insufficient stock in this store for product ID ${item.product_id}`);
        }

        // Keep global products.stock in sync
        await req.shopDB.query(
          `UPDATE products
           SET stock = GREATEST(stock - $1, 0)
           WHERE product_id = $2`,
          [item.quantity, item.product_id]
        );
      } else {
        // shop_admin / no store: fall back to global products.stock
        const stockUpdate = await req.shopDB.query(
          `UPDATE products
           SET stock = stock - $1
           WHERE product_id = $2 AND stock >= $1
           RETURNING product_id, name, stock`,
          [item.quantity, item.product_id]
        );

        if (stockUpdate.rows.length === 0) {
          throw new Error(`Insufficient stock for product ID ${item.product_id}`);
        }
      }
    }

    await req.shopDB.query('COMMIT');
    res.json({ success: true, receipt_no: receiptNo, sale });

  } catch (error) {
    await req.shopDB.query('ROLLBACK');
    console.error('[SALE] createSale error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

//  GET MY SALES 
exports.getMySales = async (req, res) => {
  const userId = req.user.id;

  try {
    const salesResult = await req.shopDB.query(
      `SELECT
         s.sale_id,
         s.receipt_no,
         s.store_id,
         s.user_id,
         s.subtotal,
         s.tax,
         s.discount,
         s.total,
         s.payment_method,
         s.created_at,
         u.name AS cashier_name
       FROM sales s
       JOIN users u ON s.user_id = u.user_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    const sales = salesResult.rows;

    // Attach line items to each sale
    for (const sale of sales) {
      const itemsResult = await req.shopDB.query(
        `SELECT
           si.sale_item_id,
           si.product_id,
           si.quantity,
           si.price,
           si.total,
           p.name    AS product_name,
           p.barcode
         FROM sale_items si
         JOIN products p ON si.product_id = p.product_id
         WHERE si.sale_id = $1`,
        [sale.sale_id]
      );
      sale.items = itemsResult.rows;
    }

    // Aggregate metrics
    const totalSales     = sales.reduce((sum, s) => sum + parseFloat(s.total),    0);
    const cashSales      = sales.filter(s => s.payment_method === 'cash')
                                .reduce((sum, s) => sum + parseFloat(s.total), 0);
    const cardSales      = sales.filter(s => s.payment_method === 'card')
                                .reduce((sum, s) => sum + parseFloat(s.total), 0);
    const mobileSales    = sales.filter(s => s.payment_method === 'mobile')
                                .reduce((sum, s) => sum + parseFloat(s.total), 0);
    const discountsGiven = sales.reduce((sum, s) => sum + parseFloat(s.discount), 0);
    const transactions   = sales.length;

    const refundResult = await req.shopDB.query(
      `SELECT ri.subtotal
       FROM returns r
       JOIN return_items ri ON r.return_id = ri.return_id
       WHERE r.user_id = $1`,
      [userId]
    );
    const refunds = refundResult.rows.reduce((sum, r) => sum + parseFloat(r.subtotal), 0);

    res.json({
      metrics: { totalSales, cashSales, cardSales, mobileSales, discountsGiven, transactions, refunds },
      sales
    });

  } catch (error) {
    console.error('[SALE] getMySales error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

//  GET SALE BY RECEIPT NUMBER 
exports.getSaleByReceipt = async (req, res) => {
  const { receipt_no } = req.params;

  try {
    const saleResult = await req.shopDB.query(
      `SELECT
         s.*,
         u.name  AS cashier_name,
         st.name AS store_name
       FROM sales s
       JOIN users u ON s.user_id = u.user_id
       LEFT JOIN stores st ON s.store_id = st.store_id
       WHERE s.receipt_no = $1`,
      [receipt_no]
    );

    if (saleResult.rows.length === 0)
      return res.status(404).json({ error: 'Sale not found' });

    const sale = saleResult.rows[0];

    // Fetch items with how much qty has already been returned per sale_item
    const itemsResult = await req.shopDB.query(
      `SELECT
         si.sale_item_id,
         si.product_id,
         si.quantity                              AS quantity,
         si.price,
         si.total,
         p.name                                   AS product_name,
         p.barcode,
         p.unit,
         COALESCE(SUM(ri.quantity), 0)::DECIMAL   AS already_returned_qty
       FROM sale_items si
       JOIN products p ON si.product_id = p.product_id
       LEFT JOIN return_items ri ON ri.sale_item_id = si.sale_item_id
       WHERE si.sale_id = $1
       GROUP BY si.sale_item_id, si.product_id, si.quantity, si.price, si.total,
                p.name, p.barcode, p.unit`,
      [sale.sale_id]
    );

    sale.items = itemsResult.rows;
    res.json(sale);

  } catch (error) {
    console.error('[SALE] getSaleByReceipt error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

//  PROCESS RETURN 
exports.processReturn = async (req, res) => {
  const { sale_id, items, reason } = req.body;
  const userId = req.user.id;

  if (!sale_id || !items || !items.length)
    return res.status(400).json({ error: 'sale_id and items are required' });

  try {
    await req.shopDB.query('BEGIN');

    // 1. Verify sale exists and get store_id + status
    const saleCheck = await req.shopDB.query(
      `SELECT sale_id, store_id, status FROM sales WHERE sale_id = $1`, [sale_id]
    );
    if (saleCheck.rows.length === 0) {
      await req.shopDB.query('ROLLBACK');
      return res.status(404).json({ error: 'Original sale not found.' });
    }

    const { store_id: saleStoreId, status: saleStatus } = saleCheck.rows[0];

    if (saleStatus === 'returned') {
      await req.shopDB.query('ROLLBACK');
      return res.status(409).json({ error: 'This sale has already been fully returned.' });
    }

    // 2. Validate each item against actual sale_items and already-returned qty
    for (const item of items) {
      const saleItemCheck = await req.shopDB.query(
        `SELECT
           si.sale_item_id,
           si.quantity                            AS sold_qty,
           COALESCE(SUM(ri.quantity), 0)::DECIMAL AS returned_qty
         FROM sale_items si
         LEFT JOIN return_items ri ON ri.sale_item_id = si.sale_item_id
         WHERE si.sale_item_id = $1 AND si.sale_id = $2
         GROUP BY si.sale_item_id, si.quantity`,
        [item.sale_item_id, sale_id]
      );

      if (saleItemCheck.rows.length === 0) {
        await req.shopDB.query('ROLLBACK');
        return res.status(400).json({
          error: `Item with sale_item_id ${item.sale_item_id} does not belong to this sale.`
        });
      }

      const { sold_qty, returned_qty } = saleItemCheck.rows[0];
      const returnable = parseFloat(sold_qty) - parseFloat(returned_qty);

      if (parseFloat(item.quantity) > returnable) {
        await req.shopDB.query('ROLLBACK');
        return res.status(400).json({
          error: `Return quantity (${item.quantity}) exceeds returnable quantity (${returnable}) for sale_item_id ${item.sale_item_id}.`
        });
      }
    }

    // 3. Insert return header
    const returnResult = await req.shopDB.query(
      `INSERT INTO returns (sale_id, user_id, reason)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [sale_id, userId, reason || null]
    );
    const ret = returnResult.rows[0];

    // 4. Insert return line items and restore stock
    for (const item of items) {
      const subtotal = parseFloat(item.unit_price) * parseFloat(item.quantity);

      // Link return_item to the exact sale_item so double-return is trackable
      await req.shopDB.query(
        `INSERT INTO return_items (return_id, sale_item_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [ret.return_id, item.sale_item_id, item.product_id, item.quantity, item.unit_price, subtotal]
      );

      // Restore products.stock
      await req.shopDB.query(
        `UPDATE products
         SET stock = stock + $1
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );

      // Restore store_inventory
      if (saleStoreId) {
        await req.shopDB.query(
          `UPDATE store_inventory
           SET quantity = quantity + $1
           WHERE store_id = $2 AND product_id = $3`,
          [item.quantity, saleStoreId, item.product_id]
        );
      }
    }

    // 5. Check if ALL items in this sale are now fully returned
    //    If yes → mark sale as 'returned'
    const remainingCheck = await req.shopDB.query(
      `SELECT
         SUM(si.quantity)                          AS total_sold,
         COALESCE(SUM(ri.quantity), 0)::DECIMAL    AS total_returned
       FROM sale_items si
       LEFT JOIN return_items ri ON ri.sale_item_id = si.sale_item_id
       WHERE si.sale_id = $1`,
      [sale_id]
    );

    const { total_sold, total_returned } = remainingCheck.rows[0];
    if (parseFloat(total_returned) >= parseFloat(total_sold)) {
      await req.shopDB.query(
        `UPDATE sales SET status = 'returned' WHERE sale_id = $1`, [sale_id]
      );
    }

    await req.shopDB.query('COMMIT');
    res.json({ success: true, return: ret });

  } catch (error) {
    await req.shopDB.query('ROLLBACK');
    console.error('[RETURN] processReturn error:', error.message);
    res.status(500).json({ error: error.message });
  }
};