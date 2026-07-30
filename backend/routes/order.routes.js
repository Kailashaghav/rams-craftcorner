const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/order.controller');
const { protect, protectAdmin } = require('../middleware/auth.middleware');

router.post('/', protect, ctrl.createOrder);
router.get('/my-orders', protect, ctrl.getUserOrders);
router.get('/:id', protect, ctrl.getOrderDetails);
router.post('/:id/cancel', protect, ctrl.cancelOrder);
router.patch('/:id/status', protectAdmin, ctrl.updateOrderStatus);
module.exports = router;
