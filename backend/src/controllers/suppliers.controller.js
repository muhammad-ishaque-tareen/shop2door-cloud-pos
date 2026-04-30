
/* 
   GET /api/suppliers/summary
   Returns aggregate stats for the summary cards
 */
exports.getSummary = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  try {
    const result = await req.shopDB.query(`
      SELECT
        COUNT(DISTINCT s.supplier_id)::INT                              AS total,
        COUNT(DISTINCT CASE
          WHEN so.created_at >= date_trunc('month', NOW())
          THEN so.supplier_id END)::INT                                 AS active_month,
        COUNT(so.order_id)::INT                                         AS total_orders,
        COALESCE(SUM(so.total), 0)                                      AS total_spent
      FROM suppliers s
      LEFT JOIN supply_orders so ON so.supplier_id = s.supplier_id
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[SUPPLIERS] getSummary:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

/* 
   GET /api/suppliers
   Returns all suppliers with order count and total spent
 */
exports.getSuppliers = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  try {
    const result = await req.shopDB.query(`
      SELECT
        s.supplier_id,
        s.name,
        s.contact_person,
        s.phone,
        s.email,
        s.address,
        s.created_at,
        COUNT(so.order_id)::INT          AS order_count,
        COALESCE(SUM(so.total), 0)       AS total_spent,
        MAX(so.created_at)               AS last_order_date
      FROM suppliers s
      LEFT JOIN supply_orders so ON so.supplier_id = s.supplier_id
      GROUP BY s.supplier_id
      ORDER BY s.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('[SUPPLIERS] getSuppliers:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

   // POST /api/suppliers
   // Create a new supplier

exports.createSupplier = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { name, contact_person, phone, email, address } = req.body;
  if (!name || !name.trim())
    return res.status(400).json({ message: 'Supplier name is required.' });

  try {
    const result = await req.shopDB.query(
      `INSERT INTO suppliers (name, contact_person, phone, email, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), contact_person || null, phone || null, email || null, address || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[SUPPLIERS] createSupplier:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

 //  PUT /api/suppliers/:id
 //  Update supplier details

exports.updateSupplier = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id } = req.params;
  const { name, contact_person, phone, email, address } = req.body;

  if (!name || !name.trim())
    return res.status(400).json({ message: 'Supplier name is required.' });

  try {
    const result = await req.shopDB.query(
      `UPDATE suppliers
       SET name = $1, contact_person = $2, phone = $3, email = $4, address = $5
       WHERE supplier_id = $6
       RETURNING *`,
      [name.trim(), contact_person || null, phone || null, email || null, address || null, parseInt(id)]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'Supplier not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[SUPPLIERS] updateSupplier:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

 //  DELETE /api/suppliers/:id
//   Delete a supplier (cascades to supply_orders and items)

exports.deleteSupplier = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id } = req.params;

  try {
    // Delete in order: items → orders → supplier
    await req.shopDB.query(
      `DELETE FROM supply_order_items
       WHERE order_id IN (
         SELECT order_id FROM supply_orders WHERE supplier_id = $1
       )`,
      [parseInt(id)]
    );
    await req.shopDB.query(
      `DELETE FROM supply_orders WHERE supplier_id = $1`, [parseInt(id)]
    );
    const result = await req.shopDB.query(
      `DELETE FROM suppliers WHERE supplier_id = $1 RETURNING supplier_id`, [parseInt(id)]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'Supplier not found.' });
    res.json({ message: 'Supplier deleted successfully.' });
  } catch (err) {
    console.error('[SUPPLIERS] deleteSupplier:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

 //  GET /api/suppliers/:id/orders
 //  Returns all supply orders for a specific supplier,
 //  with their line items joined in
exports.getOrders = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id } = req.params;

  try {
    // Fetch orders
    const ordersRes = await req.shopDB.query(
      `SELECT
         so.order_id,
         so.total,
         so.status,
         so.created_at,
         st.name AS store_name
       FROM supply_orders so
       LEFT JOIN stores st ON st.store_id = so.store_id
       WHERE so.supplier_id = $1
       ORDER BY so.created_at DESC`,
      [parseInt(id)]
    );

    if (!ordersRes.rows.length) return res.json([]);

    // Fetch all line items for these orders in one query
    const orderIds = ordersRes.rows.map(o => o.order_id);
    const itemsRes = await req.shopDB.query(
      `SELECT
         soi.order_id,
         soi.quantity,
         soi.price,
         p.name AS product_name
       FROM supply_order_items soi
       LEFT JOIN products p ON p.product_id = soi.product_id
       WHERE soi.order_id = ANY($1::int[])`,
      [orderIds]
    );

    // Attach items to their orders
    const itemsByOrder = {};
    itemsRes.rows.forEach(item => {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    });

    const orders = ordersRes.rows.map(o => ({
      ...o,
      items: itemsByOrder[o.order_id] || [],
    }));

    res.json(orders);
  } catch (err) {
    console.error('[SUPPLIERS] getOrders:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};


  // POST /api/suppliers/:id/orders
//Create a new supply order with line items
  // Body: { store_id, items: [{ product_id, quantity, price }], total }
exports.createOrder = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id }                         = req.params;
  const { store_id, items, total }     = req.body;
  const user_id                        = req.user?.user_id || req.user?.id || null;

  if (!store_id)
    return res.status(400).json({ message: 'store_id is required.' });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ message: 'At least one order item is required.' });

  const client = await req.shopDB.connect();
  try {
    await client.query('BEGIN');

    // Insert supply order
    const orderRes = await client.query(
      `INSERT INTO supply_orders (store_id, supplier_id, user_id, total, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING order_id`,
      [parseInt(store_id), parseInt(id), user_id, parseFloat(total) || 0]
    );
    const order_id = orderRes.rows[0].order_id;

    // Insert line items
    for (const item of items) {
      await client.query(
        `INSERT INTO supply_order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [
          order_id,
          parseInt(item.product_id),
          parseFloat(item.quantity) || 1,
          parseFloat(item.price)    || 0,
        ]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Supply order created.', order_id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SUPPLIERS] createOrder:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  } finally {
    client.release();
  }
};