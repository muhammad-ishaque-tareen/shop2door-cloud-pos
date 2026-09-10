// controllers/sales.controller.js

//  CREATE SALE 
exports.createSale = async (req, res) => {
  const { client_sale_id, items, subtotal, tax, discount, total, payment_method } = req.body;

  if (!items || !items.length)
    return res.status(400).json({ error: 'No items provided' });

  if (!client_sale_id)
    return res.status(400).json({ error: 'client_sale_id is required' });

  if (!req.shopDB)
    return res.status(500).json({ error: 'Database connection unavailable' });

  const userId  = req.user.id;
  const storeId = req.user.store_id || null;   // cashier/manager carry store_id in JWT

  const client = await req.shopDB.connect();

  try {
    // Idempotency check — this exact sale may have already been committed
    // by an earlier attempt whose response never reached the browser
    // (e.g. connection dropped right after COMMIT). Same client_sale_id
    // means same real-world transaction: return what already exists
    // instead of inserting a duplicate sale and double-deducting stock.
    const existing = await client.query(
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

    await client.query('BEGIN');

    // Validate each cart item against database prices and lock inventory with FOR UPDATE
    let serverSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const itemQty = parseFloat(item.quantity);
      if (isNaN(itemQty) || itemQty <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Invalid quantity for product ID ${item.product_id}` });
      }

      // Lock products row to prevent concurrent modifications
      const productRes = await client.query(
        `SELECT product_id, name, price, stock 
         FROM products 
         WHERE product_id = $1 
         FOR UPDATE`,
        [item.product_id]
      );

      if (productRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Product ID ${item.product_id} not found` });
      }

      const productRow = productRes.rows[0];

      // Lock store_inventory row if storeId is present
      let storeInvRow = null;
      if (storeId) {
        const storeInvRes = await client.query(
          `SELECT inventory_id, store_id, product_id, quantity, price 
           FROM store_inventory 
           WHERE store_id = $1 AND product_id = $2 
           FOR UPDATE`,
          [storeId, item.product_id]
        );
        storeInvRow = storeInvRes.rows[0] || null;
      }

      // Authoritative price: store_inventory.price (if set) fallback to products.price
      const authoritativePrice = parseFloat(
        storeInvRow && storeInvRow.price !== null && storeInvRow.price !== undefined
          ? storeInvRow.price
          : productRow.price
      );

      // Validate submitted price against authoritative price (compare cents to avoid IEEE-754 precision issues)
      const submittedPrice = parseFloat(item.price);
      if (isNaN(submittedPrice) || Math.round(submittedPrice * 100) !== Math.round(authoritativePrice * 100)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Price mismatch for product "${productRow.name}" (ID: ${item.product_id}): submitted ${submittedPrice}, expected ${authoritativePrice}`
        });
      }

      // Check stock availability
      if (storeId) {
        const available = storeInvRow ? parseFloat(storeInvRow.quantity) : 0;
        if (available < itemQty) {
          throw new Error(`Insufficient stock in this store for product ID ${item.product_id}`);
        }
      } else {
        const available = parseFloat(productRow.stock);
        if (available < itemQty) {
          throw new Error(`Insufficient stock for product ID ${item.product_id}`);
        }
      }

      const lineTotal = Math.round(authoritativePrice * itemQty * 100) / 100;
      serverSubtotal += lineTotal;

      validatedItems.push({
        product_id: item.product_id,
        quantity: itemQty,
        authoritativePrice,
        lineTotal,
      });
    }

    serverSubtotal = Math.round(serverSubtotal * 100) / 100;

    // Compute subtotal, tax, and total entirely on the server
    const clientSubtotal = parseFloat(subtotal) || 0;
    const clientTax = parseFloat(tax) || 0;
    const clientDiscount = parseFloat(discount) || 0;

    const taxRate = clientSubtotal > 0 ? (clientTax / clientSubtotal) : 0;
    const serverTax = Math.round(serverSubtotal * taxRate * 100) / 100;
    const serverDiscount = Math.min(Math.round(clientDiscount * 100) / 100, Math.round((serverSubtotal + serverTax) * 100) / 100);
    const serverTotal = Math.round((serverSubtotal + serverTax - serverDiscount) * 100) / 100;

    // Generate unique receipt number
    const receiptNo = 'RCP-' + Date.now();

    // Insert sale header
    const saleResult = await client.query(
      `INSERT INTO sales
         (receipt_no, store_id, user_id, subtotal, tax, discount, total, payment_method, client_sale_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [receiptNo, storeId, userId, serverSubtotal, serverTax, serverDiscount, serverTotal, payment_method, client_sale_id]
    );

    const sale = saleResult.rows[0];

    for (const vItem of validatedItems) {
      // Insert sale line item
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.sale_id, vItem.product_id, vItem.quantity, vItem.authoritativePrice, vItem.lineTotal]
      );

      if (storeId) {
        // Store user: check & deduct store_inventory first (authoritative for that store)
        const invUpdate = await client.query(
          `UPDATE store_inventory
           SET quantity = quantity - $1
           WHERE store_id = $2 AND product_id = $3 AND quantity >= $1
           RETURNING product_id, quantity`,
          [vItem.quantity, storeId, vItem.product_id]
        );

        if (invUpdate.rows.length === 0) {
          throw new Error(`Insufficient stock in this store for product ID ${vItem.product_id}`);
        }

        // Keep global products.stock in sync
        await client.query(
          `UPDATE products
           SET stock = GREATEST(stock - $1, 0)
           WHERE product_id = $2`,
          [vItem.quantity, vItem.product_id]
        );
      } else {
        // shop_admin / no store: fall back to global products.stock
        const stockUpdate = await client.query(
          `UPDATE products
           SET stock = stock - $1
           WHERE product_id = $2 AND stock >= $1
           RETURNING product_id, name, stock`,
          [vItem.quantity, vItem.product_id]
        );

        if (stockUpdate.rows.length === 0) {
          throw new Error(`Insufficient stock for product ID ${vItem.product_id}`);
        }
      }
    }

    await client.query('COMMIT');
    return res.json({ success: true, receipt_no: receiptNo, sale });

  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('[SALE] ROLLBACK error:', rbErr.message);
    }
    console.error('[SALE] createSale error:', error.message);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

