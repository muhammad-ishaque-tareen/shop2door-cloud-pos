const bcrypt     = require("bcrypt");
const nodemailer = require("nodemailer");
const masterPool = require("../db/master.pool");
const getShopPool = require("../db/shop.pool");

//  In-memory OTP store 
// Structure: { email+shopCode => { otp, expiresAt, verified, db_name, userSource } }
// For production, replace with Redis or a DB table.
const otpStore = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

//  Mailer 
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

//  Helpers 
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Store key: email + optional shopCode (so cashier at shop A doesn't collide with cashier at shop B)
const storeKey = (email, shopCode) =>
  `${email.toLowerCase()}::${(shopCode || "").toUpperCase()}`;

const sendOtpEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"Shop2Door" <${process.env.EMAIL_USER}>`,
    to:   toEmail,
    subject: "🔐 Password Reset OTP – Shop2Door",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f9f9f9;padding:40px 32px;">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;
                    border:1px solid #e5e7eb;padding:36px 32px;">
          <div style="margin-bottom:20px;">
            <span style="font-size:22px;font-weight:700;color:#9c27b0;">Shop2Door</span>
          </div>
          <h2 style="color:#1f2937;font-size:20px;font-weight:600;margin:0 0 8px;">
            Password Reset Request
          </h2>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
            We received a request to reset your password. Use the OTP below.
            It expires in <strong>10 minutes</strong>.
          </p>
          <div style="background:#f3e5f5;border:2px dashed #9c27b0;border-radius:10px;
                      padding:20px;text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:10px;
                         color:#7b1fa2;font-family:monospace;">${otp}</span>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            If you didn't request this, please ignore this email. Your password will not change.
          </p>
        </div>
      </div>
    `,
  });
};

//  POST /api/forgot-password/send-otp 
// Body: { email, shopCode? }
// shopCode is REQUIRED for store_manager / cashier
exports.sendOtp = async (req, res) => {
  const { email, shopCode } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ message: "Email is required." });
  }

  const normalizedEmail    = email.trim().toLowerCase();
  const normalizedShopCode = shopCode ? String(shopCode).trim().toUpperCase() : null;

  try {
    let userFound    = false;
    let userSource   = null; // 'master' | 'shop'
    let resolvedDbName = null;

    //  Try masterPool first (system_admin, shop_admin) 
    const masterResult = await masterPool.query(
      `SELECT user_id, email FROM users WHERE LOWER(email) = $1`,
      [normalizedEmail]
    );

    if (masterResult.rows.length > 0) {
      userFound  = true;
      userSource = "master";
    }

    //  If not found in master, try shopPool (store_manager, cashier) 
    if (!userFound) {
      if (!normalizedShopCode) {
        // Give a helpful hint without leaking whether the email exists in master
        return res.status(404).json({
          message:
            "No account found. If you are a Store Manager or Cashier, please also enter your Shop Code.",
          requiresShopCode: true,
        });
      }

      // Look up the shop by code
      const shopRow = await masterPool.query(
        `SELECT shop_id, db_name FROM shops WHERE code = $1`,
        [normalizedShopCode]
      );

      if (shopRow.rows.length === 0) {
        return res.status(404).json({ message: "Invalid Shop Code." });
      }

      const shop = shopRow.rows[0];

      if (!shop.db_name) {
        return res.status(500).json({ message: "Shop database not configured. Contact support." });
      }

      const shopPool = getShopPool(shop.db_name);
      const shopUserResult = await shopPool.query(
        `SELECT user_id, email FROM users WHERE LOWER(email) = $1`,
        [normalizedEmail]
      );

      if (shopUserResult.rows.length > 0) {
        userFound      = true;
        userSource     = "shop";
        resolvedDbName = shop.db_name;
      }
    }

    if (!userFound) {
      return res.status(404).json({ message: "No account found with that email address." });
    }

    //  Generate & store OTP 
    const otp     = generateOtp();
    const key     = storeKey(normalizedEmail, normalizedShopCode);

    otpStore.set(key, {
      otp,
      expiresAt:     Date.now() + OTP_TTL_MS,
      verified:      false,
      userSource,
      db_name:       resolvedDbName,
      shopCode:      normalizedShopCode,
    });

    // Auto-cleanup after TTL
    setTimeout(() => otpStore.delete(key), OTP_TTL_MS + 5000);

    await sendOtpEmail(normalizedEmail, otp);

    console.log(`[FORGOT-PW] OTP sent to ${normalizedEmail} (source: ${userSource})`);

    return res.json({ message: "OTP sent to your email address. It expires in 10 minutes." });

  } catch (error) {
    console.error("[FORGOT-PW] sendOtp error:", error.message);
    return res.status(500).json({ message: "Server error", detail: error.message });
  }
};

//  POST /api/forgot-password/verify-otp 
// Body: { email, otp, shopCode? }
exports.verifyOtp = async (req, res) => {
  const { email, otp, shopCode } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  const normalizedEmail    = email.trim().toLowerCase();
  const normalizedShopCode = shopCode ? String(shopCode).trim().toUpperCase() : null;
  const key                = storeKey(normalizedEmail, normalizedShopCode);

  const record = otpStore.get(key);

  if (!record) {
    return res.status(400).json({ message: "OTP not found or already expired. Please request a new one." });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }

  if (record.otp !== String(otp).trim()) {
    return res.status(400).json({ message: "Incorrect OTP. Please try again." });
  }

  // Mark as verified — keeps the record alive for the reset step
  record.verified = true;
  otpStore.set(key, record);

  return res.json({ message: "OTP verified successfully." });
};

//  POST /api/forgot-password/reset-password 
// Body: { email, otp, newPassword, shopCode? }
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword, shopCode } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "Email, OTP and new password are required." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const normalizedEmail    = email.trim().toLowerCase();
  const normalizedShopCode = shopCode ? String(shopCode).trim().toUpperCase() : null;
  const key                = storeKey(normalizedEmail, normalizedShopCode);

  const record = otpStore.get(key);

  if (!record) {
    return res.status(400).json({ message: "Session expired. Please start the reset process again." });
  }

  if (!record.verified) {
    return res.status(400).json({ message: "OTP not verified. Please verify your OTP first." });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return res.status(400).json({ message: "Session expired. Please start the reset process again." });
  }

  if (record.otp !== String(otp).trim()) {
    return res.status(400).json({ message: "Invalid session. Please start the reset process again." });
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 12);

    if (record.userSource === "master") {
      // system_admin or shop_admin — update in masterPool
      const result = await masterPool.query(
        `UPDATE users SET password = $1 WHERE LOWER(email) = $2 RETURNING user_id`,
        [hashed, normalizedEmail]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "User not found." });
      }

    } else if (record.userSource === "shop") {
      // store_manager or cashier — update in their shop's DB
      if (!record.db_name) {
        return res.status(500).json({ message: "Shop database not resolved. Please restart the process." });
      }

      const shopPool = getShopPool(record.db_name);
      const result   = await shopPool.query(
        `UPDATE users SET password = $1 WHERE LOWER(email) = $2 RETURNING user_id`,
        [hashed, normalizedEmail]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "User not found in shop database." });
      }
    }

    // Invalidate OTP record
    otpStore.delete(key);

    console.log(`[FORGOT-PW] Password reset for ${normalizedEmail} (source: ${record.userSource})`);

    return res.json({ message: "Password reset successfully. You can now log in with your new password." });

  } catch (error) {
    console.error("[FORGOT-PW] resetPassword error:", error.message);
    return res.status(500).json({ message: "Server error", detail: error.message });
  }
};