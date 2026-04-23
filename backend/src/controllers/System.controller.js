const masterPool = require("../db/master.pool");

// GET /api/system/stats
exports.getStats = async (req, res) => {
  try {
    const totalResult = await masterPool.query(
      `SELECT COUNT(*) AS total_shops FROM shops`
    );

    const activeResult = await masterPool.query(
      `SELECT COUNT(DISTINCT shop_id) AS active_shops
       FROM subscriptions
       WHERE status = 'active' AND end_date >= CURRENT_DATE`
    );

    const pendingResult = await masterPool.query(
      `SELECT COUNT(*) AS pending_requests
       FROM shops s
       WHERE NOT EXISTS (
         SELECT 1 FROM subscriptions sub
         WHERE sub.shop_id = s.shop_id AND sub.status = 'active'
       )`
    );

    const revenueResult = await masterPool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments`
    );

    res.json({
      total_shops:      parseInt(totalResult.rows[0].total_shops,        10),
      active_shops:     parseInt(activeResult.rows[0].active_shops,      10),
      pending_requests: parseInt(pendingResult.rows[0].pending_requests,  10),
      total_revenue:    parseFloat(revenueResult.rows[0].total_revenue),
    });
  } catch (error) {
    console.error("[SYSTEM] getStats error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// GET /api/system/packages
exports.getPackages = async (req, res) => {
  try {
    const result = await masterPool.query(
      `SELECT p.package_id, p.name, p.max_stores, p.max_users_per_store,
              p.max_products, p.max_storage_mb, p.price,
              COUNT(s.shop_id) AS shop_count
       FROM packages p
       LEFT JOIN shops s ON s.package_id = p.package_id
       GROUP BY p.package_id
       ORDER BY p.price ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[SYSTEM] getPackages error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};