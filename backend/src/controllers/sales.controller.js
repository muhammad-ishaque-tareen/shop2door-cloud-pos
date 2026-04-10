exports.createSale = async (req, res) => {
  const { items, subtotal, tax, discount, total, payment_method } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await req.shopDB.query('BEGIN');

    const receiptNo = 'RCP-' + Date.now();
    const masterPool = require('../db/master.pool');
    const userResult = await masterPool.query(
      'SELECT name FROM users WHERE id = $1',
      [req.user.id]
    );
    const cashierName = userResult.rows[0]?.name || req.user.name || 'Unknown';
    const cashierId = req.user.id;

    console.log('Creating sale:', { receiptNo, cashierName, cashierId, items: items.length });

    const saleResult = await req.shopDB.query(
      `INSERT INTO sales (receipt_no, cashier_name, cashier_id, items, subtotal, tax, discount, total, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [receiptNo, cashierName, cashierId, JSON.stringify(items), subtotal, tax, discount, total, payment_method]
    );

    for (const item of items) {
      console.log(`Updating product ${item.product_id}: -${item.quantity} stock, +${item.quantity} purchases`);

      const updateResult = await req.shopDB.query(
        `UPDATE products 
         SET stock = stock - $1,
             purchase_count = purchase_count + $1
         WHERE id = $2 AND stock >= $1
         RETURNING id, name, stock, purchase_count`,
        [item.quantity, item.product_id]
      );

      if (updateResult.rows.length === 0) {
        throw new Error(`Insufficient stock for product ID ${item.product_id}`);
      }

      const product = updateResult.rows[0];
      console.log(`✓ Updated ${product.name}: Stock=${product.stock}, Purchases=${product.purchase_count}`);
    }

    await req.shopDB.query('COMMIT');
    console.log('✓ Sale completed successfully:', receiptNo);

    res.json({
      success: true,
      receipt_no: receiptNo,
      sale: saleResult.rows[0]
    });
  } catch (error) {
    await req.shopDB.query('ROLLBACK');
    console.error('❌ Error creating sale:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getMySales = async (req, res) => {
  try {
    
    const cashierId = req.user.id;
    let result;
    try {
      result = await req.shopDB.query(
        `SELECT * FROM sales WHERE cashier_id = $1 ORDER BY sale_date DESC`,
        [cashierId]
      );
    } catch (e) {
      console.warn('cashier_id column not found, falling back to cashier_name');
      const masterPool = require('../db/master.pool');
      const userResult = await masterPool.query(
        'SELECT name FROM users WHERE id = $1',
        [cashierId]
      );
      const cashierName = userResult.rows[0]?.name;
      result = await req.shopDB.query(
        `SELECT * FROM sales WHERE cashier_name = $1 ORDER BY sale_date DESC`,
        [cashierName]
      );
    }

    const sales = result.rows;

    const totalSales = sales.reduce((sum, s) => sum + parseFloat(s.total), 0);
    const cashSales = sales
      .filter(s => s.payment_method === 'Cash')
      .reduce((sum, s) => sum + parseFloat(s.total), 0);
    const cardSales = sales
      .filter(s => s.payment_method === 'Card')
      .reduce((sum, s) => sum + parseFloat(s.total), 0);
    const discountsGiven = sales.reduce((sum, s) => sum + parseFloat(s.discount), 0);
    const transactions = sales.length;
    let refundResult;
    try {
      refundResult = await req.shopDB.query(
        `SELECT r.* FROM returns r
         JOIN sales s ON r.sale_id = s.id
         WHERE s.cashier_id = $1`,
        [cashierId]
      );
    } catch (e) {
      const masterPool = require('../db/master.pool');
      const userResult = await masterPool.query(
        'SELECT name FROM users WHERE id = $1',
        [cashierId]
      );
      const cashierName = userResult.rows[0]?.name;
      refundResult = await req.shopDB.query(
        `SELECT r.* FROM returns r
         JOIN sales s ON r.sale_id = s.id
         WHERE s.cashier_name = $1`,
        [cashierName]
      );
    }

    const refunds = refundResult.rows.reduce((sum, r) => {
      const items = Array.isArray(r.items) ? r.items :
        (typeof r.items === 'string' ? JSON.parse(r.items) : []);
      return sum + items.reduce((s, i) =>
        s + (parseFloat(i.price || 0) * parseInt(i.quantity || 0)), 0);
    }, 0);

    res.json({
      metrics: { totalSales, cashSales, cardSales, discountsGiven, transactions, refunds },
      sales
    });
  } catch (error) {
    console.error('getMySales error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getSaleByReceipt = async (req, res) => {
  const { receipt_no } = req.params;
  try {
    const result = await req.shopDB.query(
      `SELECT * FROM sales WHERE receipt_no = $1`,
      [receipt_no]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Sale not found' });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.processReturn = async (req, res) => {
  const { sale_id, items, reason } = req.body;

  try {
    await req.shopDB.query('BEGIN');

    const returnResult = await req.shopDB.query(
      `INSERT INTO returns (sale_id, items, reason)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [sale_id, JSON.stringify(items), reason]
    );

    for (const item of items) {
      await req.shopDB.query(
        `UPDATE products SET stock = stock + $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await req.shopDB.query('COMMIT');

    res.json({ success: true, return: returnResult.rows[0] });
  } catch (error) {
    await req.shopDB.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
};