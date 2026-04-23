const masterPool = require("../db/master.pool");

// GET /api/shop-requests
// Returns all pending payment/shop requests
exports.getShopRequests = async (req, res) => {
  try {
    const result = await masterPool.query(
      `SELECT 
         p.payment_id        AS id,
         p.amount            AS amount_paid,
         u.name              AS full_name,
         u.email             AS email,
         p.sender_account    AS sender_account,
         pk.name             AS package,
         p.payment_date      AS date,
         p.payment_method    AS payment_method,
         p.shop_id,
         p.transaction_ref
       FROM payments p
       JOIN users u   ON p.user_id   = u.user_id
       JOIN packages pk ON p.package_id = pk.package_id
       WHERE p.status = 'pending'
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[SHOP-REQUESTS] getShopRequests error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};

// POST /api/shop-requests/:id/approve
// Marks payment as approved and activates shop subscription
exports.approveShopRequest = async (req, res) => {
  const { id } = req.params;
  const client = await masterPool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get payment details
    const paymentResult = await client.query(
      `SELECT * FROM payments WHERE payment_id = $1`,
      [id]
    );

    if (paymentResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Payment request not found" });
    }

    const payment = paymentResult.rows[0];

    // 2. Mark payment as approved
    await client.query(
      `UPDATE payments SET status = 'approved' WHERE payment_id = $1`,
      [id]
    );

    // 3. Create or renew subscription for the shop
    await client.query(
      `INSERT INTO subscriptions (shop_id, package_id, start_date, end_date, status)
       VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'active')
       ON CONFLICT (shop_id) DO UPDATE
         SET package_id = EXCLUDED.package_id,
             start_date = EXCLUDED.start_date,
             end_date   = EXCLUDED.end_date,
             status     = 'active'`,
      [payment.shop_id, payment.package_id]
    );

    // 4. Update shop's package_id
    await client.query(
      `UPDATE shops SET package_id = $1 WHERE shop_id = $2`,
      [payment.package_id, payment.shop_id]
    );

    await client.query("COMMIT");
    res.json({ message: "Shop request approved successfully" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[SHOP-REQUESTS] approveShopRequest error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  } finally {
    client.release();
  }
};

// POST /api/shop-requests/:id/reject
// Marks payment as rejected
exports.rejectShopRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await masterPool.query(
      `UPDATE payments SET status = 'rejected' WHERE payment_id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Payment request not found" });
    }

    res.json({ message: "Shop request rejected successfully" });

  } catch (error) {
    console.error("[SHOP-REQUESTS] rejectShopRequest error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};