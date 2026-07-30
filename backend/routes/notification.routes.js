const express = require('express');
const router = express.Router();
// TODO: Implement notification controller and routes
router.get('/', (req, res) => res.json({ success: true, message: 'notification API endpoint' }));
module.exports = router;
