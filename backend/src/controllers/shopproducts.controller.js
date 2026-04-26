const masterPool = require('../db/master.pool');
const path       = require('path');
const fs         = require('fs');
const multer     = require('multer');


const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'products');

try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (e) {
  console.error('[PRODUCT] CRITICAL: Could not create upload directory:', e.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);  
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed.'));
    }
  },
});

// Export the middleware so routes.js can reference it without re-defining multer
exports.uploadProductImage = upload.single('image');

//  HELPERS 

// Build the public URL stored in the DB
const imageUrl = (file) =>
  file ? `/uploads/products/${file.filename}` : null;

// Delete a file given its public URL  
const deleteOldImage = (url) => {
  if (!url) return;
  // Strip leading slash so path.join doesn't treat it as an absolute path on Windows
  const relative = url.replace(/^\/+/, '');
  const fullPath = path.join(__dirname, '..', '..', relative);
  try {
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (e) {
    console.warn('[PRODUCT] Could not delete old image:', fullPath, e.message);
  }
};

//  CATEGORIES 

// GET /api/products/categories
exports.getCategories = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  try {
    const result = await req.shopDB.query(
      `SELECT category_id, name, created_at
       FROM categories
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[PRODUCT] getCategories:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// POST /api/products/categories
exports.createCategory = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { name } = req.body;
  if (!name || !name.trim())
    return res.status(400).json({ message: 'Category name is required.' });

  try {
    const dup = await req.shopDB.query(
      `SELECT category_id FROM categories WHERE LOWER(name) = LOWER($1)`,
      [name.trim()]
    );
    if (dup.rows.length)
      return res.status(409).json({ message: 'Category already exists.' });

    const result = await req.shopDB.query(
      `INSERT INTO categories (name) VALUES ($1) RETURNING *`,
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[PRODUCT] createCategory:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// DELETE /api/products/categories/:id
exports.deleteCategory = async (req, res) => {
  if (!req.shopDB)
    return res.status(500).json({ message: 'Database connection unavailable.' });

  const { id } = req.params;
  try {
    const used = await req.shopDB.query(
      `SELECT COUNT(*) FROM products WHERE category_id = $1`, [id]
    );
    if (parseInt(used.rows[0].count) > 0) {
      await req.shopDB.query(
        `UPDATE products SET category_id = NULL WHERE category_id = $1`, [id]
      );
    }

    const result = await req.shopDB.query(
      `DELETE FROM categories WHERE category_id = $1 RETURNING category_id`, [id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'Category not found.' });

    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('[PRODUCT] deleteCategory:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// PRODUCTS 

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
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
         c.name   AS category_name,
         s.name   AS store_name,
         COALESCE(si.quantity, p.stock, 0)::INT AS stock
       FROM products p
       LEFT JOIN categories      c  ON c.category_id = p.category_id
       LEFT JOIN stores          s  ON s.store_id    = p.store_id
       LEFT JOIN store_inventory si ON si.product_id = p.product_id
                                   AND si.store_id   = p.store_id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[PRODUCT] getProducts:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await req.shopDB.query(
      `SELECT
         p.*,
         c.name   AS category_name,
         s.name   AS store_name,
         COALESCE(si.quantity, p.stock, 0)::INT AS stock
       FROM products p
       LEFT JOIN categories      c  ON c.category_id = p.category_id
       LEFT JOIN stores          s  ON s.store_id    = p.store_id
       LEFT JOIN store_inventory si ON si.product_id = p.product_id
                                   AND si.store_id   = p.store_id
       WHERE p.product_id = $1`,
      [id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'Product not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[PRODUCT] getProductById:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  const shop_id = req.user.shop_id;

  const { name, barcode, category_id, store_id, price, stock, unit, description } = req.body;

  if (!name || !name.trim())
    return res.status(400).json({ message: 'Product name is required.' });
  if (!price || isNaN(parseFloat(price)))
    return res.status(400).json({ message: 'Valid price is required.' });
  if (parseFloat(price) > 9999999999.99)
    return res.status(400).json({ message: 'Price is too large. Maximum allowed is 9,999,999,999.99.' });
  if (!store_id)
    return res.status(400).json({ message: 'Store is required.' });

  const qty = parseInt(stock) || 0;

  try {
    // Limit check
    const limitCheck = await masterPool.query(
      `SELECT u.products_used, p.max_products
       FROM usage u
       JOIN shops    sh ON sh.shop_id    = u.shop_id
       JOIN packages p  ON p.package_id = sh.package_id
       WHERE u.shop_id = $1`,
      [shop_id]
    );

    if (!limitCheck.rows.length)
      return res.status(400).json({ message: 'Usage record not found for this shop.' });

    const { products_used, max_products } = limitCheck.rows[0];

    if (products_used >= max_products) {
      // Clean up the already-uploaded file before rejecting
      if (req.file) deleteOldImage(imageUrl(req.file));
      return res.status(403).json({
        message: `Product limit reached. Your plan allows a maximum of ${max_products} product(s). You have already created ${products_used}. Please upgrade your package to add more products.`,
        products_used,
        max_products,
        limitReached: true,
      });
    }

    // Barcode uniqueness
    if (barcode && barcode.trim()) {
      const barcodeCheck = await req.shopDB.query(
        `SELECT product_id FROM products WHERE barcode = $1`, [barcode.trim()]
      );
      if (barcodeCheck.rows.length) {
        if (req.file) deleteOldImage(imageUrl(req.file));
        return res.status(409).json({ message: 'A product with this barcode already exists.' });
      }
    }

    const img_url = req.file ? imageUrl(req.file) : null;

    const productResult = await req.shopDB.query(
      `INSERT INTO products
         (name, barcode, price, stock, quantity, unit, description, category_id, store_id, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        name.trim(),
        barcode?.trim() || null,
        parseFloat(price),
        qty,
        qty,
        unit || 'pcs',
        description?.trim() || null,
        category_id ? parseInt(category_id) : null,
        parseInt(store_id),
        img_url,
      ]
    );

    const product = productResult.rows[0];

    await req.shopDB.query(
      `INSERT INTO store_inventory (store_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (store_id, product_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, price = EXCLUDED.price`,
      [parseInt(store_id), product.product_id, qty, parseFloat(price)]
    );

    await masterPool.query(
      `UPDATE usage
       SET products_used = products_used + 1, updated_at = NOW()
       WHERE shop_id = $1`,
      [shop_id]
    );

    res.status(201).json(product);

  } catch (err) {
    if (req.file) deleteOldImage(imageUrl(req.file));
    console.error('[PRODUCT] createProduct:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  const { id } = req.params;

  const { name, barcode, category_id, store_id, price, stock, unit, description } = req.body;

  if (!name || !name.trim())
    return res.status(400).json({ message: 'Product name is required.' });
  if (!price || isNaN(parseFloat(price)))
    return res.status(400).json({ message: 'Valid price is required.' });
  if (parseFloat(price) > 9999999999.99)
    return res.status(400).json({ message: 'Price is too large. Maximum allowed is 9,999,999,999.99.' });

  const qty = parseInt(stock) || 0;

  try {
    const existing = await req.shopDB.query(
      `SELECT * FROM products WHERE product_id = $1`, [id]
    );
    if (!existing.rows.length)
      return res.status(404).json({ message: 'Product not found.' });

    const old = existing.rows[0];

    if (barcode && barcode.trim()) {
      const barcodeCheck = await req.shopDB.query(
        `SELECT product_id FROM products WHERE barcode = $1 AND product_id <> $2`,
        [barcode.trim(), id]
      );
      if (barcodeCheck.rows.length) {
        if (req.file) deleteOldImage(imageUrl(req.file));
        return res.status(409).json({ message: 'A product with this barcode already exists.' });
      }
    }

    let img_url = old.image_url;
    if (req.file) {
      deleteOldImage(old.image_url);   
      img_url = imageUrl(req.file);
    }

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
           image_url   = $10
       WHERE product_id = $11
       RETURNING *`,
      [
        name.trim(),
        barcode?.trim() || null,
        parseFloat(price),
        qty,
        qty,
        unit || 'pcs',
        description?.trim() || null,
        category_id ? parseInt(category_id) : null,
        store_id    ? parseInt(store_id)    : old.store_id,
        img_url,
        id,
      ]
    );

    const target_store = store_id ? parseInt(store_id) : old.store_id;
    await req.shopDB.query(
      `INSERT INTO store_inventory (store_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (store_id, product_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, price = EXCLUDED.price`,
      [target_store, parseInt(id), qty, parseFloat(price)]
    );

    res.json(result.rows[0]);

  } catch (err) {
    if (req.file) deleteOldImage(imageUrl(req.file));
    console.error('[PRODUCT] updateProduct:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  const { id }  = req.params;
  const shop_id = req.user.shop_id;

  try {
    const existing = await req.shopDB.query(
      `SELECT * FROM products WHERE product_id = $1`, [id]
    );
    if (!existing.rows.length)
      return res.status(404).json({ message: 'Product not found.' });

    const product = existing.rows[0];

    await req.shopDB.query(
      `DELETE FROM store_inventory WHERE product_id = $1`, [id]
    );
    await req.shopDB.query(
      `DELETE FROM products WHERE product_id = $1`, [id]
    );

    if (product.image_url) deleteOldImage(product.image_url);

    await masterPool.query(
      `UPDATE usage
       SET products_used = GREATEST(products_used - 1, 0), updated_at = NOW()
       WHERE shop_id = $1`,
      [shop_id]
    );

    res.json({ message: 'Product deleted successfully.' });

  } catch (err) {
    console.error('[PRODUCT] deleteProduct:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};