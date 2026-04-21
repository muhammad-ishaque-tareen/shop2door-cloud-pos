const masterPool = require("../db/master.pool");

// GET shop profile
exports.getShopProfile = async (req, res) => {
  const shopId = req.user.shop_id;
  try {
    const result = await masterPool.query(
      `SELECT s.shop_id, s.name, s.code, s.address, s.phone, 
       s.logo_url, s.opening_hours, s.admin_email,
       p.name as package_name
FROM shops s
LEFT JOIN packages p ON s.package_id = p.package_id
WHERE s.shop_id = $1`,
      [shopId]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: "Shop not found" });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching shop profile:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET usage data for shop
exports.getShopUsage = async (req, res) => {
  const shopId = req.user.shop_id;
  try {
    const result = await masterPool.query(
      `SELECT u.users_used, u.stores_used, u.products_used, u.storage_used,
              p.max_stores, p.max_users_per_store, p.max_products, p.max_storage_mb
       FROM usage u
       JOIN shops s ON u.shop_id = s.shop_id
       JOIN packages p ON s.package_id = p.package_id
       WHERE u.shop_id = $1`,
      [shopId]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: "Usage data not found" });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getShopSubscription = async (req, res) => {
  const shopId = req.user.shop_id;
  try {
    // Get current subscription + package info
    const subResult = await masterPool.query(
      `SELECT s.start_date, s.end_date, s.status,
              p.name as package_name, p.price,
              p.max_stores, p.max_users_per_store, p.max_products
       FROM subscriptions s
       JOIN packages p ON s.package_id = p.package_id
       WHERE s.shop_id = $1 AND s.status = 'active'
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [shopId]
    );
 
    // Get billing history from payments table
    const billingResult = await masterPool.query(
      `SELECT pay.payment_date, pay.amount, pay.payment_method,
              p.name as package_name
       FROM payments pay
       JOIN packages p ON pay.package_id = p.package_id
       WHERE pay.shop_id = $1
       ORDER BY pay.payment_date DESC
       LIMIT 10`,
      [shopId]
    );
 
    const subscription = subResult.rows[0] || null;
    const billing_history = billingResult.rows || [];
 
    res.json({
      ...subscription,
      billing_history
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};