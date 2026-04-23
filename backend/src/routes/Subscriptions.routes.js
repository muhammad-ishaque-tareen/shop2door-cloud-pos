const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const {
  getSubscriptions,
  getSubscriptionById,
  toggleSubscriptionStatus,
  updateSubscription,
} = require("../controllers/subscriptions.controller");

router.get("/",                  auth, getSubscriptions);
router.get("/:id",               auth, getSubscriptionById);
router.put("/:id",               auth, updateSubscription);
router.patch("/:id/status",      auth, toggleSubscriptionStatus);

module.exports = router;