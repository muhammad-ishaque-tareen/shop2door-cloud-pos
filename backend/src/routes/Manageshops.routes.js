const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const {
  getAllShops,
  getShopById,
  updateShop,
  toggleShopStatus,
} = require("../controllers/manageshops.controller");

router.get("/",                auth, getAllShops);
router.get("/:id",             auth, getShopById);
router.put("/:id",             auth, updateShop);
router.patch("/:id/status",    auth, toggleShopStatus);

module.exports = router;