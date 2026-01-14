const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const shop = require("../middlewares/shop.middleware");
const { getProducts } = require("../controllers/product.controller");

router.get("/", auth, shop, getProducts);

module.exports = router;
