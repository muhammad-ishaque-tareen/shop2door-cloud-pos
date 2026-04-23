// GET /api/products/categories
exports.getCategories = async (req, res) => {
  try {
    const result = await req.shopDB.query(
      `SELECT category_id, name, created_at
       FROM categories
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[PRODUCT] getCategories error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/products/categories
exports.createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim())
    return res.status(400).json({ error: 'Category name is required' });

  try {
    const result = await req.shopDB.query(
      `INSERT INTO categories (name)
       VALUES ($1)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [name.trim()]
    );

    if (result.rows.length === 0)
      return res.status(409).json({ error: 'Category already exists' });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[PRODUCT] createCategory error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const result = await req.shopDB.query(
      `SELECT
         p.product_id,
         p.name,
         p.barcode,
         p.price,
         p.stock,
         p.quantity,
         p.unit,
         p.description,
         p.image_url,
         p.store_id,
         p.created_at,
         c.category_id,
         c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[PRODUCT] getProducts error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await req.shopDB.query(
      `SELECT
         p.product_id,
         p.name,
         p.barcode,
         p.price,
         p.stock,
         p.quantity,
         p.unit,
         p.description,
         p.image_url,
         p.store_id,
         p.created_at,
         c.category_id,
         c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       WHERE p.product_id = $1`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Product not found' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('[PRODUCT] getProductById error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  const {
    name, barcode, price, stock,
    quantity, unit, description,
    category_id, store_id
  } = req.body;

  // image_url comes from multer upload middleware (req.file)
  const image_url = req.file
    ? `/uploads/products/${req.file.filename}`
    : req.body.image_url || null;

  if (!name || !name.trim())
    return res.status(400).json({ error: 'Product name is required' });
  if (price === undefined || price === null)
    return res.status(400).json({ error: 'Price is required' });

  try {
    const result = await req.shopDB.query(
      `INSERT INTO products
         (name, barcode, price, stock, quantity, unit, description,
          category_id, store_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name.trim(),
        barcode  || null,
        parseFloat(price),
        parseInt(stock)    || 0,
        parseFloat(quantity) || 1,
        unit        || null,
        description || null,
        category_id || null,
        store_id    || req.user.store_id || null,
        image_url,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505')
      return res.status(409).json({ error: 'A product with this barcode already exists' });

    console.error('[PRODUCT] createProduct error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    name, barcode, price, stock,
    quantity, unit, description,
    category_id, store_id
  } = req.body;

  // Keep existing image unless a new file was uploaded
  const image_url = req.file
    ? `/uploads/products/${req.file.filename}`
    : req.body.image_url || null;

  if (!name || !name.trim())
    return res.status(400).json({ error: 'Product name is required' });

  try {
    const result = await req.shopDB.query(
      `UPDATE products
       SET name        = $1,
           barcode     = $2,
           price       = $3,
           stock       = $4,
           quantity    = $5,
           unit        = $6,
           description = $7,
           category_id = $8,
           store_id    = $9,
           image_url   = COALESCE($10, image_url)
       WHERE product_id = $11
       RETURNING *`,
      [
        name.trim(),
        barcode     || null,
        parseFloat(price),
        parseInt(stock),
        parseFloat(quantity) || 1,
        unit        || null,
        description || null,
        category_id || null,
        store_id    || null,
        image_url,
        id,
      ]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505')
      return res.status(409).json({ error: 'A product with this barcode already exists' });

    console.error('[PRODUCT] updateProduct error:', error.message);
    res.status(500).json({ error: error.message });
  }
};
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await req.shopDB.query(
      `DELETE FROM products WHERE product_id = $1 RETURNING product_id, name`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    // Foreign key: product is referenced in sale_items
    if (error.code === '23503')
      return res.status(409).json({
        error: 'Cannot delete product — it has existing sales records'
      });

    console.error('[PRODUCT] deleteProduct error:', error.message);
    res.status(500).json({ error: error.message });
  }
};