const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// Get all addresses
router.get('/', async (req, res, next) => {
  try {
    const addresses = await db.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, addresses });
  } catch (err) { next(err); }
});

// Add address
router.post('/', async (req, res, next) => {
  try {
    const { label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default } = req.body;

    if (is_default) {
      await db.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
    }

    const result = await db.query(
      `INSERT INTO addresses (user_id, label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, label || 'Home', full_name, phone, address_line1,
       address_line2 || null, city, state, pincode, is_default || false]
    );

    const [address] = await db.query('SELECT * FROM addresses WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, address });
  } catch (err) { next(err); }
});

// Update address
router.put('/:id', async (req, res, next) => {
  try {
    const { label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default } = req.body;

    if (is_default) {
      await db.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
    }

    await db.query(
      `UPDATE addresses SET label=?, full_name=?, phone=?, address_line1=?, address_line2=?,
       city=?, state=?, pincode=?, is_default=? WHERE id=? AND user_id=?`,
      [label, full_name, phone, address_line1, address_line2 || null,
       city, state, pincode, is_default || false, req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Address updated' });
  } catch (err) { next(err); }
});

// Delete address
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
