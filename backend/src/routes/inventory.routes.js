// inventory.routes.js
const router = require('express').Router();
const auth   = require('../middlewares/auth.middleware');
const shop   = require('../middlewares/shop.middleware');

const {
  getSummary,
  getInventory,
  adjustStock,
  getStores,
} = require('../controllers/inventory.controller');

// Summary stats (cards at top)
router.get('/summary', auth, shop, getSummary);

// Store list (for filter dropdown)
router.get('/stores', auth, shop, getStores);

// Full inventory list  (supports ?store_id &category_id &status &search)
router.get('/', auth, shop, getInventory);

// Stock adjustment
router.put('/:productId/adjust', auth, shop, adjustStock);

module.exports = router;