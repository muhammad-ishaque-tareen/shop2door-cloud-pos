const router  = require("express").Router();
const auth    = require("../middlewares/auth.middleware");
const shop    = require("../middlewares/shop.middleware");
const multer  = require("multer");
const path    = require("path");

const {
  getCategories,
  createCategory,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

// ── Multer setup for product image uploads ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../../uploads/products"));
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG and WebP images are allowed"));
    }
  },
});

//Category routes 
router.get("/categories",  auth, shop, getCategories);
router.post("/categories", auth, shop, createCategory);

//Product routes
router.get("/",     auth, shop, getProducts);
router.post("/",    auth, shop, upload.single("image"), createProduct);
router.get("/:id",  auth, shop, getProductById);
router.put("/:id",  auth, shop, upload.single("image"), updateProduct);
router.delete("/:id", auth, shop, deleteProduct);

module.exports = router;