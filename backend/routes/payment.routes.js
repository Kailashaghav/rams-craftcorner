const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payment.controller');
const { protect, protectAdmin } = require('../middleware/auth.middleware');

router.post('/create-order', protect, ctrl.createRazorpayOrder);
router.post('/verify', protect, ctrl.verifyPayment);
router.post('/failure', protect, ctrl.paymentFailure);
router.post('/refund', protectAdmin, ctrl.initiateRefund);
router.get('/status/:orderId', protect, ctrl.getPaymentStatus);
module.exports = router;
