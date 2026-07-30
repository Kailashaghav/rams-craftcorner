/**
 * Authentication Middleware
 * Protects routes with JWT verification and role-based access
 */

const { verifyAccessToken } = require('../utils/jwt.utils');
const db = require('../config/database');

// Verify JWT access token
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Fetch fresh user from DB to ensure they're not blocked
    const [user] = await db.query(
      'SELECT id, name, email, role, is_verified, is_blocked FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user || user.is_blocked) {
      return res.status(401).json({ success: false, message: 'Account is inactive or blocked.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Admin-only protection
const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const [admin] = await db.query(
      'SELECT id, name, email, permissions, is_active FROM admins WHERE id = ?',
      [decoded.id]
    );

    if (!admin || !admin.is_active) {
      return res.status(401).json({ success: false, message: 'Admin account inactive.' });
    }

    req.admin = admin;
    req.user = { ...admin, role: 'admin' };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid admin token.' });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user?.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

// Optional auth (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      const [user] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
      if (user && !user.is_blocked) req.user = user;
    }
  } catch {
    // Silent fail for optional auth
  }
  next();
};

module.exports = { protect, protectAdmin, authorize, optionalAuth };
