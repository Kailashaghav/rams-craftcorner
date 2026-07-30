const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Contact form submission
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    await db.query(
      'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || null, subject || null, message]
    );
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) { next(err); }
});

// Newsletter subscription
router.post('/newsletter', async (req, res, next) => {
  try {
    const { email } = req.body;
    await db.query(
      'INSERT INTO newsletter (email) VALUES (?) ON DUPLICATE KEY UPDATE is_active = TRUE',
      [email]
    );
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (err) { next(err); }
});

module.exports = router;
