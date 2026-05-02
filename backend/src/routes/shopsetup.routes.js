const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");

const verifyToken = require("../middlewares/auth.middleware");
const { submitShopSetup, submitPayment } = require("../controllers/shopsetup.controller");

//  Multer — logo upload 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "uploads", "logos"));
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `logo_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok =
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Only image files are allowed."));
  },
});

// POST /api/shopsetup   → ShopSetup page submits here
router.post("/", verifyToken, upload.single("logo"), submitShopSetup);
// shopsetup_routes.js  — add this line
router.put("/:id/payment", verifyToken, submitPayment);

module.exports = router;