/**
 * Email Service
 * Handles all transactional emails — gracefully fails if not configured
 */

const nodemailer = require('nodemailer');

// Create transporter — won't crash app if email not configured
let transporter = null;

const initTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email not configured — EMAIL_USER or EMAIL_PASS missing in .env');
    return null;
  }
  try {
    return nodemailer.createTransport({
      host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
      port:   parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });
  } catch (err) {
    console.warn('⚠️  Email transporter error:', err.message);
    return null;
  }
};

transporter = initTransporter();

// ─── Base HTML Template ───────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #fdf2f8; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #ec4899, #a855f7); padding: 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 26px; }
    .header p  { color: rgba(255,255,255,0.85); margin: 5px 0 0; font-size: 13px; }
    .body  { padding: 32px; color: #374151; line-height: 1.7; }
    .btn   { display: inline-block; background: linear-gradient(135deg,#ec4899,#a855f7); color:#fff; text-decoration:none; padding:12px 28px; border-radius:50px; font-weight:700; margin:16px 0; }
    .footer{ background:#fdf2f8; padding:16px; text-align:center; font-size:12px; color:#9ca3af; }
    .otp-box { background:#fdf2f8; border:2px dashed #ec4899; border-radius:12px; padding:20px; text-align:center; font-size:36px; font-weight:700; letter-spacing:10px; color:#ec4899; margin:20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 Craft Corner</h1>
      <p>Curated Gifts, Crafted with Love</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">© ${new Date().getFullYear()} Craft Corner. All rights reserved. · Pune, India</div>
  </div>
</body>
</html>
`;

// ─── Core send function ───────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.log(`📧 [Email skipped — not configured] ${subject} → ${to}`);
    return null;
  }
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Craft Corner" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent: ${subject} → ${to}`);
    return info;
  } catch (err) {
    // Log but never throw — email failure should NOT break login/register
    console.error(`❌ Email failed (${subject}):`, err.message);
    return null;
  }
};

// ─── Email templates ──────────────────────────────────────────────────────────

const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Craft Corner! 🎁',
    html: baseTemplate(`
      <h2>Welcome, ${user.name}! 🎉</h2>
      <p>We're thrilled to have you. Explore our premium handmade gift boxes and create magical moments.</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="btn">Start Exploring</a>
    `),
  });
};

const sendOTPEmail = async (user, otp) => {
  return sendEmail({
    to: user.email,
    subject: 'Craft Corner - Email Verification OTP',
    html: baseTemplate(`
      <h2>Verify Your Email</h2>
      <p>Hi ${user.name}, use this OTP to verify your email. Valid for 10 minutes.</p>
      <div class="otp-box">${otp}</div>
      <p>If you did not request this, ignore this email.</p>
    `),
  });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  return sendEmail({
    to: user.email,
    subject: 'Craft Corner - Password Reset',
    html: baseTemplate(`
      <h2>Reset Your Password</h2>
      <p>Hi ${user.name}, click below to reset your password. Link expires in 1 hour.</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
    `),
  });
};

const sendOrderConfirmationEmail = async (user, order) => {
  return sendEmail({
    to: user.email,
    subject: `Order Confirmed #${order.order_number} 🎉`,
    html: baseTemplate(`
      <h2>Order Confirmed! 🎉</h2>
      <p>Hi ${user.name}, your order <strong>#${order.order_number}</strong> has been placed.</p>
      <p><strong>Total:</strong> ₹${order.total}</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.id}" class="btn">Track Order</a>
    `),
  });
};

const sendShippingUpdateEmail = async (user, order, tracking) => {
  return sendEmail({
    to: user.email,
    subject: `Order Shipped #${order.order_number} 🚚`,
    html: baseTemplate(`
      <h2>Your Order is on its way! 🚚</h2>
      <p>Hi ${user.name}, order <strong>#${order.order_number}</strong> has been shipped.</p>
      <p><strong>Courier:</strong> ${tracking.courier_name || 'TBD'}</p>
      <p><strong>AWB:</strong> ${tracking.awb_code || 'TBD'}</p>
    `),
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendShippingUpdateEmail,
};
