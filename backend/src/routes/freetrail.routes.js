// routes/freetrail.routes.js

const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const {
  checkTrialStatus,
  checkEmailUsed,
} = require("../controllers/freetrail.controller");

// GET /api/freetrail/check-status  — requires auth (shop_admin JWT)
router.get("/check-status", auth, checkTrialStatus);

// GET /api/freetrail/check-email?email=xxx  — public (called before login)
router.get("/check-email", checkEmailUsed);

module.exports = router;