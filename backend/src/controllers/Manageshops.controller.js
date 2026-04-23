const masterPool = require("../db/master.pool");


// GET /api/manage-shops
// Returns all shops with their package, subscription status, and usage stats

exports.getAllShops = async (req, res) => {
  try {
    const result = await masterPool.query(
      `SELECT
         s.shop_id,
         s.name,
         s.code,
         s.address,
         s.phone,
         s.logo_url,
         s.opening_hours,
         s.admin_email,
         s.created_at,
         pk.name                               AS package,
         pk.package_id,

         -- subscription status: 'active' only when a live subscription exists
         CASE
           WHEN sub.status = 'active' AND sub.end_date >= CURRENT_DATE THEN 'active'
           ELSE 'inactive'
         END                                   AS status,

         sub.start_date,
         sub.end_date,

         -- usage counters (default to 0 when no usage row yet)
         COALESCE(u.stores_used,   0)          AS stores_used,
         COALESCE(u.users_used,    0)          AS users_used,
         COALESCE(u.products_used, 0)          AS products_used,
         COALESCE(u.storage_used,  0)          AS storage_used

       FROM shops s
       LEFT JOIN packages    pk  ON pk.package_id    = s.package_id
       LEFT JOIN subscriptions sub ON sub.shop_id    = s.shop_id
       LEFT JOIN usage         u   ON u.shop_id      = s.shop_id
       ORDER BY s.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("[MANAGE-SHOPS] getAllShops error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// GET /api/manage-shops/:id
// Returns full details for a single shop (used by the View page)

exports.getShopById = async (req, res) => {
  const { id } = req.params;

  try {
    const shopResult = await masterPool.query(
      `SELECT
         s.shop_id,
         s.name,
         s.code,
         s.db_name,
         s.address,
         s.phone,
         s.logo_url,
         s.opening_hours,
         s.admin_email,
         s.created_at,
         pk.name        AS package,
         pk.package_id,
         pk.max_stores,
         pk.max_users_per_store,
         pk.max_products,
         pk.max_storage_mb,
         pk.price       AS package_price,

         CASE
           WHEN sub.status = 'active' AND sub.end_date >= CURRENT_DATE THEN 'active'
           ELSE 'inactive'
         END            AS status,

         sub.start_date,
         sub.end_date,

         COALESCE(u.stores_used,   0) AS stores_used,
         COALESCE(u.users_used,    0) AS users_used,
         COALESCE(u.products_used, 0) AS products_used,
         COALESCE(u.storage_used,  0) AS storage_used

       FROM shops s
       LEFT JOIN packages      pk  ON pk.package_id = s.package_id
       LEFT JOIN subscriptions sub ON sub.shop_id   = s.shop_id
       LEFT JOIN usage         u   ON u.shop_id     = s.shop_id
       WHERE s.shop_id = $1`,
      [id]
    );

    if (shopResult.rows.length === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.json(shopResult.rows[0]);
  } catch (error) {
    console.error("[MANAGE-SHOPS] getShopById error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};


// PUT /api/manage-shops/:id
// Edits basic shop info (name, address, phone, opening_hours, admin_email)
// Also supports changing the package (updates shops + subscriptions tables)

exports.updateShop = async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, opening_hours, admin_email, package_id } = req.body;

  const client = await masterPool.connect();

  try {
    await client.query("BEGIN");

    // 1. Verify the shop exists
    const existing = await client.query(
      `SELECT shop_id FROM shops WHERE shop_id = $1`,
      [id]
    );
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Shop not found" });
    }

    // 2. Update the shops table
    await client.query(
      `UPDATE shops
       SET name          = COALESCE($1, name),
           address       = COALESCE($2, address),
           phone         = COALESCE($3, phone),
           opening_hours = COALESCE($4, opening_hours),
           admin_email   = COALESCE($5, admin_email),
           package_id    = COALESCE($6, package_id)
       WHERE shop_id = $7`,
      [name, address, phone, opening_hours, admin_email, package_id || null, id]
    );

    // 3. If package changed, update the active subscription too
    if (package_id) {
      await client.query(
        `UPDATE subscriptions
         SET package_id = $1
         WHERE shop_id = $2 AND status = 'active'`,
        [package_id, id]
      );
    }

    await client.query("COMMIT");

    // Return the freshly updated shop
    const updated = await masterPool.query(
      `SELECT
         s.shop_id, s.name, s.code, s.address, s.phone,
         s.logo_url, s.opening_hours, s.admin_email,
         pk.name AS package, pk.package_id
       FROM shops s
       LEFT JOIN packages pk ON pk.package_id = s.package_id
       WHERE s.shop_id = $1`,
      [id]
    );

    res.json({ message: "Shop updated successfully", shop: updated.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[MANAGE-SHOPS] updateShop error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  } finally {
    client.release();
  }
};

// PATCH /api/manage-shops/:id/status
// Quickly activate or deactivate a shop by toggling its subscription status.
exports.toggleShopStatus = async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;           // expected: 'active' | 'inactive'

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: "status must be 'active' or 'inactive'" });
  }

  try {
    const result = await masterPool.query(
      `UPDATE subscriptions
       SET status = $1
       WHERE shop_id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No subscription found for this shop" });
    }

    res.json({ message: `Shop marked as ${status}` });
  } catch (error) {
    console.error("[MANAGE-SHOPS] toggleShopStatus error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};