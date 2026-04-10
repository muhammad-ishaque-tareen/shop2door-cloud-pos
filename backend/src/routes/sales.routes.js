const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const shop = require("../middlewares/shop.middleware");
const { createSale, getMySales, getSaleByReceipt, processReturn } = require("../controllers/sales.controller");

router.post("/", auth, shop, createSale);
router.get("/my", auth, shop, getMySales);
router.get("/receipt/:receipt_no", auth, shop, getSaleByReceipt);
router.post("/return", auth, shop, processReturn);

module.exports = router;