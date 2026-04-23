const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
} = require("../controllers/packages.controller");

router.get("/",    getPackages);  
router.get("/",       auth, getPackages);
router.get("/:id",    auth, getPackageById);
router.post("/",      auth, createPackage);
router.put("/:id",    auth, updatePackage);
router.delete("/:id", auth, deletePackage);

module.exports = router;