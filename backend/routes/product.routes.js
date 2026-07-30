const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/product.controller');
const { protectAdmin } = require('../middleware/auth.middleware');
const { uploadProductImages } = require('../config/cloudinary');

router.get('/', ctrl.getProducts);
router.get('/featured', ctrl.getFeaturedProducts);
router.get('/:slug', ctrl.getProduct);
router.post('/', protectAdmin, uploadProductImages.array('images', 5), ctrl.createProduct);
router.put('/:id', protectAdmin, uploadProductImages.array('images', 5), ctrl.updateProduct);
router.delete('/:id', protectAdmin, ctrl.deleteProduct);
module.exports = router;
