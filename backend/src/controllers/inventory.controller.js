

const LOW_STOCK_THRESHOLD = 10; 

//  helpers 

const getStatus = (qty) => {
  if (qty === 0) return 'Out of Stock';
  if (qty <= LOW_STOCK_THRESHOLD) return 'Low Stock';
  return 'In Stock';
};

//  GET /api/inventory/summary 
exports.getSummary = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  try {
    const result = await req.shopDB.query(
      `SELECT
         COUNT(*)::INT                                                           AS total_products,
         COUNT(*) FILTER (WHERE COALESCE(si.quantity, p.stock, 0) >  $1)::INT   AS in_stock,
         COUNT(*) FILTER (WHERE COALESCE(si.quantity, p.stock, 0) >  0
                            AND COALESCE(si.quantity, p.stock, 0) <= $1)::INT   AS low_stock,
         COUNT(*) FILTER (WHERE COALESCE(si.quantity, p.stock, 0) =  0)::INT   AS out_of_stock
       FROM products p
       LEFT JOIN store_inventory si
              ON si.product_id = p.product_id
             AND si.store_id   = p.store_id`,
      [LOW_STOCK_THRESHOLD]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[INVENTORY] getSummary:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

//  GET /api/inventory 
exports.getInventory = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  // optional filters: ?store_id=&category_id=&status=&search=
  const { store_id, category_id, status, search } = req.query;

  try {
    const params = [];
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

    const whereClause =
      conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await req.shopDB.query(
      `SELECT
         p.product_id,
         p.name,
         p.barcode,
         p.price,
         p.unit,
         p.description,
         p.image_url,
         p.created_at,
         p.store_id,
         p.category_id,
         c.name  AS category_name,
         s.name  AS store_name,
         COALESCE(si.quantity, p.stock, 0)::INT AS stock
       FROM products p
       LEFT JOIN categories      c  ON c.category_id = p.category_id
       LEFT JOIN stores          s  ON s.store_id    = p.store_id
       LEFT JOIN store_inventory si ON si.product_id = p.product_id
                                   AND si.store_id   = p.store_id
       ${whereClause}
       ORDER BY p.created_at DESC`,
      params
    );

    let rows = result.rows.map((r) => ({ ...r, status: getStatus(r.stock) }));

    // client-side status filter (cheaper than adding a sub-query)
    if (status) {
      rows = rows.filter((r) => r.status === status);
    }

    res.json(rows);
  } catch (err) {
    console.error('[INVENTORY] getInventory:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

//  PUT /api/inventory/:productId/adjust 
// Body: { store_id, quantity, note }   (quantity is the NEW absolute value)
exports.adjustStock = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { productId } = req.params;
  const { store_id, quantity } = req.body;

  if (quantity === undefined || isNaN(parseInt(quantity)) || parseInt(quantity) < 0)
    return res.status(400).json({ message: 'Valid non-negative quantity is required.' });
  if (!store_id)
    return res.status(400).json({ message: 'store_id is required.' });

  const qty = parseInt(quantity);

  try {
    // confirm product exists
    const check = await req.shopDB.query(
      `SELECT product_id FROM products WHERE product_id = $1`, [productId]
    );
    if (!check.rows.length)
      return res.status(404).json({ message: 'Product not found.' });

    // update store_inventory (upsert)
    await req.shopDB.query(
      `INSERT INTO store_inventory (store_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (store_id, product_id)
       DO UPDATE SET quantity = EXCLUDED.quantity`,
      [parseInt(store_id), parseInt(productId), qty]
    );

    // keep products.stock in sync
    await req.shopDB.query(
      `UPDATE products SET stock = $1, quantity = $1 WHERE product_id = $2`,
      [qty, parseInt(productId)]
    );

    res.json({ message: 'Stock adjusted successfully.', stock: qty, status: getStatus(qty) });
  } catch (err) {
    console.error('[INVENTORY] adjustStock:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

//  GET /api/inventory/stores 
exports.getStores = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  try {
    const result = await req.shopDB.query(
      `SELECT store_id, name FROM stores ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[INVENTORY] getStores:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};