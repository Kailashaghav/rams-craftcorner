const db = require('../config/database');

exports.getWishlist = async (req, res, next) => {
  try {
    const items = await db.query(
      `SELECT w.id, w.product_id, p.name as product_name, p.price, p.sale_price,
        p.slug, p.avg_rating,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as product_image
       FROM wishlist w JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ? ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, items });
  } catch (err) { next(err); }
};

exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    await db.query(
      'INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
      [req.user.id, productId]
    );
    res.json({ success: true, message: 'Added to wishlist' });
  } catch (err) { next(err); }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) { next(err); }
};
