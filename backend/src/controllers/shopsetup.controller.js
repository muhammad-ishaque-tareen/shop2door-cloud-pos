const masterPool = require("../db/master.pool");

// Helper: is this a free-trial package?
const isFreeTrialPackage = async (packageId) => {
  const { rows } = await masterPool.query(
    `SELECT price FROM packages WHERE package_id = $1`,
    [packageId]
  );
  return rows.length > 0 && parseFloat(rows[0].price) === 0;
};

// POST /api/shopsetup
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

  // Field validation
  if (!shop_name || !phone || !shop_type || !address || !city || !package_id) {
    return res.status(400).json({
      message: "shop_name, phone, shop_type, address, city, and package_id are all required.",
    });
  }

  // Parse opening_hours
  let parsedHours = null;
  try {
    parsedHours = opening_hours ? JSON.parse(opening_hours) : null;
  } catch {
    return res.status(400).json({
      message: "Invalid opening_hours format. Expected JSON string.",
    });
  }

  // Logo URL
  const logoUrl    = req.file ? `/uploads/logos/${req.file.filename}` : null;
  const fullAddress = `${address.trim()}, ${city.trim()}`;

  try {
    // 1. Verify package exists
    const pkgCheck = await masterPool.query(
      "SELECT package_id, price FROM packages WHERE package_id = $1",
      [package_id]
    );
    if (pkgCheck.rows.length === 0) {
      return res.status(400).json({ message: "Selected package does not exist." });
    }

    const packagePrice = parseFloat(pkgCheck.rows[0].price);
    const isFreeTrial  = packagePrice === 0;

    // 2. If free trial, check freetrail_users table using the user's email
    if (isFreeTrial) {
      const userRow = await masterPool.query(
        `SELECT email FROM users WHERE user_id = $1`,
        [userId]
      );
      const userEmail = userRow.rows[0]?.email;

      const alreadyUsed = await masterPool.query(
        `SELECT id FROM freetrail_users WHERE email = $1`,
        [userEmail]
      );

      if (alreadyUsed.rows.length > 0) {
        return res.status(403).json({
          message:          "free_trial_already_used",
          friendly_message: "You have already used your free trial. Please select a paid plan to continue.",
        });
      }
    }

    // 3. Check user doesn't already have a pending request
    const duplicate = await masterPool.query(
      `SELECT request_id FROM shop_requests
       WHERE user_id = $1 AND status IN ('pending', 'payment_submitted')
       LIMIT 1`,
      [userId]
    );
    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        message:    "You already have a pending shop request. Please wait for it to be reviewed.",
        request_id: duplicate.rows[0].request_id,
      });
    }

    // 4. Insert shop_request row
    //    If free trial → status = 'payment_submitted' with dummy payment data
    //                    so admin can approve immediately without payment step
    //    If paid       → status = 'pending' (user goes to PaymentConfirmation next)
    let insertResult;

    if (isFreeTrial) {
      insertResult = await masterPool.query(
        `INSERT INTO shop_requests
           (user_id, package_id, shop_name, shop_address, shop_phone,
            shop_logo_url, opening_hours, status,
            payment_method, sender_account, transaction_ref, amount, payment_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'payment_submitted',
                 'free_trial', 'N/A', 'FREE-TRIAL', 0, CURRENT_DATE)
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
    } else {
      insertResult = await masterPool.query(
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
    }

    const newRequest = insertResult.rows[0];

    console.log(
      `[SHOP SETUP] request_id=${newRequest.request_id} created for user_id=${userId} | free_trial=${isFreeTrial}`
    );

    return res.status(201).json({
      message:       isFreeTrial
        ? "Free trial shop request submitted successfully."
        : "Shop setup submitted successfully.",
      request_id:    newRequest.request_id,
      created_at:    newRequest.created_at,
      is_free_trial: isFreeTrial,
    });

  } catch (error) {
    console.error("[SHOP SETUP] submitShopSetup error:", error.message);
    return res.status(500).json({ message: "Server error.", detail: error.message });
  }
};

// PUT /api/shopsetup/:id/payment
// Only called for paid packages. Free trial skips this step entirely.
exports.submitPayment = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params; // request_id

  const {
    payment_method,
    sender_account,
    transaction_ref,
    amount,
    payment_date,
  } = req.body;

  if (!payment_method || !sender_account || !transaction_ref || !amount || !payment_date) {
    return res.status(400).json({ message: "All payment fields are required." });
  }

  try {
    // Make sure this request belongs to this user and is still pending
    const check = await masterPool.query(
      `SELECT request_id, status, package_id FROM shop_requests
       WHERE request_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Shop request not found." });
    }

    const { status, package_id } = check.rows[0];

    // Block free-trial requests from going through payment flow
    const freeTrial = await isFreeTrialPackage(package_id);
    if (freeTrial) {
      return res.status(400).json({
        message: "Free trial packages do not require payment.",
      });
    }

    if (status === "payment_submitted" || status === "approved") {
      return res.status(409).json({
        message: "Payment already submitted for this request.",
      });
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
      [
        payment_method,
        sender_account,
        transaction_ref,
        amount,
        payment_date,
        id,
        userId,
      ]
    );

    return res.status(200).json({
      message: "Payment submitted successfully. Your request is under review.",
    });

  } catch (error) {
    console.error("[PAYMENT] submitPayment error:", error.message);
    return res.status(500).json({ message: "Server error.", detail: error.message });
  }
};