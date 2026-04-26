const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const {
  // Shop-admin facing (self-service)
  getMySubscription,
  getMyUsage,
  getBillingHistory,
  getAvailablePlans,
  upgradePlan,

  // System-admin facing (management)
  getSubscriptions,
  getSubscriptionById,
  toggleSubscriptionStatus,
  updateSubscription,
} = require("../controllers/subscriptions.controller");

//  Shop-admin routes (used by the Subscription page) 
// These sit under /api/shop/ — mount this router there in app.js
// e.g.  app.use('/api/shop', require('./routes/subscriptions.routes'));
router.get("/subscription",     auth, getMySubscription);
router.get("/usage",            auth, getMyUsage);
router.get("/billing-history",  auth, getBillingHistory);
router.get("/available-plans",  auth, getAvailablePlans);
router.post("/upgrade-plan",    auth, upgradePlan);

//  System-admin management routes 
// These sit under /api/subscriptions/
// e.g.  app.use('/api/subscriptions', require('./routes/subscriptions.routes'));
router.get("/",              auth, getSubscriptions);
router.get("/:id",           auth, getSubscriptionById);
router.put("/:id",           auth, updateSubscription);
router.patch("/:id/status",  auth, toggleSubscriptionStatus);

module.exports = router;