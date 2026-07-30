/**
 * Auth Controller
 * Registration, login, OTP verification, and OTP-based password reset.
 * Email errors never crash the app — always caught and logged.
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db     = require('../config/database');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt.utils');
const { sendWelcomeEmail, sendOTPEmail } = require('../services/email.service');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const otp = generateOTP();

    const result = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, otp, otp_expiry)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
      [name, email, phone || null, password_hash, otp]
    );

    await sendOTPEmail({ name, email }, otp);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with the OTP sent.',
      userId: result.insertId,
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    });
  } catch (err) {
    next(err);
  }
};

// ─── Verify OTP (email verification) ───────────────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const [user] = await db.query(
      'SELECT id, otp, otp_expiry, name, email, role, is_verified FROM users WHERE id = ?',
      [userId]
    );

    if (!user)            return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.is_verified) return res.status(400).json({ success: false, message: 'Email already verified.' });
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    if (new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const { accessToken, refreshToken } = generateTokenPair({ id: user.id, role: user.role });

    await db.query(
      'UPDATE users SET is_verified = TRUE, otp = NULL, otp_expiry = NULL, refresh_token = ? WHERE id = ?',
      [refreshToken, user.id]
    );

    await sendWelcomeEmail(user);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Resend OTP (email verification) ───────────────────────────────────────────
exports.resendOTP = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const [user] = await db.query('SELECT id, name, email, is_verified FROM users WHERE id = ?', [userId]);
    if (!user)            return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.is_verified) return res.status(400).json({ success: false, message: 'Email already verified.' });

    const otp = generateOTP();
    await db.query(
      'UPDATE users SET otp = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?',
      [otp, user.id]
    );
    await sendOTPEmail(user, otp);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully.',
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    });
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [user] = await db.query(
      'SELECT id, name, email, phone, avatar_url, password_hash, role, is_verified, is_blocked FROM users WHERE email = ?',
      [email]
    );

    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    if (user.is_blocked) return res.status(403).json({ success: false, message: 'Your account has been suspended.' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (!user.is_verified) {
      const otp = generateOTP();
      await db.query(
        'UPDATE users SET otp = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?',
        [otp, user.id]
      );
      await sendOTPEmail(user, otp);
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent.',
        userId: user.id,
        requiresVerification: true,
        ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
      });
    }

    const { accessToken, refreshToken } = generateTokenPair({ id: user.id, role: user.role });
    await db.query('UPDATE users SET refresh_token = ?, last_login = NOW() WHERE id = ?', [refreshToken, user.id]);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: {
        id: user.id, name: user.name, email: user.email,
        phone: user.phone, avatar_url: user.avatar_url, role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin Login ──────────────────────────────────────────────────────────────
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [admin] = await db.query(
      'SELECT id, name, email, password_hash, permissions, is_active FROM admins WHERE email = ?',
      [email]
    );

    if (!admin)           return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    if (!admin.is_active) return res.status(403).json({ success: false, message: 'Admin account inactive.' });

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

    const { accessToken, refreshToken } = generateTokenPair({ id: admin.id, role: 'admin' });
    await db.query('UPDATE admins SET refresh_token = ?, last_login = NOW() WHERE id = ?', [refreshToken, admin.id]);

    res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      accessToken,
      refreshToken,
      admin: { id: admin.id, name: admin.name, email: admin.email, permissions: admin.permissions, role: 'admin' },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required.' });

    const decoded = verifyRefreshToken(refreshToken);
    const [user] = await db.query(
      'SELECT id, role, refresh_token, is_blocked FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user || user.refresh_token !== refreshToken || user.is_blocked) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const tokens = generateTokenPair({ id: user.id, role: user.role });
    await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [tokens.refreshToken, user.id]);

    res.status(200).json({ success: true, ...tokens });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD — OTP-based, 3 steps
// Step 1: forgotPassword     → send OTP to email
// Step 2: verifyResetOTP     → verify OTP, issue short-lived resetToken
// Step 3: resetPassword      → use resetToken to set new password
// ══════════════════════════════════════════════════════════════════════════

// ─── Step 1: Send OTP ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const [user] = await db.query('SELECT id, name, email FROM users WHERE email = ?', [email]);

    // Always respond success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ success: true, message: 'If an account exists, an OTP has been sent.' });
    }

    const otp = generateOTP();

    // Use MySQL's own NOW() for the expiry — avoids any Node/MySQL timezone mismatch
    await db.query(
      'UPDATE users SET otp = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?',
      [otp, user.id]
    );

    await sendOTPEmail(user, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email.',
      userId: user.id,
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    });
  } catch (err) {
    next(err);
  }
};

// ─── Step 2: Verify OTP, issue reset token ────────────────────────────────────
exports.verifyResetOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const [user] = await db.query(
      'SELECT id, otp, otp_expiry FROM users WHERE id = ?',
      [userId]
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    if (new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    // Use MySQL's own NOW() + INTERVAL for expiry, matching how resetPassword checks it
    await db.query(
      `UPDATE users
       SET reset_token = ?, reset_expiry = DATE_ADD(NOW(), INTERVAL 15 MINUTE),
           otp = NULL, otp_expiry = NULL
       WHERE id = ?`,
      [resetToken, user.id]
    );

    res.status(200).json({
      success: true,
      message: 'OTP verified. You can now reset your password.',
      resetToken,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Step 3: Reset password using resetToken ──────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is missing.' });
    }

    const [user] = await db.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_expiry > NOW()',
      [token]
    );

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset session. Please start again.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await db.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?',
      [password_hash, user.id]
    );

    res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
};

// ─── Resend Reset OTP ──────────────────────────────────────────────────────────
exports.resendResetOTP = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const [user] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const otp = generateOTP();
    await db.query(
      'UPDATE users SET otp = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?',
      [otp, user.id]
    );
    await sendOTPEmail(user, otp);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully.',
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Profile ──────────────────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const [user] = await db.query(
      'SELECT id, name, email, phone, avatar_url, role, is_verified, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    await db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};