const router = require('express').Router();
const auth   = require('../middlewares/auth.middleware');
const shop   = require('../middlewares/shop.middleware');

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categories.controller');

router.get   ('/',    auth, shop, getCategories);
router.post  ('/',    auth, shop, createCategory);
router.get   ('/:id', auth, shop, getCategoryById);
router.put   ('/:id', auth, shop, updateCategory);
router.delete('/:id', auth, shop, deleteCategory);

module.exports = router;