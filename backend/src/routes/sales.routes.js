// module.exports = router;
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const shop = require("../middlewares/shop.middleware");
const { createSale } = require("../controllers/sales.controller");

router.post("/", auth, shop, createSale);

module.exports = router;