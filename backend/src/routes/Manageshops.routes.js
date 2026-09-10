const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");
const {
  getAllShops,
  getShopById,
  updateShop,
  toggleShopStatus,
} = require("../controllers/manageshops.controller");

router.get("/",                auth, authorizeRoles("system_admin"), getAllShops);
router.get("/:id",             auth, authorizeRoles("system_admin"), getShopById);
router.put("/:id",             auth, authorizeRoles("system_admin"), updateShop);
router.patch("/:id/status",    auth, authorizeRoles("system_admin"), toggleShopStatus);

module.exports = router;