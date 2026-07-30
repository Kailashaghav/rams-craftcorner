const express = require('express');
const router = express.Router();
// TODO: Implement shipping controller and routes
router.get('/', (req, res) => res.json({ success: true, message: 'shipping API endpoint' }));
module.exports = router;
