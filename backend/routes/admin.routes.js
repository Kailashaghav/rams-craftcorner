const express = require('express');
const router = express.Router();
// TODO: Implement admin controller and routes
router.get('/', (req, res) => res.json({ success: true, message: 'admin API endpoint' }));
module.exports = router;
