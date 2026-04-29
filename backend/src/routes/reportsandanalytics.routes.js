// reportsandanalytics.routes.js

const router = require('express').Router();
const auth   = require('../middlewares/auth.middleware');
const shop   = require('../middlewares/shop.middleware');

const {
  getOverview,
  getSalesReport,
  getInventoryReport,
  getStorePerformance,
  getProductAnalysis,
  getPaymentReport,
} = require('../controllers/reportsandanalytics.controller');

// GET /api/reportsandanalytics/overview , dashboard KPIs + charts
router.get('/overview',          auth, shop, getOverview);

// GET /api/reportsandanalytics/sales-report , paginated sales report
router.get('/sales-report',      auth, shop, getSalesReport);

// GET /api/reportsandanalytics/inventory-report, stock levels + in/out
router.get('/inventory-report',  auth, shop, getInventoryReport);

// GET /api/reportsandanalytics/store-performance — per-store KPIs
router.get('/store-performance', auth, shop, getStorePerformance);

// GET /api/reportsandanalytics/product-analysis, top/slow sellers + categories
router.get('/product-analysis',  auth, shop, getProductAnalysis);

// GET /api/reportsandanalytics/payment-report, payment methods breakdown
router.get('/payment-report',    auth, shop, getPaymentReport);

module.exports = router;