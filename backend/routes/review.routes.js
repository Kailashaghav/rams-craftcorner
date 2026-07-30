const express = require('express');
const router = express.Router();
// TODO: Implement review controller and routes
router.get('/', (req, res) => res.json({ success: true, message: 'review API endpoint' }));
module.exports = router;
