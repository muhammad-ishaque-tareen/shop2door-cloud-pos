const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const shop = require('../middlewares/shop.middleware');
const {
  getStores,
  createStore,
  getStoreById,
  updateStore
} = require('../controllers/store.controller');

// GET    /api/stores          → all stores for this shop
router.get('/',       auth, shop, getStores);

// POST   /api/stores          → create a new store
router.post('/',      auth, shop, createStore);

// GET    /api/stores/:id      → single store by ID
router.get('/:id',    auth, shop, getStoreById);

// PUT    /api/stores/:id      → update a store
router.put('/:id',    auth, shop, updateStore);

module.exports = router;