// suppliers.controller.js

/*  tiny validation helpers  */
const isValidEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isValidPhone = (p) => !p || /^[\d\s\-+()]{7,20}$/.test(p);

/* GET /api/suppliers/summary */
exports.getSummary = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });
  try {
    const result = await req.shopDB.query(`
      SELECT
        COUNT(DISTINCT s.supplier_id)::INT                          AS total,
        COUNT(DISTINCT CASE
          WHEN so.created_at >= date_trunc('month', NOW())
          THEN so.supplier_id END)::INT                             AS active_month,
        COUNT(so.order_id)::INT                                     AS total_orders,
        COUNT(so.order_id) FILTER (WHERE so.status='pending')::INT  AS pending_orders,
        COUNT(so.order_id) FILTER (WHERE so.status='received')::INT AS received_orders,
        COALESCE(SUM(so.total), 0)                                  AS total_spent
      FROM suppliers s
      LEFT JOIN supply_orders so ON so.supplier_id = s.supplier_id
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[SUPPLIERS] getSummary:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

/* GET /api/suppliers  — paginated + searchable */
exports.getSuppliers = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 20);
  const search = req.query.search?.trim() || '';
  const offset = (page - 1) * limit;

  try {
    const params  = [];
    let   where   = '';

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where = `WHERE (
        LOWER(s.name)           LIKE $1 OR
        LOWER(s.phone)          LIKE $1 OR
        LOWER(s.email)          LIKE $1 OR
        LOWER(s.contact_person) LIKE $1
      )`;
    }

    // total count for pagination meta
    const countRes = await req.shopDB.query(
      `SELECT COUNT(*)::INT AS total FROM suppliers s ${where}`,
      params
    );
    const total = countRes.rows[0].total;

    // paginated rows
    const dataParams = [...params, limit, offset];
    const limitIdx   = params.length + 1;
    const offsetIdx  = params.length + 2;

    const result = await req.shopDB.query(
      `SELECT
         s.supplier_id,
         s.name,
         s.contact_person,
         s.phone,
         s.email,
         s.address,
         s.created_at,
         COUNT(so.order_id)::INT                                      AS order_count,
         COUNT(so.order_id) FILTER (WHERE so.status='pending')::INT   AS pending_orders,
         COUNT(so.order_id) FILTER (WHERE so.status='received')::INT  AS received_orders,
         COALESCE(SUM(so.total), 0)                                   AS total_spent,
         MAX(so.created_at)                                           AS last_order_date
       FROM suppliers s
       LEFT JOIN supply_orders so ON so.supplier_id = s.supplier_id
       ${where}
       GROUP BY s.supplier_id
       ORDER BY s.name ASC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      dataParams
    );

    res.json({
      data:        result.rows,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[SUPPLIERS] getSuppliers:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

/* POST /api/suppliers */
exports.createSupplier = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { name, contact_person, phone, email, address } = req.body;

  if (!name || !name.trim())
    return res.status(400).json({ message: 'Supplier name is required.' });
  if (!isValidEmail(email))
    return res.status(400).json({ message: 'Invalid email format.' });
  if (!isValidPhone(phone))
    return res.status(400).json({ message: 'Invalid phone number format.' });

  try {
    // duplicate name check
    const dup = await req.shopDB.query(
      `SELECT 1 FROM suppliers WHERE LOWER(name) = LOWER($1)`,
      [name.trim()]
    );
    if (dup.rows.length)
      return res.status(409).json({ message: 'A supplier with this name already exists.' });

    const result = await req.shopDB.query(
      `INSERT INTO suppliers (name, contact_person, phone, email, address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), contact_person || null, phone || null, email || null, address || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[SUPPLIERS] createSupplier:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

/* PUT /api/suppliers/:id */
exports.updateSupplier = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id } = req.params;
  const { name, contact_person, phone, email, address } = req.body;

  if (!name || !name.trim())
    return res.status(400).json({ message: 'Supplier name is required.' });
  if (!isValidEmail(email))
    return res.status(400).json({ message: 'Invalid email format.' });
  if (!isValidPhone(phone))
    return res.status(400).json({ message: 'Invalid phone number format.' });

  try {
    // duplicate name check (excluding self)
    const dup = await req.shopDB.query(
      `SELECT 1 FROM suppliers WHERE LOWER(name) = LOWER($1) AND supplier_id <> $2`,
      [name.trim(), parseInt(id)]
    );
    if (dup.rows.length)
      return res.status(409).json({ message: 'Another supplier with this name already exists.' });

    const result = await req.shopDB.query(
      `UPDATE suppliers
       SET name=$1, contact_person=$2, phone=$3, email=$4, address=$5
       WHERE supplier_id=$6 RETURNING *`,
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

/* DELETE /api/suppliers/:id  — wrapped in transaction, soft-delete aware */
exports.deleteSupplier = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id } = req.params;
  const client = await req.shopDB.connect();
  try {
    await client.query('BEGIN');

    // verify supplier exists
    const check = await client.query(
      `SELECT supplier_id FROM suppliers WHERE supplier_id = $1`, [parseInt(id)]
    );
    if (!check.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    // cascade delete in correct order inside transaction
    await client.query(
      `DELETE FROM supply_order_items
       WHERE order_id IN (SELECT order_id FROM supply_orders WHERE supplier_id = $1)`,
      [parseInt(id)]
    );
    await client.query(
      `DELETE FROM supply_orders WHERE supplier_id = $1`, [parseInt(id)]
    );
    await client.query(
      `DELETE FROM suppliers WHERE supplier_id = $1`, [parseInt(id)]
    );

    await client.query('COMMIT');
    res.json({ message: 'Supplier deleted successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SUPPLIERS] deleteSupplier:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  } finally {
    client.release();
  }
};

/* GET /api/suppliers/:id/orders */
exports.getOrders = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id } = req.params;
  try {
    const ordersRes = await req.shopDB.query(
      `SELECT so.order_id, so.total, so.status, so.invoice_number,
              so.notes, so.created_at, st.name AS store_name
       FROM supply_orders so
       LEFT JOIN stores st ON st.store_id = so.store_id
       WHERE so.supplier_id = $1
       ORDER BY so.created_at DESC`,
      [parseInt(id)]
    );
    if (!ordersRes.rows.length) return res.json([]);

    const orderIds = ordersRes.rows.map(o => o.order_id);
    const itemsRes = await req.shopDB.query(
      `SELECT soi.order_id,
              soi.quantity,
              soi.quantity_received,
              soi.price,
              soi.product_name,
              p.name AS db_product_name
       FROM supply_order_items soi
       LEFT JOIN products p ON p.product_id = soi.product_id
       WHERE soi.order_id = ANY($1::int[])`,
      [orderIds]
    );

    const itemsByOrder = {};
    itemsRes.rows.forEach(item => {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push({
        ...item,
        product_name: item.product_name || item.db_product_name || '—',
      });
    });

    res.json(ordersRes.rows.map(o => ({ ...o, items: itemsByOrder[o.order_id] || [] })));
  } catch (err) {
    console.error('[SUPPLIERS] getOrders:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

/* POST /api/suppliers/:id/orders */
exports.createOrder = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id }                                      = req.params;
  const { store_id, items, invoice_number, notes }  = req.body;

  if (!store_id)
    return res.status(400).json({ message: 'store_id is required.' });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ message: 'At least one order item is required.' });

  // validate each line
  for (const [i, item] of items.entries()) {
    if (!item.product_name || !String(item.product_name).trim())
      return res.status(400).json({ message: `Item ${i + 1}: product name is required.` });
    if (!item.price || parseFloat(item.price) <= 0)
      return res.status(400).json({ message: `Item ${i + 1}: price must be greater than 0.` });
    if (!item.quantity || parseFloat(item.quantity) < 1)
      return res.status(400).json({ message: `Item ${i + 1}: quantity must be at least 1.` });
  }

  const client = await req.shopDB.connect();
  try {
    await client.query('BEGIN');

    // validate store exists
    const storeCheck = await client.query(
      `SELECT store_id FROM stores WHERE store_id = $1`, [parseInt(store_id)]
    );
    if (!storeCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Store not found.' });
    }

    // validate supplier exists
    const supCheck = await client.query(
      `SELECT supplier_id FROM suppliers WHERE supplier_id = $1`, [parseInt(id)]
    );
    if (!supCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    // recalculate total on backend — never trust client
    const computedTotal = items.reduce(
      (sum, it) => sum + (parseFloat(it.price) || 0) * (parseFloat(it.quantity) || 0),
      0
    );

    // check column existence once
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'supply_order_items'
        AND column_name IN ('product_name', 'quantity_received')
    `);
    const cols          = colCheck.rows.map(r => r.column_name);
    const hasProductName = cols.includes('product_name');
    const hasQtyRec      = cols.includes('quantity_received');

    // insert order
    const orderRes = await client.query(
      `INSERT INTO supply_orders
         (store_id, supplier_id, total, status, invoice_number, notes)
       VALUES ($1, $2, $3, 'pending', $4, $5)
       RETURNING order_id`,
      [parseInt(store_id), parseInt(id), computedTotal,
       invoice_number || null, notes || null]
    );
    const order_id = orderRes.rows[0].order_id;

    // insert line items
    for (const item of items) {
      const productId = item.product_id ? parseInt(item.product_id) : null;
      const qty       = parseFloat(item.quantity) || 1;
      const price     = parseFloat(item.price)    || 0;

      if (hasProductName && hasQtyRec) {
        await client.query(
          `INSERT INTO supply_order_items
             (order_id, product_id, product_name, quantity, quantity_received, price)
           VALUES ($1, $2, $3, $4, 0, $5)`,
          [order_id, productId, item.product_name.trim(), qty, price]
        );
      } else if (hasProductName) {
        await client.query(
          `INSERT INTO supply_order_items
             (order_id, product_id, product_name, quantity, price)
           VALUES ($1, $2, $3, $4, $5)`,
          [order_id, productId, item.product_name.trim(), qty, price]
        );
      } else {
        await client.query(
          `INSERT INTO supply_order_items
             (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [order_id, productId, qty, price]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Supply order created.', order_id, total: computedTotal });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SUPPLIERS] createOrder:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  } finally {
    client.release();
  }
};

/*
  PUT /api/suppliers/:id/orders/:orderId/status
  Body: { status: 'received' | 'cancelled' | 'pending' }

  When status → 'received':
    - Update quantity_received on each item to = quantity (full delivery)
    - Upsert store_inventory for every linked product
    - Also keep products.stock in sync (same pattern as inventory controller)
*/
exports.updateOrderStatus = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id, orderId }  = req.params;
  const { status }       = req.body;

  const VALID = ['pending', 'received', 'cancelled'];
  if (!VALID.includes(status))
    return res.status(400).json({ message: `status must be one of: ${VALID.join(', ')}.` });

  const client = await req.shopDB.connect();
  try {
    await client.query('BEGIN');

    // fetch order — verify it belongs to this supplier
    const ordRes = await client.query(
      `SELECT so.order_id, so.store_id, so.status
       FROM supply_orders so
       WHERE so.order_id = $1 AND so.supplier_id = $2`,
      [parseInt(orderId), parseInt(id)]
    );
    if (!ordRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found for this supplier.' });
    }

    const order      = ordRes.rows[0];
    const prevStatus = order.status;

    // prevent re-receiving or re-cancelling
    if (prevStatus === status) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Order is already '${status}'.` });
    }
    if (prevStatus === 'received' && status !== 'received') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cannot change status of an already received order.' });
    }

    // update order status
    await client.query(
      `UPDATE supply_orders SET status = $1 WHERE order_id = $2`,
      [status, parseInt(orderId)]
    );

    //  INVENTORY UPDATE on receive 
    if (status === 'received') {
      const itemsRes = await client.query(
        `SELECT soi.product_id, soi.quantity, soi.quantity_received
         FROM supply_order_items soi
         WHERE soi.order_id = $1 AND soi.product_id IS NOT NULL`,
        [parseInt(orderId)]
      );

      for (const item of itemsRes.rows) {
        const qty = parseFloat(item.quantity) || 0;

        // mark quantity_received = quantity_ordered (full delivery)
        const hasQtyRec = await client.query(`
          SELECT 1 FROM information_schema.columns
          WHERE table_name='supply_order_items' AND column_name='quantity_received'
        `);
        if (hasQtyRec.rows.length) {
          await client.query(
            `UPDATE supply_order_items
             SET quantity_received = $1
             WHERE order_id = $2 AND product_id = $3`,
            [qty, parseInt(orderId), item.product_id]
          );
        }

        // upsert store_inventory — add incoming stock
        await client.query(
          `INSERT INTO store_inventory (store_id, product_id, quantity)
           VALUES ($1, $2, $3)
           ON CONFLICT (store_id, product_id)
           DO UPDATE SET quantity = store_inventory.quantity + EXCLUDED.quantity`,
          [order.store_id, item.product_id, qty]
        );

        // keep products.stock in sync
        await client.query(
          `UPDATE products
           SET stock    = stock    + $1,
               quantity = quantity + $1
           WHERE product_id = $2`,
          [qty, item.product_id]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: `Order marked as '${status}'.`, order_id: parseInt(orderId), status });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SUPPLIERS] updateOrderStatus:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  } finally {
    client.release();
  }
};