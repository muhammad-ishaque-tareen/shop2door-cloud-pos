
exports.createSale = async (req, res) => {
  const { items, subtotal, tax, discount, total, payment_method } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await req.shopDB.query('BEGIN');

    const receiptNo = 'RCP-' + Date.now();
    const cashierName = req.user.name || 'Cashier';
    
    console.log('Creating sale:', { receiptNo, cashierName, items: items.length });
    const saleResult = await req.shopDB.query(
      `INSERT INTO sales (receipt_no, cashier_name, items, subtotal, tax, discount, total, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [receiptNo, cashierName, JSON.stringify(items), subtotal, tax, discount, total, payment_method]
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