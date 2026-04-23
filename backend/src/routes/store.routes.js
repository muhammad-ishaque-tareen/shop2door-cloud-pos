const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const shop = require('../middlewares/shop.middleware');
const {
  getStores,
  createStore,
  getStoreById,
  updateStore
} = require('../controllers/store.controller');

router.get('/',       auth, shop, getStores);
router.post('/',      auth, shop, createStore);
router.get('/:id',    auth, shop, getStoreById);
router.put('/:id',    auth, shop, updateStore);

module.exports = router;