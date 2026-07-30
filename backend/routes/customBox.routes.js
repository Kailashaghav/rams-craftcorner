const express = require('express');
const router = express.Router();
// TODO: Implement customBox controller and routes
router.get('/', (req, res) => res.json({ success: true, message: 'customBox API endpoint' }));
module.exports = router;
