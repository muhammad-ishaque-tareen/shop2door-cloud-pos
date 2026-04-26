const masterPool = require("../db/master.pool");

// HELPER: resolve shop_id from the authenticated user
// Works whether the token carries shop_id directly OR only user_id
async function resolveShopId(req) {
  if (req.user.shop_id) return req.user.shop_id;
  const r = await masterPool.query(
    `SELECT shop_id FROM users WHERE user_id = $1`,
    [req.user.user_id || req.user.id]
  );
  return r.rows[0]?.shop_id || null;
}

// GET /api/shop/subscription
exports.getMySubscription = async (req, res) => {
  try {
    const shopId = await resolveShopId(req);
    if (!shopId) return res.status(400).json({ message: "Shop not found for this user" });

    const result = await masterPool.query(
      `SELECT
         sub.subscription_id,
         sub.shop_id,
         sub.start_date,
         sub.end_date,
         sub.status,
         pk.package_id,
         pk.name          AS package_name,
         pk.price,
         pk.max_stores,
         pk.max_users_per_store,
         pk.max_products,
         pk.max_storage_mb
       FROM subscriptions sub
       JOIN packages pk ON pk.package_id = sub.package_id
       WHERE sub.shop_id = $1
         AND sub.status  = 'active'
       ORDER BY sub.created_at DESC
       LIMIT 1`,
      [shopId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No active subscription found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("[SUBSCRIPTION] getMySubscription error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// GET /api/shop/usage
exports.getMyUsage = async (req, res) => {
  try {
    const shopId = await resolveShopId(req);
    if (!shopId) return res.status(400).json({ message: "Shop not found for this user" });

    const result = await masterPool.query(
      `SELECT
         u.users_used,
         u.stores_used,
         u.products_used,
         u.storage_used,
         pk.name                  AS package_name,
         pk.max_stores,
         pk.max_users_per_store,
         pk.max_products,
         pk.max_storage_mb
       FROM usage u
       JOIN shops      s  ON s.shop_id     = u.shop_id
       JOIN packages   pk ON pk.package_id = s.package_id
       WHERE u.shop_id = $1`,
      [shopId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usage data not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("[SUBSCRIPTION] getMyUsage error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// GET /api/shop/billing-history
//
// What counts as billing history:
//   PRIMARY: rows in the payments table (inserted on each upgrade)
//   FALLBACK: if payments is empty, show subscriptions table rows —
//             so the very first plan (initial signup) always shows up.
//
// This way the shop admin ALWAYS sees at least one billing row from day 1.
exports.getBillingHistory = async (req, res) => {
  try {
    const shopId = await resolveShopId(req);
    if (!shopId) return res.status(400).json({ message: "Shop not found for this user" });

    // Try payments table first
    const paymentsRes = await masterPool.query(
      `SELECT
         p.payment_id        AS id,
         p.amount,
         p.payment_method,
         p.transaction_ref,
         COALESCE(p.payment_date, p.created_at::date) AS payment_date,
         COALESCE(p.status, 'paid')                   AS status,
         p.created_at,
         pk.name             AS package_name,
         'payment'           AS source
       FROM payments p
       LEFT JOIN packages pk ON pk.package_id = p.package_id
       WHERE p.shop_id = $1
       ORDER BY p.created_at DESC`,
      [shopId]
    );

    if (paymentsRes.rows.length > 0) {
      return res.json(paymentsRes.rows);
    }

    // Fallback: subscriptions act as billing history
    const subsRes = await masterPool.query(
      `SELECT
         sub.subscription_id AS id,
         pk.price            AS amount,
         'initial'           AS payment_method,
         NULL                AS transaction_ref,
         sub.start_date      AS payment_date,
         'paid'              AS status,
         sub.created_at,
         pk.name             AS package_name,
         'subscription'      AS source
       FROM subscriptions sub
       JOIN packages pk ON pk.package_id = sub.package_id
       WHERE sub.shop_id = $1
       ORDER BY sub.created_at DESC`,
      [shopId]
    );

    res.json(subsRes.rows);
  } catch (error) {
    console.error("[SUBSCRIPTION] getBillingHistory error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// GET /api/shop/available-plans
//
// THE FIX: get current price from shops → packages join (not subscriptions),
// then return every package with a strictly higher price.
// Console.log added so you can verify in server logs what's being found.
exports.getAvailablePlans = async (req, res) => {
  try {
    const shopId = await resolveShopId(req);
    if (!shopId) return res.status(400).json({ message: "Shop not found for this user" });

    // Get current package via shops table (most reliable source of truth)
    const currentRes = await masterPool.query(
      `SELECT pk.package_id, pk.price, pk.name
       FROM shops s
       JOIN packages pk ON pk.package_id = s.package_id
       WHERE s.shop_id = $1`,
      [shopId]
    );

    if (currentRes.rows.length === 0) {
      return res.status(404).json({ message: "Shop or package not found" });
    }

    const current = currentRes.rows[0];
    console.log(`[AVAILABLE-PLANS] shop_id=${shopId} | current: "${current.name}" @ Rs ${current.price}`);

    // All packages priced higher → these are valid upgrades
    const result = await masterPool.query(
      `SELECT
         package_id,
         name,
         price,
         max_stores,
         max_users_per_store,
         max_products,
         max_storage_mb
       FROM packages
       WHERE price > $1
       ORDER BY price ASC`,
      [current.price]
    );

    console.log(`[AVAILABLE-PLANS] upgrade options found: ${result.rows.map(r => r.name).join(', ') || 'none'}`);

    res.json(result.rows);
  } catch (error) {
    console.error("[SUBSCRIPTION] getAvailablePlans error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// POST /api/shop/upgrade-plan
// Body: { package_id }
// 
exports.upgradePlan = async (req, res) => {
  const { package_id } = req.body;
  if (!package_id) {
    return res.status(400).json({ message: "package_id is required" });
  }

  const client = await masterPool.connect();
  try {
    const shopId = await resolveShopId(req);
    if (!shopId) {
      client.release();
      return res.status(400).json({ message: "Shop not found for this user" });
    }
    const userId = req.user.user_id || req.user.id;

    await client.query("BEGIN");

    // Verify new package exists
    const pkgRes = await client.query(
      `SELECT package_id, name, price FROM packages WHERE package_id = $1`,
      [package_id]
    );
    if (pkgRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Package not found" });
    }
    const newPkg = pkgRes.rows[0];

    // Verify it's a genuine upgrade
    const currentRes = await client.query(
      `SELECT pk.price, pk.name
       FROM shops s
       JOIN packages pk ON pk.package_id = s.package_id
       WHERE s.shop_id = $1`,
      [shopId]
    );
    const currentPrice = parseFloat(currentRes.rows[0]?.price || 0);
    if (parseFloat(newPkg.price) <= currentPrice) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Selected package is not an upgrade over the current plan" });
    }

    // 1. Expire old subscription
    await client.query(
      `UPDATE subscriptions SET status = 'expired' WHERE shop_id = $1 AND status = 'active'`,
      [shopId]
    );

    // 2. Create new subscription (1 year)
    await client.query(
      `INSERT INTO subscriptions (shop_id, package_id, start_date, end_date, status)
       VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'active')`,
      [shopId, package_id]
    );

    // 3. Update shops.package_id so limits take effect immediately
    await client.query(
      `UPDATE shops SET package_id = $1 WHERE shop_id = $2`,
      [package_id, shopId]
    );

    // 4. Record the payment
    await client.query(
      `INSERT INTO payments (user_id, shop_id, package_id, payment_method, amount, payment_date, status)
       VALUES ($1, $2, $3, 'online', $4, CURRENT_DATE, 'paid')`,
      [userId, shopId, package_id, newPkg.price]
    );

    await client.query("COMMIT");

    res.json({
      message: `Successfully upgraded to ${newPkg.name} plan`,
      package: newPkg
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[SUBSCRIPTION] upgradePlan error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  } finally {
    client.release();
  }
};

// System-admin endpoints (unchanged)
exports.getSubscriptions = async (req, res) => {
  try {
    const result = await masterPool.query(
      `SELECT sub.subscription_id, s.shop_id, s.name AS shop,
         pk.name AS package, pk.price AS amount,
         sub.start_date, sub.end_date,
         CASE WHEN sub.status='active' AND sub.end_date>=CURRENT_DATE THEN 'active' ELSE 'inactive' END AS status
       FROM subscriptions sub
       JOIN shops s ON s.shop_id=sub.shop_id
       JOIN packages pk ON pk.package_id=sub.package_id
       ORDER BY sub.start_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[SUBSCRIPTIONS] getSubscriptions error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

exports.getSubscriptionById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await masterPool.query(
      `SELECT sub.subscription_id, s.shop_id, s.name AS shop,
         pk.name AS package, pk.price AS amount,
         sub.start_date, sub.end_date,
         CASE WHEN sub.status='active' AND sub.end_date>=CURRENT_DATE THEN 'active' ELSE 'inactive' END AS status
       FROM subscriptions sub
       JOIN shops s ON s.shop_id=sub.shop_id
       JOIN packages pk ON pk.package_id=sub.package_id
       WHERE sub.subscription_id=$1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Subscription not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("[SUBSCRIPTIONS] getSubscriptionById error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

exports.toggleSubscriptionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ message: "status must be 'active' or 'inactive'" });
  }
  try {
    const result = await masterPool.query(
      `UPDATE subscriptions SET status=$1 WHERE subscription_id=$2 RETURNING *`,
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Subscription not found" });
    res.json({ message: `Subscription marked as ${status}`, subscription: result.rows[0] });
  } catch (error) {
    console.error("[SUBSCRIPTIONS] toggleSubscriptionStatus error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

exports.updateSubscription = async (req, res) => {
  const { id } = req.params;
  const { end_date, package_id } = req.body;
  try {
    const existing = await masterPool.query(
      `SELECT subscription_id FROM subscriptions WHERE subscription_id=$1`, [id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ message: "Subscription not found" });
    const result = await masterPool.query(
      `UPDATE subscriptions
       SET end_date=COALESCE($1, end_date), package_id=COALESCE($2, package_id)
       WHERE subscription_id=$3 RETURNING *`,
      [end_date || null, package_id || null, id]
    );
    res.json({ message: "Subscription updated", subscription: result.rows[0] });
  } catch (error) {
    console.error("[SUBSCRIPTIONS] updateSubscription error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};