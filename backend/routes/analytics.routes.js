const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analytics.controller');
const { protectAdmin } = require('../middleware/auth.middleware');

router.use(protectAdmin);
router.get('/dashboard', ctrl.getDashboardStats);
router.get('/revenue-chart', ctrl.getRevenueChart);
router.get('/top-products', ctrl.getTopProducts);
router.get('/order-status', ctrl.getOrderStatusDistribution);
router.get('/category-revenue', ctrl.getCategoryRevenue);
router.get('/recent-orders', ctrl.getRecentOrders);
module.exports = router;
