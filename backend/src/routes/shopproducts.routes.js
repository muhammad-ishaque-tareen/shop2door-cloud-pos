const router = require('express').Router();
const auth   = require('../middlewares/auth.middleware');
const shop   = require('../middlewares/shop.middleware');

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  deleteCategory,
  uploadProductImage,
} = require('../controllers/shopproducts.controller');

// Category routes
router.get   ('/categories',     auth, shop, getCategories);
router.post  ('/categories',     auth, shop, createCategory);
router.delete('/categories/:id', auth, shop, deleteCategory);

// Product routes
router.get   ('/',    auth, shop, getProducts);
router.post  ('/',    auth, shop, uploadProductImage, createProduct);
router.get   ('/:id', auth, shop, getProductById);
router.put   ('/:id', auth, shop, uploadProductImage, updateProduct);
router.delete('/:id', auth, shop, deleteProduct);

module.exports = router;