// GET /api/categories
exports.getCategories = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  try {
    // Also count how many products belong to each category
    const result = await req.shopDB.query(
      `SELECT
         c.category_id,
         c.name,
         c.created_at,
         COUNT(p.product_id)::INT AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.category_id
       GROUP BY c.category_id, c.name, c.created_at
       ORDER BY c.name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[CATEGORY] getCategories:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/categories/:id
exports.getCategoryById = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id } = req.params;
  try {
    const result = await req.shopDB.query(
      `SELECT
         c.category_id,
         c.name,
         c.created_at,
         COUNT(p.product_id)::INT AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.category_id
       WHERE c.category_id = $1
       GROUP BY c.category_id, c.name, c.created_at`,
      [id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'Category not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[CATEGORY] getCategoryById:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// POST /api/categories
exports.createCategory = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { name } = req.body;
  if (!name || !name.trim())
    return res.status(400).json({ message: 'Category name is required.' });

  try {
    // Duplicate check (case-insensitive)
    const dup = await req.shopDB.query(
      `SELECT category_id FROM categories WHERE LOWER(name) = LOWER($1)`,
      [name.trim()]
    );
    if (dup.rows.length)
      return res.status(409).json({ message: 'A category with this name already exists.' });

    const result = await req.shopDB.query(
      `INSERT INTO categories (name) VALUES ($1) RETURNING *`,
      [name.trim()]
    );

    // Return with product_count = 0 so the frontend doesn't need a re-fetch
    res.status(201).json({ ...result.rows[0], product_count: 0 });
  } catch (err) {
    console.error('[CATEGORY] createCategory:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id }  = req.params;
  const { name } = req.body;

  if (!name || !name.trim())
    return res.status(400).json({ message: 'Category name is required.' });

  try {
    // Check exists
    const existing = await req.shopDB.query(
      `SELECT category_id FROM categories WHERE category_id = $1`, [id]
    );
    if (!existing.rows.length)
      return res.status(404).json({ message: 'Category not found.' });

    // Duplicate check (exclude self)
    const dup = await req.shopDB.query(
      `SELECT category_id FROM categories
       WHERE LOWER(name) = LOWER($1) AND category_id <> $2`,
      [name.trim(), id]
    );
    if (dup.rows.length)
      return res.status(409).json({ message: 'Another category with this name already exists.' });

    const result = await req.shopDB.query(
      `UPDATE categories SET name = $1 WHERE category_id = $2 RETURNING *`,
      [name.trim(), id]
    );

    // Fetch product count for the updated row
    const countRes = await req.shopDB.query(
      `SELECT COUNT(product_id)::INT AS product_count FROM products WHERE category_id = $1`,
      [id]
    );

    res.json({ ...result.rows[0], product_count: countRes.rows[0].product_count });
  } catch (err) {
    console.error('[CATEGORY] updateCategory:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id } = req.params;
  try {
    const existing = await req.shopDB.query(
      `SELECT category_id FROM categories WHERE category_id = $1`, [id]
    );
    if (!existing.rows.length)
      return res.status(404).json({ message: 'Category not found.' });

    // Unlink products before deleting the category
    await req.shopDB.query(
      `UPDATE products SET category_id = NULL WHERE category_id = $1`, [id]
    );

    await req.shopDB.query(
      `DELETE FROM categories WHERE category_id = $1`, [id]
    );

    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('[CATEGORY] deleteCategory:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};