const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");

// Shop profile & basic usage (from shop.controller)
const {
  getShopProfile,
  getShopUsage,
} = require('../controllers/shop.controller');

// All subscription-related shop-admin endpoints (from subscriptions.controller)
const {
  getMySubscription,
  getMyUsage,
  getBillingHistory,
  getAvailablePlans,
  upgradePlan,
} = require('../controllers/subscriptions.controller');

//  Shop profile 
router.get("/profile",          auth, getShopProfile);

//  Usage 
// /api/shop/usage  →  subscriptions.controller (richer, joins packages properly)
router.get("/usage",            auth, getMyUsage);

//  Subscription (self-service) 
router.get("/subscription",     auth, getMySubscription);
router.get("/billing-history",  auth, getBillingHistory);
router.get("/available-plans",  auth, getAvailablePlans);
router.post("/upgrade-plan",    auth, upgradePlan);

module.exports = router;