/**
 * Cart Controller - Full implementation
 */
const db = require('../config/database');

// Helper to get cart items
async function getCartItems(userId) {
  return db.query(
    `SELECT c.id, c.product_id, c.quantity, c.saved_for_later,
      p.name as product_name, p.price, p.sale_price,
      COALESCE(p.sale_price, p.price) as unit_price,
      (SELECT image_url FROM product_images
       WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as product_image,
      COALESCE(i.quantity, 0) as stock
     FROM cart c
     JOIN products p ON c.product_id = p.id
     LEFT JOIN inventory i ON p.id = i.product_id
     WHERE c.user_id = ? AND c.saved_for_later = FALSE
     ORDER BY c.created_at DESC`,
    [userId]
  );
}

// Get cart
exports.getCart = async (req, res, next) => {
  try {
    const items = await getCartItems(req.user.id);
    res.json({ success: true, items });
  } catch (err) { next(err); }
};

// Add to cart
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Check product exists
    const [product] = await db.query(
      `SELECT p.id, p.name, p.is_active, COALESCE(i.quantity, 0) as stock
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.id = ?`,
      [productId]
    );

    if (!product || !product.is_active) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check existing cart item
    const [existing] = await db.query(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND saved_for_later = FALSE',
      [userId, productId]
    );

    if (existing) {
      const newQty = existing.quantity + parseInt(quantity);
      await db.query(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQty, existing.id]
      );
    } else {
      await db.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, parseInt(quantity)]
      );
    }

    const items = await getCartItems(userId);
    res.json({ success: true, message: 'Added to cart!', items });
  } catch (err) { next(err); }
};

// Update quantity
exports.updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    if (parseInt(quantity) < 1) {
      await db.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [id, userId]);
    } else {
      await db.query(
        'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
        [parseInt(quantity), id, userId]
      );
    }

    const items = await getCartItems(userId);
    res.json({ success: true, items });
  } catch (err) { next(err); }
};

// Remove item
exports.removeFromCart = async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM cart WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    const items = await getCartItems(req.user.id);
    res.json({ success: true, message: 'Removed from cart', items });
  } catch (err) { next(err); }
};

// Clear cart
exports.clearCart = async (req, res, next) => {
  try {
    await db.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, items: [] });
  } catch (err) { next(err); }
};

// Apply coupon
exports.applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const [coupon] = await db.query(
      `SELECT * FROM coupons
       WHERE code = ? AND is_active = TRUE
       AND valid_from <= NOW() AND valid_until >= NOW()
       AND (usage_limit IS NULL OR used_count < usage_limit)`,
      [code.toUpperCase()]
    );

    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    // Check per user limit
    const [usage] = await db.query(
      'SELECT COUNT(*) as cnt FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
      [coupon.id, req.user.id]
    );

    if (coupon.per_user_limit && usage.cnt >= coupon.per_user_limit) {
      return res.status(400).json({ success: false, message: 'You have already used this coupon' });
    }

    res.json({ success: true, message: 'Coupon applied!', coupon });
  } catch (err) { next(err); }
};
