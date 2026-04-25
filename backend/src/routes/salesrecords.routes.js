// salesrecords.routes.js

const router = require('express').Router();
const auth   = require('../middlewares/auth.middleware');
const shop   = require('../middlewares/shop.middleware');

const {
  getSalesRecords,
  getSalesSummary,
  getSaleById,
} = require('../controllers/salesrecords.controller');

// GET /api/salesrecords/summary  — KPIs, chart, store breakdown (must be before /:id)
router.get('/summary', auth, shop, getSalesSummary);

// GET /api/salesrecords        
router.get('/', auth, shop, getSalesRecords);

// GET /api/salesrecords/:id     
router.get('/:id', auth, shop, getSaleById);

module.exports = router;