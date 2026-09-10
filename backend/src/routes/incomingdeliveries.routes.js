// incomingdeliveries.routes.js
const router = require('express').Router();
const auth   = require('../middlewares/auth.middleware');
const shop   = require('../middlewares/shop.middleware');

const {
  getIncomingOrders,
  receiveOrder,
} = require('../controllers/incomingdeliveries.controller');

/*
  Only store staff can touch this feature — Shop Admin manages/creates
  orders from the Suppliers page instead, and should never be the one
  confirming a physical delivery they didn't see arrive.

  This also enforces that req.user.store_id exists before the controller
  ever runs a store-scoped query with it.
*/
const requireStoreStaff = (req, res, next) => {
  if (!['cashier', 'store_manager'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only store staff can receive deliveries.' });
  }
  if (!req.user.store_id) {
    return res.status(403).json({ message: 'No store assigned to this account.' });
  }
  next();
};

// GET /api/incoming-deliveries
// -> pending supply orders addressed to MY store only (never another store's)
router.get('/', auth, shop, requireStoreStaff, getIncomingOrders);

// PUT /api/incoming-deliveries/:orderId/receive
// Body: { barcodes: { [order_item_id]: "1234567890" } }  (only for unlinked/new items)
// Deliberately has NO route for editing price/quantity/notes or cancelling —
// this endpoint can only ever confirm receipt of an order already placed.
router.put('/:orderId/receive', auth, shop, requireStoreStaff, receiveOrder);

module.exports = router;