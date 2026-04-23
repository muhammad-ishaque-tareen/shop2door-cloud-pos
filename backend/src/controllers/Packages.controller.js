const masterPool = require("../db/master.pool");

// GET /api/packages
// Returns all packages with how many shops are on each
exports.getPackages = async (req, res) => {
  try {
    const result = await masterPool.query(
      `SELECT
         p.package_id,
         p.name,
         p.max_stores,
         p.max_users_per_store,
         p.max_products,
         p.max_storage_mb,
         p.price,
         p.created_at,
         COUNT(s.shop_id) AS shop_count
       FROM packages p
       LEFT JOIN shops s ON s.package_id = p.package_id
       GROUP BY p.package_id
       ORDER BY p.price ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[PACKAGES] getPackages error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};


// GET /api/packages/:id
// Single package detail

exports.getPackageById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await masterPool.query(
      `SELECT
         p.*,
         COUNT(s.shop_id) AS shop_count
       FROM packages p
       LEFT JOIN shops s ON s.package_id = p.package_id
       WHERE p.package_id = $1
       GROUP BY p.package_id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Package not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("[PACKAGES] getPackageById error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// POST /api/packages
// Create a new package

exports.createPackage = async (req, res) => {
  const {
    name, description,
    price, max_stores, max_users_per_store,
    max_products, max_storage_mb,
  } = req.body;

  // Basic validation
  if (!name || !price) {
    return res.status(400).json({ message: "name and price are required" });
  }

  try {
    const result = await masterPool.query(
      `INSERT INTO packages
         (name, max_stores, max_users_per_store, max_products, max_storage_mb, price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name.trim(),
        max_stores          || 0,
        max_users_per_store || 0,
        max_products        || 0,
        max_storage_mb      || 0,
        price,
      ]
    );

    res.status(201).json({ message: "Package created", package: result.rows[0] });
  } catch (error) {
    console.error("[PACKAGES] createPackage error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// PUT /api/packages/:id


exports.updatePackage = async (req, res) => {
  const { id } = req.params;
  const {
    name, price,
    max_stores, max_users_per_store,
    max_products, max_storage_mb,
  } = req.body;

  try {
    // Confirm it exists first
    const existing = await masterPool.query(
      `SELECT package_id FROM packages WHERE package_id = $1`, [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Package not found" });
    }

    const result = await masterPool.query(
      `UPDATE packages
       SET name                = COALESCE($1, name),
           price               = COALESCE($2, price),
           max_stores          = COALESCE($3, max_stores),
           max_users_per_store = COALESCE($4, max_users_per_store),
           max_products        = COALESCE($5, max_products),
           max_storage_mb      = COALESCE($6, max_storage_mb)
       WHERE package_id = $7
       RETURNING *`,
      [
        name               || null,
        price              || null,
        max_stores         || null,
        max_users_per_store|| null,
        max_products       || null,
        max_storage_mb     || null,
        id,
      ]
    );

    res.json({ message: "Package updated", package: result.rows[0] });
  } catch (error) {
    console.error("[PACKAGES] updatePackage error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};


// DELETE /api/packages/:id
// Deletes a package — blocked if any shops are still on it

exports.deletePackage = async (req, res) => {
  const { id } = req.params;

  try {
    // Safety check: don't allow deletion if shops reference this package
    const shopCheck = await masterPool.query(
      `SELECT COUNT(*) AS cnt FROM shops WHERE package_id = $1`, [id]
    );
    if (parseInt(shopCheck.rows[0].cnt, 10) > 0) {
      return res.status(409).json({
        message: "Cannot delete: shops are still using this package. Reassign them first.",
      });
    }

    const result = await masterPool.query(
      `DELETE FROM packages WHERE package_id = $1 RETURNING *`, [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Package not found" });
    }

    res.json({ message: "Package deleted successfully" });
  } catch (error) {
    console.error("[PACKAGES] deletePackage error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};