const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');

router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must be 8+ chars with uppercase, lowercase and number'),
], validate, auth.register);

router.post('/verify-otp', [
  body('userId').isInt().withMessage('Valid user ID required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], validate, auth.verifyOTP);

router.post('/resend-otp', [body('userId').isInt()], validate, auth.resendOTP);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, auth.login);

router.post('/admin/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, auth.adminLogin);

router.post('/refresh-token', [body('refreshToken').notEmpty()], validate, auth.refreshToken);

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], validate, auth.forgotPassword);

router.post('/verify-reset-otp', [
  body('userId').isInt().withMessage('Valid user ID required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], validate, auth.verifyResetOTP);

router.post('/resend-reset-otp', [body('userId').isInt()], validate, auth.resendResetOTP);

router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must be 8+ chars with uppercase, lowercase and number'),
], validate, auth.resetPassword);

router.get('/profile', protect, auth.getProfile);
router.post('/logout', protect, auth.logout);

module.exports = router;