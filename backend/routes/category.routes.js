const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/category.controller');
const { protectAdmin } = require('../middleware/auth.middleware');
const { uploadProductImages } = require('../config/cloudinary');

router.get('/', ctrl.getCategories);
router.get('/:slug', ctrl.getCategory);
router.post('/', protectAdmin, uploadProductImages.single('image'), ctrl.createCategory);
router.put('/:id', protectAdmin, uploadProductImages.single('image'), ctrl.updateCategory);
router.delete('/:id', protectAdmin, ctrl.deleteCategory);

module.exports = router;
