const masterPool = require("../db/master.pool");

//  POST /api/shopsetup
//  Auth  : shop_admin JWT (verifyToken middleware)
//  Body  : multipart/form-data
//    shop_name      string  required
//    phone          string  required
//    email          string  optional
//    shop_type      string  required
//    address        string  required
//    city           string  required
//    opening_hours  string  required  (JSON stringified object)
//    package_id     number  required
//  File  : logo (optional, max 2MB, image only)
//
//  Creates a row in shop_requests (status = 'pending')
//  Returns: { request_id, message }
exports.submitShopSetup = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  const {
    shop_name,
    phone,
    email,
    shop_type,
    address,
    city,
    opening_hours,
    package_id,
  } = req.body;

  //  Field validation 
  if (!shop_name || !phone || !shop_type || !address || !city || !package_id) {
    return res.status(400).json({
      message: "shop_name, phone, shop_type, address, city, and package_id are all required.",
    });
  }

  //  Parse opening_hours 
  let parsedHours = null;
  try {
    parsedHours = opening_hours ? JSON.parse(opening_hours) : null;
  } catch {
    return res.status(400).json({ message: "Invalid opening_hours format. Expected JSON string." });
  }

  //  Logo URL 
  const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : null;

  //  Full address 
  const fullAddress = `${address.trim()}, ${city.trim()}`;

  try {
    // 1. Verify package exists
    const pkgCheck = await masterPool.query(
      "SELECT package_id FROM packages WHERE package_id = $1",
      [package_id]
    );
    if (pkgCheck.rows.length === 0) {
      return res.status(400).json({ message: "Selected package does not exist." });
    }

    // 2. Check user doesn't already have a pending request
    const duplicate = await masterPool.query(
      `SELECT request_id FROM shop_requests
       WHERE user_id = $1 AND status = 'pending'
       LIMIT 1`,
      [userId]
    );
    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        message:    "You already have a pending shop request. Please wait for it to be reviewed.",
        request_id: duplicate.rows[0].request_id,
      });
    }

    // 3. Insert shop_request row
    const result = await masterPool.query(
      `INSERT INTO shop_requests
         (user_id, package_id, shop_name, shop_address, shop_phone,
          shop_logo_url, opening_hours, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING request_id, created_at`,
      [
        userId,
        package_id,
        shop_name.trim(),
        fullAddress,
        phone.trim(),
        logoUrl,
        parsedHours ? JSON.stringify(parsedHours) : null,
      ]
    );

    const newRequest = result.rows[0];

    console.log(
      `[SHOP SETUP] request_id=${newRequest.request_id} created for user_id=${userId}`
    );

    return res.status(201).json({
      message:    "Shop setup submitted successfully.",
      request_id: newRequest.request_id,
      created_at: newRequest.created_at,
    });

  } catch (error) {
    console.error("[SHOP SETUP] submitShopSetup error:", error.message);
    return res.status(500).json({ message: "Server error.", detail: error.message });
  }
};

exports.submitPayment = async (req, res) => {
  const userId    = req.user?.id;
  const { id }    = req.params;   // request_id

  const { payment_method, sender_account, transaction_ref, amount, payment_date } = req.body;

  if (!payment_method || !sender_account || !transaction_ref || !amount || !payment_date) {
    return res.status(400).json({ message: "All payment fields are required." });
  }

  try {
    // Make sure this request belongs to this user and is still pending
    const check = await masterPool.query(
      `SELECT request_id, status FROM shop_requests
       WHERE request_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Shop request not found." });
    }

    if (check.rows[0].status === 'payment_submitted' || check.rows[0].status === 'approved') {
      return res.status(409).json({ message: "Payment already submitted for this request." });
    }

    await masterPool.query(
      `UPDATE shop_requests
       SET payment_method  = $1,
           sender_account  = $2,
           transaction_ref = $3,
           amount          = $4,
           payment_date    = $5,
           status          = 'payment_submitted'
       WHERE request_id = $6 AND user_id = $7`,
      [payment_method, sender_account, transaction_ref, amount, payment_date, id, userId]
    );

    return res.status(200).json({ message: "Payment submitted successfully. Your request is under review." });

  } catch (error) {
    console.error("[PAYMENT] submitPayment error:", error.message);
    return res.status(500).json({ message: "Server error.", detail: error.message });
  }
};