/**
 * Analytics Controller
 * Sales analytics, revenue charts, customer metrics for admin dashboard
 */

const db = require('../config/database');

// ─── Dashboard Overview ───────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      [totalRevenue], [monthRevenue],
      [totalOrders],  [pendingOrders],
      [totalCustomers], [newCustomers],
      [totalProducts], [lowStock], [outOfStock],
    ] = await Promise.all([
      db.query("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status NOT IN ('cancelled','returned','refunded')"),
      db.query("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status NOT IN ('cancelled','returned','refunded') AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())"),
      db.query("SELECT COUNT(*) as count FROM orders"),
      db.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"),
      db.query("SELECT COUNT(*) as count FROM users WHERE role = 'customer'"),
      db.query("SELECT COUNT(*) as count FROM users WHERE role = 'customer' AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())"),
      db.query("SELECT COUNT(*) as count FROM products WHERE is_active = 1"),
      db.query("SELECT COUNT(*) as count FROM inventory WHERE quantity <= low_stock_alert AND quantity > 0"),
      db.query("SELECT COUNT(*) as count FROM inventory WHERE quantity = 0"),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        revenue:   { total: totalRevenue.total,     thisMonth: monthRevenue.total },
        orders:    { total: totalOrders.count,       pending:   pendingOrders.count },
        customers: { total: totalCustomers.count,    newThisMonth: newCustomers.count },
        products:  { total: totalProducts.count,     lowStock: lowStock.count, outOfStock: outOfStock.count },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Revenue Chart (last 12 months) ──────────────────────────────────────────
exports.getRevenueChart = async (req, res, next) => {
  try {
    const data = await db.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(*) as orders
       FROM orders
       WHERE status NOT IN ('cancelled','returned','refunded')
         AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`
    );
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─── Top Products ─────────────────────────────────────────────────────────────
// Fixed: uses LEFT JOIN so it works even with zero orders
exports.getTopProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const products = await db.query(
      `SELECT p.id, p.name, p.price,
        COALESCE(SUM(oi.quantity), 0)    as total_sold,
        COALESCE(SUM(oi.total_price), 0) as total_revenue,
        (SELECT image_url FROM product_images
         WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as image
       FROM products p
       LEFT JOIN order_items oi ON p.id = oi.product_id
       LEFT JOIN orders o ON oi.order_id = o.id
         AND o.status NOT IN ('cancelled','returned','refunded')
       WHERE p.is_active = 1
       GROUP BY p.id, p.name, p.price
       ORDER BY total_revenue DESC
       LIMIT ?`,
      [parseInt(limit)]
    );
    res.status(200).json({ success: true, products });
  } catch (err) {
    next(err);
  }
};

// ─── Order Status Distribution ────────────────────────────────────────────────
exports.getOrderStatusDistribution = async (req, res, next) => {
  try {
    const data = await db.query(
      'SELECT status, COUNT(*) as count FROM orders GROUP BY status'
    );
    // Return empty array instead of error if no orders yet
    res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
};

// ─── Category Revenue ─────────────────────────────────────────────────────────
exports.getCategoryRevenue = async (req, res, next) => {
  try {
    const data = await db.query(
      `SELECT c.name as category,
        COALESCE(SUM(oi.total_price), 0) as revenue
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON oi.order_id = o.id
         AND o.status NOT IN ('cancelled','returned','refunded')
       GROUP BY c.id, c.name
       ORDER BY revenue DESC`
    );
    res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
};

// ─── Recent Orders ────────────────────────────────────────────────────────────
exports.getRecentOrders = async (req, res, next) => {
  try {
    const orders = await db.query(
      `SELECT o.id, o.order_number, o.status, o.total, o.created_at,
        u.name as customer_name, u.email as customer_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );
    res.status(200).json({ success: true, orders: orders || [] });
  } catch (err) {
    next(err);
  }
};
