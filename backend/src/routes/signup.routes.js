const express = require("express");
const router  = express.Router();

const {
  sendOtp,
  verifyOtp,
  register,
} = require("../controllers/signup.controller");

// POST /api/signup/send-otp    → validate email, check duplicate, send OTP
router.post("/send-otp",   sendOtp);

// POST /api/signup/verify-otp  → check OTP + expiry, mark verified
router.post("/verify-otp", verifyOtp);

// POST /api/signup/register    → validate all fields, create user in Platform DB
router.post("/register",   register);

module.exports = router;