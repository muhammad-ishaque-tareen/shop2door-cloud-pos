const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { getShopProfile, getShopUsage } = require("../controllers/shop.controller");

router.get("/profile", auth, getShopProfile);
router.get("/usage", auth, getShopUsage);

module.exports = router;