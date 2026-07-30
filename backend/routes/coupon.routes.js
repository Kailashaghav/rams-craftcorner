const express = require('express');
const router = express.Router();
// TODO: Implement coupon controller and routes
router.get('/', (req, res) => res.json({ success: true, message: 'coupon API endpoint' }));
module.exports = router;
