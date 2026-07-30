const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/',              ctrl.getCart);
router.post('/',             ctrl.addToCart);
router.put('/:id',          ctrl.updateCartItem);
router.delete('/:id',       ctrl.removeFromCart);
router.delete('/',          ctrl.clearCart);
router.post('/apply-coupon', ctrl.applyCoupon);

module.exports = router;