//  GET MY SALES 
exports.getMySales = async (req, res) => {
  const userId = req.user.id;

  const pageParam = parseInt(req.query.page, 10);
  const limitParam = parseInt(req.query.limit, 10);
  const offsetParam = parseInt(req.query.offset, 10);

  const limit = Number.isInteger(limitParam) && limitParam > 0 ? limitParam : 50;
  let offset = 0;
  if (Number.isInteger(pageParam) && pageParam > 0) {
    offset = (pageParam - 1) * limit;
  } else if (Number.isInteger(offsetParam) && offsetParam >= 0) {
    offset = offsetParam;
  }

  try {
    const result = await req.shopDB.query(
      `WITH user_sales AS (
         SELECT
           s.sale_id,
           s.receipt_no,
           s.store_id,
           s.user_id,
           s.subtotal::text AS subtotal,
           s.tax::text AS tax,
           s.discount::text AS discount,
           s.total::text AS total,
           s.payment_method,
           s.created_at,
           u.name AS cashier_name,
           COALESCE(
             json_agg(
               json_build_object(
                 'sale_item_id', si.sale_item_id,
                 'product_id', si.product_id,
                 'quantity', si.quantity::text,
                 'price', si.price::text,
                 'total', si.total::text,
                 'product_name', p.name,
                 'barcode', p.barcode
               ) ORDER BY si.sale_item_id
             ) FILTER (WHERE si.sale_item_id IS NOT NULL),
             '[]'::json
           ) AS items
         FROM sales s
         JOIN users u ON s.user_id = u.user_id
         LEFT JOIN sale_items si ON s.sale_id = si.sale_id
         LEFT JOIN products p ON si.product_id = p.product_id
         WHERE s.user_id = $1
         GROUP BY s.sale_id, u.name
         ORDER BY s.created_at DESC
       ),
       paginated_sales AS (
         SELECT * FROM user_sales
         LIMIT $2 OFFSET $3
       ),
       metrics_summary AS (
         SELECT
           COALESCE(SUM(total), 0)::FLOAT AS total_sales,
           COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0)::FLOAT AS cash_sales,
           COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END), 0)::FLOAT AS card_sales,
           COALESCE(SUM(CASE WHEN payment_method = 'mobile' THEN total ELSE 0 END), 0)::FLOAT AS mobile_sales,
           COALESCE(SUM(discount), 0)::FLOAT AS discounts_given,
           COUNT(*)::INT AS transactions
         FROM sales
         WHERE user_id = $1
       ),
       refunds_summary AS (
         SELECT COALESCE(SUM(ri.subtotal), 0)::FLOAT AS refunds
         FROM returns r
         JOIN return_items ri ON r.return_id = ri.return_id
         WHERE r.user_id = $1
       )
       SELECT
         (SELECT COALESCE(json_agg(ps.*), '[]'::json) FROM paginated_sales ps) AS sales,
         (
           SELECT json_build_object(
             'totalSales', m.total_sales,
             'cashSales', m.cash_sales,
             'cardSales', m.card_sales,
             'mobileSales', m.mobile_sales,
             'discountsGiven', m.discounts_given,
             'transactions', m.transactions,
             'refunds', r.refunds
           )
           FROM metrics_summary m, refunds_summary r
         ) AS metrics`,
      [userId, limit, offset]
    );

    const row = result.rows[0] || {};
    const sales = row.sales || [];
    const metrics = row.metrics || {
      totalSales: 0,
      cashSales: 0,
      cardSales: 0,
      mobileSales: 0,
      discountsGiven: 0,
      transactions: 0,
      refunds: 0,
    };

    res.json({ metrics, sales });

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
//
// Body: {
//   client_return_id,   // required for idempotency (same retry-safety as createSale)
//   sale_id,            // real server sale_id — always required here; if the
//                        // underlying sale hasn't synced yet, offlineSync.js
//                        // holds the return in its own queue and does not
//                        // call this endpoint until sale_id is resolved
//   items: [{
//     sale_item_id,      // OPTIONAL — omit when the client never fetched a
//                        // sale_item_id (e.g. returning against a sale that
//                        // was queued offline and only just synced). When
//                        // omitted, resolved server-side via product_id.
//     product_id,
//     quantity,
//     unit_price
//   }],
//   reason
// }
exports.processReturn = async (req, res) => {
  const { client_return_id, sale_id, items, reason } = req.body;
  const userId = req.user.id;

  if (!sale_id || !items || !items.length)
    return res.status(400).json({ error: 'sale_id and items are required' });

  if (!req.shopDB)
    return res.status(500).json({ error: 'Database connection unavailable.' });

  const client = await req.shopDB.connect();

  try {
    // Idempotency check — mirrors createSale. A retried sync (dropped
    // response after commit, cashier double-tapping while a queued return
    // is mid-flight, etc.) must not create a second return for the same
    // client_return_id.
    if (client_return_id) {
      const existingReturn = await client.query(
        `SELECT * FROM returns WHERE client_return_id = $1`,
        [client_return_id]
      );
      if (existingReturn.rows.length > 0) {
        return res.json({
          success: true,
          return: existingReturn.rows[0],
          already_existed: true,
        });
      }
    }

    await client.query('BEGIN');

    // 1. Verify sale exists and get store_id + status (lock sale row)
    const saleCheck = await client.query(
      `SELECT sale_id, store_id, status FROM sales WHERE sale_id = $1 FOR UPDATE`,
      [sale_id]
    );
    if (saleCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Original sale not found.' });
    }

    const { store_id: saleStoreId, status: saleStatus } = saleCheck.rows[0];

    if (saleStatus === 'returned') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This sale has already been fully returned.' });
    }

    // 2. Resolve each item to a real sale_item_id, then validate against
    //    actual sale_items, price tampering, and already-returned qty.
    const resolvedItems = [];

    for (const item of items) {
      const returnQty = parseFloat(item.quantity);
      if (isNaN(returnQty) || returnQty <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Return quantity must be greater than 0 for product ID ${item.product_id}.`
        });
      }

      let saleItemId = item.sale_item_id || null;

      if (!saleItemId) {
        const lookup = await client.query(
          `SELECT sale_item_id FROM sale_items WHERE sale_id = $1 AND product_id = $2`,
          [sale_id, item.product_id]
        );
        if (lookup.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: `Product ID ${item.product_id} was not found on this sale.`
          });
        }
        saleItemId = lookup.rows[0].sale_item_id;
      }

      // Lock the sale_item row and retrieve original sale price, quantity, and product name
      const saleItemCheck = await client.query(
        `SELECT
           si.sale_item_id,
           si.product_id,
           si.price AS original_unit_price,
           si.quantity AS sold_qty,
           p.name AS product_name
         FROM sale_items si
         JOIN products p ON p.product_id = si.product_id
         WHERE si.sale_item_id = $1 AND si.sale_id = $2
         FOR UPDATE OF si`,
        [saleItemId, sale_id]
      );

      if (saleItemCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Item with sale_item_id ${saleItemId} does not belong to this sale.`
        });
      }

      const { original_unit_price, sold_qty, product_name } = saleItemCheck.rows[0];
      const authoritativePrice = parseFloat(original_unit_price);

      // Validate submitted unit_price against original sale item price (if provided)
      if (item.unit_price !== undefined && item.unit_price !== null) {
        const submittedUnitPrice = parseFloat(item.unit_price);
        if (isNaN(submittedUnitPrice) || Math.round(submittedUnitPrice * 100) !== Math.round(authoritativePrice * 100)) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: `Price mismatch for returned product "${product_name}" (ID: ${item.product_id}): submitted ${submittedUnitPrice}, expected original price ${authoritativePrice}`
          });
        }
      }

      // Query already-returned quantity for this sale item
      const returnedQtyCheck = await client.query(
        `SELECT COALESCE(SUM(ri.quantity), 0)::DECIMAL AS returned_qty
         FROM return_items ri
         WHERE ri.sale_item_id = $1`,
        [saleItemId]
      );
      const returned_qty = returnedQtyCheck.rows[0].returned_qty;

      const returnable = parseFloat(sold_qty) - parseFloat(returned_qty);

      if (returnQty > returnable) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Return quantity (${returnQty}) exceeds returnable quantity (${returnable}) for product ID ${item.product_id}.`
        });
      }

      resolvedItems.push({
        sale_item_id: saleItemId,
        product_id: item.product_id,
        quantity: returnQty,
        authoritative_price: authoritativePrice
      });
    }

    // 3. Insert return header
    const returnResult = await client.query(
      `INSERT INTO returns (sale_id, user_id, reason, client_return_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sale_id, userId, reason || null, client_return_id || null]
    );
    const ret = returnResult.rows[0];

    // 4. Insert return line items and restore stock
    for (const rItem of resolvedItems) {
      const lineSubtotal = Math.round(rItem.authoritative_price * rItem.quantity * 100) / 100;

      // Link return_item to the exact sale_item so double-return is trackable
      await client.query(
        `INSERT INTO return_items (return_id, sale_item_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [ret.return_id, rItem.sale_item_id, rItem.product_id, rItem.quantity, rItem.authoritative_price, lineSubtotal]
      );

      // Restore products.stock
      await client.query(
        `UPDATE products
         SET stock = stock + $1
         WHERE product_id = $2`,
        [rItem.quantity, rItem.product_id]
      );

      // Restore store_inventory
      if (saleStoreId) {
        await client.query(
          `UPDATE store_inventory
           SET quantity = quantity + $1
           WHERE store_id = $2 AND product_id = $3`,
          [rItem.quantity, saleStoreId, rItem.product_id]
        );
      }
    }

    // 5. Check if ALL items in this sale are now fully returned
    //    If yes → mark sale as 'returned'
    const remainingCheck = await client.query(
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
      await client.query(
        `UPDATE sales SET status = 'returned' WHERE sale_id = $1`, [sale_id]
      );
    }

    await client.query('COMMIT');
    return res.json({ success: true, return: ret });

  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('[RETURN] ROLLBACK error:', rbErr.message);
    }

    // Unique violation on client_return_id — a concurrent retry beat us to
    // it between the idempotency check above and the INSERT. Treat it the
    // same as the idempotency check finding it: fetch and return what's
    // already there instead of surfacing a 500.
    if (error.code === '23505' && client_return_id) {
      try {
        const existingReturn = await req.shopDB.query(
          `SELECT * FROM returns WHERE client_return_id = $1`,
          [client_return_id]
        );
        if (existingReturn.rows.length > 0) {
          return res.json({ success: true, return: existingReturn.rows[0], already_existed: true });
        }
      } catch (lookupErr) {
        console.error('[RETURN] post-conflict lookup failed:', lookupErr.message);
      }
    }

    console.error('[RETURN] processReturn error:', error.message);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};