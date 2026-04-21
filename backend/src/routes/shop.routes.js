const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { getShopProfile, getShopUsage, getShopSubscription } = require('../controllers/shop.controller');

router.get("/profile", auth, getShopProfile);
router.get("/usage", auth, getShopUsage);
router.get('/subscription', auth, getShopSubscription);

module.exports = router;