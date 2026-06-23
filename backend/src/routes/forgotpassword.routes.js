const express = require("express");
const router  = express.Router();
const {
  sendOtp,
  verifyOtp,
  resetPassword,
} = require("../controllers/forgotpassword.controller");

// POST /api/forgot-password/send-otp
router.post("/send-otp", sendOtp);

// POST /api/forgot-password/verify-otp
router.post("/verify-otp", verifyOtp);

// POST /api/forgot-password/reset-password
router.post("/reset-password", resetPassword);

module.exports = router;