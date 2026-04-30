// suppliers.routes.js
const router = require('express').Router();
const auth   = require('../middlewares/auth.middleware');
const shop   = require('../middlewares/shop.middleware');

const {
  getSummary,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getOrders,
  createOrder,
} = require('../controllers/suppliers.controller');

// Summary stats (cards)
router.get('/summary',            auth, shop, getSummary);

// Supplier CRUD
router.get('/',                   auth, shop, getSuppliers);
router.post('/',                  auth, shop, createSupplier);
router.put('/:id',                auth, shop, updateSupplier);
router.delete('/:id',             auth, shop, deleteSupplier);

// Supply orders per supplier
router.get('/:id/orders',         auth, shop, getOrders);
router.post('/:id/orders',        auth, shop, createOrder);

module.exports = router;