const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

const {
  // System-admin facing (management)
  getSubscriptions,
  getSubscriptionById,
  toggleSubscriptionStatus,
  updateSubscription,
} = require("../controllers/subscriptions.controller");

//  System-admin management routes 
// Mounted at /api/subscriptions  (see app.js)
// These are for the system-admin panel to view & manage all subscriptions.
//
// NOTE: The shop-admin self-service routes (subscription, usage, billing-history,
//       available-plans, upgrade-plan) are handled in shop.routes.js so that the
//       frontend's calls to /api/shop/* work correctly.

router.get("/",              auth, authorizeRoles("system_admin"), getSubscriptions);
router.get("/:id",           auth, authorizeRoles("system_admin"), getSubscriptionById);
router.put("/:id",           auth, authorizeRoles("system_admin"), updateSubscription);
router.patch("/:id/status",  auth, authorizeRoles("system_admin"), toggleSubscriptionStatus);

module.exports = router;