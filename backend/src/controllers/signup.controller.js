const bcrypt     = require("bcrypt");
const jwt        = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const masterPool = require("../db/master.pool");
//  In-Memory OTP Store  (no DB table needed)
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
    user: process.env.EMAIL_USER,         // e.g. yourapp@gmail.com
    pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password (not login password)
  },
});

//  Helpers

/** Generate a 6-digit OTP */
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/** Validate email format */
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Validate password strength:
 *  - Minimum 8 characters
 *  - At least one uppercase letter
 *  - At least one lowercase letter
 *  - At least one digit
 *  - At least one special character (@$!%*?&_#^-)
 */
const isStrongPassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#^-]).{8,}$/.test(password);


//  1. POST /api/signup/send-otp
//     Body: { email }
//     - Validates email format
//     - Checks email is not already registered
//     - Generates OTP, saves to in-memory store (1 min expiry)
//     - Sends OTP email
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    // Check if email already registered in Platform DB
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
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute from now

    // Overwrite any existing OTP for this email
    otpStore.set(cleanEmail, { otp, expiresAt, verified: false });

    // Send OTP email
    await transporter.sendMail({
      from:    `"Shop2Door" <${process.env.EMAIL_USER}>`,
      to:      cleanEmail,
      subject: "Your Shop2Door Verification Code",
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;
                    padding:32px;background:#f9f9f9;border-radius:12px;">
          <h2 style="color:#9c27b0;margin-bottom:8px;">Shop2Door</h2>
          <p style="color:#444;font-size:15px;">
            Hello! Use the code below to verify your email address.
          </p>
          <div style="background:#9c27b0;color:white;font-size:36px;font-weight:800;
                      letter-spacing:10px;text-align:center;padding:24px 0;
                      border-radius:10px;margin:24px 0;">
            ${otp}
          </div>
          <p style="color:#777;font-size:13px;">
            This code expires in <strong>5 minute</strong>. Do not share it with anyone.
          </p>
          <p style="color:#bbb;font-size:12px;margin-top:24px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log(`[SIGNUP] OTP sent to ${cleanEmail}`);
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
//     - Checks OTP in memory, checks expiry
//     - Marks verified = true in memory
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

  // Already verified
  if (record.verified) {
    return res.status(400).json({ message: "This OTP has already been used." });
  }

  // Expiry check
  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail); // clean up expired entry
    return res
      .status(400)
      .json({ message: "OTP has expired. Please request a new one." });
  }

  // OTP match
  if (record.otp !== String(otp).trim()) {
    return res.status(400).json({ message: "Incorrect OTP. Please try again." });
  }

  // Mark verified (keep in store so register() can confirm it)
  otpStore.set(cleanEmail, { ...record, verified: true });

  console.log(`[SIGNUP] Email verified: ${cleanEmail}`);
  return res.status(200).json({ message: "Email verified successfully!" });
};


//  3. POST /api/signup/register
//     Body: { fullName, email, phone, password }
//     - Checks email is verified in memory
//     - Validates strong password
//     - Hashes password
//     - Inserts into Platform DB users table
//     - Clears OTP from memory
//     - Returns JWT token
exports.register = async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  //  Basic field validation 
  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (@$!%*?&_#^-).",
    });
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
    //  Check for duplicate email (safety guard) 
    const dupEmail = await masterPool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [cleanEmail]
    );
    if (dupEmail.rows.length > 0) {
      return res.status(409).json({ message: "This email is already registered." });
    }

    //  Check for duplicate phone 
    const dupPhone = await masterPool.query(
      "SELECT user_id FROM users WHERE phone = $1",
      [cleanPhone]
    );
    if (dupPhone.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "This phone number is already registered." });
    }

    //  Hash password 
    const hashedPassword = await bcrypt.hash(password, 12);

    //  Insert user into Platform DB 
    // role = 'shop_admin', shop_id = NULL (assigned after admin approval)
    const insertResult = await masterPool.query(
      `INSERT INTO users (name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, 'shop_admin')
       RETURNING user_id, name, email, phone, role, created_at`,
      [cleanName, cleanEmail, cleanPhone, hashedPassword]
    );

    const newUser = insertResult.rows[0];

    //  Clean up OTP from memory 
    otpStore.delete(cleanEmail);

    //  Sign JWT 
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