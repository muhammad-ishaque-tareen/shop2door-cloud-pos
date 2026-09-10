const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");
const {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
} = require("../controllers/packages.controller");

router.get("/",       auth, authorizeRoles("system_admin"), getPackages);
router.get("/:id",    auth, authorizeRoles("system_admin"), getPackageById);
router.post("/",      auth, authorizeRoles("system_admin"), createPackage);
router.put("/:id",    auth, authorizeRoles("system_admin"), updatePackage);
router.delete("/:id", auth, authorizeRoles("system_admin"), deletePackage);

module.exports = router;