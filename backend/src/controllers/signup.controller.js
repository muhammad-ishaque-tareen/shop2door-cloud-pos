const bcrypt     = require("bcrypt");
const jwt        = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const masterPool = require("../db/master.pool");

//  In-Memory OTP Store
//  Structure: { email -> { otp, expiresAt, verified } }
const otpStore = new Map();

// Auto-purge expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (record.expiresAt < now) otpStore.delete(email);
  }
}, 60 * 1000);

//  Nodemailer transporter (Gmail + App Password)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

//  Helpers

/** Generate a 6-digit OTP */
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/** Validate email format */
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);


//  1. POST /api/signup/send-otp
//     Body: { email }
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const existing = await masterPool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [cleanEmail]
    );
    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "This email is already registered. Please log in." });
    }

    const otp       = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(cleanEmail, { otp, expiresAt, verified: false });

   await transporter.sendMail({
  from: `"Shop2Door" <${process.env.EMAIL_USER}>`,
  to: cleanEmail,
  subject: "Your Shop2Door Verification Code",
  html: `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f9f9f9;padding:40px 32px;">
      <div style="max-width:480px;margin:0 auto;">

        <div style="margin-bottom:20px;">
          <span style="font-size:22px;font-weight:700;color:#9c27b0;letter-spacing:-0.5px;">Shop2Door</span>
        </div>

        <h2 style="color:#1f2937;font-size:20px;font-weight:600;margin:0 0 4px;">Verify your email address</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
          Enter the code below to confirm your identity and continue.
        </p>

        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;
                    padding:28px 24px;text-align:center;margin-bottom:20px;">
          <p style="color:#9ca3af;font-size:12px;font-weight:600;
                    letter-spacing:1px;text-transform:uppercase;margin:0 0 14px;">
            Your verification code
          </p>
          <div style="display:inline-flex;gap:10px;">
            ${otp.toString().split("").map(digit => `
              <span style="display:inline-block;background:#f3e8ff;color:#7e22ce;
                           font-size:30px;font-weight:800;font-family:monospace;
                           width:48px;height:56px;line-height:56px;text-align:center;
                           border-radius:8px;border:1.5px solid #d8b4fe;">
                ${digit}
              </span>
            `).join("")}
          </div>
          <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
            Expires in <strong style="color:#374151;">5 minutes</strong>
          </p>
        </div>

        <div style="background:#fef3c7;border-left:3px solid #f59e0b;
                    border-radius:0 6px 6px 0;padding:10px 14px;margin-bottom:20px;">
          <p style="color:#92400e;font-size:13px;font-weight:600;margin:0;">
            🔒 Never share this code with anyone. Shop2Door will never ask for it.
          </p>
        </div>

        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
          If you didn't request this code, you can safely ignore this email.
          Someone may have entered your address by mistake.
        </p>

        <div style="border-top:1px solid #e5e7eb;margin-top:28px;padding-top:20px;">
          <p style="color:#6b7280;font-size:13px;margin:0 0 6px;">
            Need help? Reach out to our support team:
          </p>
          <a href="mailto:info.shop2door@gmail.com"
             style="display:inline-block;background:#f3e8ff;color:#7e22ce;font-size:13px;
                    font-weight:600;padding:8px 16px;border-radius:6px;
                    text-decoration:none;border:1px solid #d8b4fe;">
            info.shop2door@gmail.com
          </a>
          <p style="color:#d1d5db;font-size:11px;margin:16px 0 0;">
            © 2026 SHOP2DOOR. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  `,
});

    return res
      .status(200)
      .json({ message: "OTP sent successfully. Please check your inbox." });

  } catch (error) {
    console.error("[SIGNUP] sendOtp error:", error.message);
    return res
      .status(500)
      .json({ message: "Failed to send OTP. Please try again.", detail: error.message });
  }
};


//  2. POST /api/signup/verify-otp
//     Body: { email, otp }
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const record     = otpStore.get(cleanEmail);

  if (!record) {
    return res
      .status(400)
      .json({ message: "No OTP found for this email. Please request a new one." });
  }

  if (record.verified) {
    return res.status(400).json({ message: "This OTP has already been used." });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return res
      .status(400)
      .json({ message: "OTP has expired. Please request a new one." });
  }

  if (record.otp !== String(otp).trim()) {
    return res.status(400).json({ message: "Incorrect OTP. Please try again." });
  }

  otpStore.set(cleanEmail, { ...record, verified: true });

  console.log(`[SIGNUP] Email verified: ${cleanEmail}`);
  return res.status(200).json({ message: "Email verified successfully!" });
};


//  3. POST /api/signup/register
//     Body: { fullName, email, phone }
//     NOTE: No password required here — a temporary password is generated
//     and sent to the user by email when their shop request is approved.
exports.register = async (req, res) => {
  const { fullName, email, phone } = req.body;

  if (!fullName || !email || !phone) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanPhone = phone.trim();
  const cleanName  = fullName.trim();

  //  Check email is OTP-verified in memory
  const record = otpStore.get(cleanEmail);

  if (!record || !record.verified) {
    return res.status(403).json({
      message: "Email not verified. Please verify your email with OTP before registering.",
    });
  }

  try {
    //  Duplicate email check
    const dupEmail = await masterPool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [cleanEmail]
    );
    if (dupEmail.rows.length > 0) {
      return res.status(409).json({ message: "This email is already registered." });
    }

    //  Duplicate phone check
    const dupPhone = await masterPool.query(
      "SELECT user_id FROM users WHERE phone = $1",
      [cleanPhone]
    );
    if (dupPhone.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "This phone number is already registered." });
    }

    //  Use a placeholder password — will be replaced by temp password on approval
    const placeholderHash = await bcrypt.hash(
      "PENDING_APPROVAL_" + Date.now(),
      12
    );

    //  Insert user
    const insertResult = await masterPool.query(
      `INSERT INTO users (name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, 'shop_admin')
       RETURNING user_id, name, email, phone, role, created_at`,
      [cleanName, cleanEmail, cleanPhone, placeholderHash]
    );

    const newUser = insertResult.rows[0];

    //  Clean up OTP from memory
    otpStore.delete(cleanEmail);

    //  Sign JWT (shop_id and db_name are null until shop is approved)
    const token = jwt.sign(
      {
        id:      newUser.user_id,
        shop_id: null,
        db_name: null,
        role:    newUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log(`[SIGNUP] New shop_admin registered: ${cleanEmail}`);

    return res.status(201).json({
      token,
      user: {
        id:         newUser.user_id,
        name:       newUser.name,
        email:      newUser.email,
        phone:      newUser.phone,
        role:       newUser.role,
        shop_id:    null,
        db_name:    null,
        created_at: newUser.created_at,
      },
    });

  } catch (error) {
    console.error("[SIGNUP] register error:", error.message);
    console.error(error.stack);
    return res
      .status(500)
      .json({ message: "Server error", detail: error.message });
  }
};