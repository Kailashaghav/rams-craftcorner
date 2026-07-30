const express = require('express');
const router = express.Router();
// TODO: Implement upload controller and routes
router.get('/', (req, res) => res.json({ success: true, message: 'upload API endpoint' }));
module.exports = router;
