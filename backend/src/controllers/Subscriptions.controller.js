const masterPool = require("../db/master.pool");

// GET /api/subscriptions
// Returns all subscriptions with shop name, package, amount, dates, status
exports.getSubscriptions = async (req, res) => {
  try {
    const result = await masterPool.query(
      `SELECT
         sub.subscription_id,
         s.shop_id,
         s.name                                        AS shop,
         pk.name                                       AS package,
         pk.price                                      AS amount,
         sub.start_date,
         sub.end_date,
         CASE
           WHEN sub.status = 'active' AND sub.end_date >= CURRENT_DATE THEN 'active'
           ELSE 'inactive'
         END                                           AS status
       FROM subscriptions sub
       JOIN shops    s  ON s.shop_id    = sub.shop_id
       JOIN packages pk ON pk.package_id = sub.package_id
       ORDER BY sub.start_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[SUBSCRIPTIONS] getSubscriptions error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// GET /api/subscriptions/:id
// Returns a single subscription by subscription_id

exports.getSubscriptionById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await masterPool.query(
      `SELECT
         sub.subscription_id,
         s.shop_id,
         s.name       AS shop,
         pk.name      AS package,
         pk.price     AS amount,
         sub.start_date,
         sub.end_date,
         CASE
           WHEN sub.status = 'active' AND sub.end_date >= CURRENT_DATE THEN 'active'
           ELSE 'inactive'
         END          AS status
       FROM subscriptions sub
       JOIN shops    s  ON s.shop_id     = sub.shop_id
       JOIN packages pk ON pk.package_id = sub.package_id
       WHERE sub.subscription_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("[SUBSCRIPTIONS] getSubscriptionById error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// 
// PATCH /api/subscriptions/:id/status
// Toggle subscription active / inactive
// Body: { status: 'active' | 'inactive' }
// 
exports.toggleSubscriptionStatus = async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ message: "status must be 'active' or 'inactive'" });
  }

  try {
    const result = await masterPool.query(
      `UPDATE subscriptions
       SET status = $1
       WHERE subscription_id = $2
       RETURNING *`,
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    res.json({ message: `Subscription marked as ${status}`, subscription: result.rows[0] });
  } catch (error) {
    console.error("[SUBSCRIPTIONS] toggleSubscriptionStatus error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// 
// PUT /api/subscriptions/:id
// Update end_date or package_id for a subscription
// Body: { end_date?, package_id? }
// 
exports.updateSubscription = async (req, res) => {
  const { id }                 = req.params;
  const { end_date, package_id } = req.body;

  try {
    const existing = await masterPool.query(
      `SELECT subscription_id FROM subscriptions WHERE subscription_id = $1`, [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const result = await masterPool.query(
      `UPDATE subscriptions
       SET end_date   = COALESCE($1, end_date),
           package_id = COALESCE($2, package_id)
       WHERE subscription_id = $3
       RETURNING *`,
      [end_date || null, package_id || null, id]
    );

    res.json({ message: "Subscription updated", subscription: result.rows[0] });
  } catch (error) {
    console.error("[SUBSCRIPTIONS] updateSubscription error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};