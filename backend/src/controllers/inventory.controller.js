// inventory.controller.js

/*  configurable per-product threshold fallback 
   In future each product can have its own reorder_level column.
   Until then we use this global default.                                  */
const DEFAULT_LOW_STOCK = 10;

const getStatus = (qty, threshold = DEFAULT_LOW_STOCK) => {
  if (qty === 0)          return 'Out of Stock';
  if (qty <= threshold)   return 'Low Stock';
  return 'In Stock';
};

/* GET /api/inventory/summary */
exports.getSummary = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  try {
    const result = await req.shopDB.query(
      `SELECT
         COUNT(*)::INT                                                             AS total_products,
         COUNT(*) FILTER (WHERE COALESCE(si.quantity, p.stock, 0) >  $1)::INT     AS in_stock,
         COUNT(*) FILTER (WHERE COALESCE(si.quantity, p.stock, 0) >  0
                            AND COALESCE(si.quantity, p.stock, 0) <= $1)::INT     AS low_stock,
         COUNT(*) FILTER (WHERE COALESCE(si.quantity, p.stock, 0) =  0)::INT      AS out_of_stock,
         COALESCE(SUM(p.price * COALESCE(si.quantity, p.stock, 0)), 0)            AS total_inventory_value
       FROM products p
       LEFT JOIN store_inventory si
              ON si.product_id = p.product_id
             AND si.store_id   = p.store_id`,
      [DEFAULT_LOW_STOCK]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[INVENTORY] getSummary:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

/* GET /api/inventory
   Supports: ?store_id= &category_id= &status= &search= &page= &limit=    */
exports.getInventory = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { store_id, category_id, status, search } = req.query;
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(200, parseInt(req.query.limit) || 50);

  try {
    const params     = [];
    const conditions = [];

    if (store_id) {
      params.push(parseInt(store_id));
      conditions.push(`p.store_id = $${params.length}`);
    }
    if (category_id) {
      params.push(parseInt(category_id));
      conditions.push(`p.category_id = $${params.length}`);
    }
    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(
        `(LOWER(p.name) LIKE $${params.length} OR LOWER(p.barcode) LIKE $${params.length})`
      );
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // count total (before status filter — status is computed, not a DB column)
    const countRes = await req.shopDB.query(
      `SELECT COUNT(*)::INT AS total
       FROM products p
       LEFT JOIN store_inventory si ON si.product_id = p.product_id
                                   AND si.store_id   = p.store_id
       ${whereClause}`,
      params
    );

    const result = await req.shopDB.query(
      `SELECT
         p.product_id,
         p.name,
         p.barcode,
         p.price,
         p.unit,
         p.description,
         p.image_url,
         p.is_active,
         p.created_at,
         p.store_id,
         p.category_id,
         c.name  AS category_name,
         s.name  AS store_name,
         COALESCE(si.quantity, p.stock, 0)::INT AS stock,
         COALESCE(p.reorder_level, $${params.length + 1})::INT AS reorder_level
       FROM products p
       LEFT JOIN categories      c  ON c.category_id = p.category_id
       LEFT JOIN stores          s  ON s.store_id    = p.store_id
       LEFT JOIN store_inventory si ON si.product_id = p.product_id
                                   AND si.store_id   = p.store_id
       ${whereClause}
       ORDER BY p.created_at DESC`,
      [...params, DEFAULT_LOW_STOCK]
    );

    let rows = result.rows.map(r => ({
      ...r,
      status: getStatus(r.stock, r.reorder_level),
    }));

    // status filter (computed field — must filter in app)
    if (status) rows = rows.filter(r => r.status === status);

    // paginate after status filter
    const total      = status ? rows.length : countRes.rows[0].total;
    const paginated  = rows.slice((page - 1) * limit, page * limit);

    res.json({
      data:        paginated,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[INVENTORY] getInventory:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

/* PUT /api/inventory/:productId/adjust
   Body: { store_id, quantity, note }   (quantity = new absolute value)    */
exports.adjustStock = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { productId }        = req.params;
  const { store_id, quantity } = req.body;

  if (quantity === undefined || isNaN(parseInt(quantity)) || parseInt(quantity) < 0)
    return res.status(400).json({ message: 'Valid non-negative quantity is required.' });
  if (!store_id)
    return res.status(400).json({ message: 'store_id is required.' });

  const qty    = parseInt(quantity);
  const client = await req.shopDB.connect();

  try {
    await client.query('BEGIN');

    // verify product exists
    const check = await client.query(
      `SELECT product_id, COALESCE(reorder_level, $1)::INT AS reorder_level
       FROM products WHERE product_id = $2`,
      [DEFAULT_LOW_STOCK, parseInt(productId)]
    );
    if (!check.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Product not found.' });
    }

    // verify store exists
    const storeChk = await client.query(
      `SELECT store_id FROM stores WHERE store_id = $1`, [parseInt(store_id)]
    );
    if (!storeChk.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Store not found.' });
    }

    const reorderLevel = check.rows[0].reorder_level;

    // upsert store_inventory
    await client.query(
      `INSERT INTO store_inventory (store_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (store_id, product_id)
       DO UPDATE SET quantity = EXCLUDED.quantity`,
      [parseInt(store_id), parseInt(productId), qty]
    );

    // keep products.stock in sync
    await client.query(
      `UPDATE products SET stock = $1, quantity = $1 WHERE product_id = $2`,
      [qty, parseInt(productId)]
    );

    await client.query('COMMIT');

    res.json({
      message:       'Stock adjusted successfully.',
      stock:         qty,
      status:        getStatus(qty, reorderLevel),
      reorder_level: reorderLevel,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[INVENTORY] adjustStock:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  } finally {
    client.release();
  }
};

/* GET /api/inventory/stores */
exports.getStores = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  try {
    const result = await req.shopDB.query(
      `SELECT store_id, name FROM stores WHERE is_active = true ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[INVENTORY] getStores:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};