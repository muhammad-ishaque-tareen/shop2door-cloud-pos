const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const shop = require("../middlewares/shop.middleware");
const {
  createSale,
  getMySales,
  getSaleByReceipt,
  processReturn
} = require("../controllers/sales.controller");

// POST   /api/sales          → create a new sale
router.post("/",                  auth, shop, createSale);

// GET    /api/sales/my        → sales made by the logged-in cashier/manager
router.get("/my",                 auth, shop, getMySales);

// GET    /api/sales/receipt/:receipt_no → look up one sale by receipt
router.get("/receipt/:receipt_no", auth, shop, getSaleByReceipt);

// POST   /api/sales/return    → process a return
router.post("/return",            auth, shop, processReturn);

module.exports = router;