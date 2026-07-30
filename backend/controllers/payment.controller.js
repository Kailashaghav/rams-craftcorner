/**
 * Payment Controller
 * Full Razorpay integration: create order, verify payment, handle failure, refunds
 *
 * Inventory model:
 *  - Order created (pending):  quantity -= n,  reserved_quantity += n  (stock held)
 *  - Payment succeeds (confirmed): reserved_quantity -= n  (reservation released, sale locked in)
 *  - Payment fails/cancelled: quantity += n,  reserved_quantity -= n  (stock returned to store)
 */

const Razorpay = require('razorpay');
const crypto   = require('crypto');
const db       = require('../config/database');
const { sendOrderConfirmationEmail } = require('../services/email.service');
const { sendPaymentConfirmationWA }  = require('../services/whatsapp.service');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Create Razorpay Order ─────────────────────────────────────────────────────
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env',
      });
    }

    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, req.user.id]
    );

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Order already processed.' });
    }

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount:   Math.round(parseFloat(order.total) * 100), // paise
        currency: 'INR',
        receipt:  order.order_number,
        notes: { order_id: order.id, user_id: req.user.id },
      });
    } catch (rzpErr) {
      const description = rzpErr?.error?.description || rzpErr?.message || 'Unknown Razorpay error';
      const statusCode   = rzpErr?.statusCode || 500;
      console.error('❌ Razorpay order creation failed:', description);
      return res.status(statusCode === 401 ? 500 : statusCode).json({
        success: false,
        message: statusCode === 401
          ? 'Payment gateway authentication failed. Check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in backend/.env'
          : description,
      });
    }

    await db.query(
      `INSERT INTO payments (order_id, user_id, razorpay_order_id, amount, currency, status)
       VALUES (?, ?, ?, ?, 'INR', 'created')
       ON DUPLICATE KEY UPDATE razorpay_order_id = ?, status = 'created'`,
      [orderId, req.user.id, razorpayOrder.id, order.total, razorpayOrder.id]
    );

    res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount:   razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key:      process.env.RAZORPAY_KEY_ID,
      orderNumber: order.order_number,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Verify Payment (Payment SUCCESS → Order CONFIRMED) ───────────────────────
exports.verifyPayment = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await db.query('UPDATE payments SET status = ? WHERE razorpay_order_id = ?', ['failed', razorpay_order_id]);
      await db.query('UPDATE orders SET status = ? WHERE id = ?', ['pending', orderId]);
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

    await connection.beginTransaction();

    // 1. Mark payment captured
    await connection.execute(
      `UPDATE payments SET
        razorpay_payment_id = ?, razorpay_signature = ?, method = ?, status = 'captured'
       WHERE razorpay_order_id = ?`,
      [razorpay_payment_id, razorpay_signature, paymentDetails.method, razorpay_order_id]
    );

    // 2. Mark order confirmed — THIS IS "ORDER PLACED" ✅
    await connection.execute('UPDATE orders SET status = ? WHERE id = ?', ['confirmed', orderId]);

    // 3. Release the reservation hold — sale is now locked in, stock was
    //    already deducted at order creation time, we just clear the "reserved" marker
    const items = await connection.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
    for (const item of items[0]) {
      await connection.execute(
        'UPDATE inventory SET reserved_quantity = GREATEST(0, reserved_quantity - ?) WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();

    // Fetch full order + user for notifications (non-blocking)
    const [order] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const [user]  = await db.query('SELECT name, email, phone FROM users WHERE id = ?', [req.user.id]);

    sendOrderConfirmationEmail(user, order).catch(console.error);
    if (user.phone) {
      sendPaymentConfirmationWA(user.phone, {
        userName: user.name,
        order_number: order.order_number,
        amount: order.total,
        razorpay_payment_id,
      }).catch(console.error);
    }

    await db.query(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [
        req.user.id, 'payment_success', 'Payment Successful',
        `Payment of ₹${order.total} received for order #${order.order_number}. Your order has been placed! 🎉`,
        JSON.stringify({ orderId, orderNumber: order.order_number, paymentId: razorpay_payment_id }),
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Payment verified and order placed successfully!',
      orderId,
      orderNumber: order.order_number,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// ─── Payment Failure / Cancellation (Order CANCELLED + Stock RESTORED) ────────
exports.paymentFailure = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { razorpay_order_id, orderId, error } = req.body;

    // Mark payment as failed
    await db.query('UPDATE payments SET status = ? WHERE razorpay_order_id = ?', ['failed', razorpay_order_id]);

    const [order] = await db.query(
      'SELECT id, status, order_number FROM orders WHERE id = ?',
      [orderId]
    );

    // Fixed: previously the order stayed "pending" forever and stock stayed
    // locked. Now — since payment did NOT go through — release the reserved
    // stock back to the store and cancel the order.
    if (order && order.status === 'pending') {
      await connection.beginTransaction();

      const [items] = await connection.execute(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [orderId]
      );

      for (const item of items) {
        await connection.execute(
          `UPDATE inventory
           SET quantity = quantity + ?,
               reserved_quantity = GREATEST(0, reserved_quantity - ?)
           WHERE product_id = ?`,
          [item.quantity, item.quantity, item.product_id]
        );
      }

      await connection.execute(
        'UPDATE orders SET status = ?, notes = ? WHERE id = ?',
        ['cancelled', 'Payment failed or was cancelled by the customer', orderId]
      );

      await connection.commit();
      console.log(`⚠️  Order #${order.order_number} cancelled — payment failed, stock restored.`);
    }

    console.error(`Payment failed for order ${orderId}:`, error || 'User cancelled payment');

    res.status(200).json({
      success: true,
      message: 'Payment failure recorded. Order cancelled and stock released.',
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// ─── Initiate Refund (Admin) ──────────────────────────────────────────────────
exports.initiateRefund = async (req, res, next) => {
  try {
    const { paymentId, amount, reason } = req.body;

    const [payment] = await db.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.status !== 'captured') {
      return res.status(400).json({ success: false, message: 'Cannot refund this payment.' });
    }

    const refundAmount = amount ? Math.round(amount * 100) : Math.round(parseFloat(payment.amount) * 100);
    const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
      amount: refundAmount,
      notes: { reason: reason || 'Refund requested' },
    });

    await db.query(
      `UPDATE payments SET status = 'refunded', refund_id = ?, refund_amount = ?, refund_reason = ?, refunded_at = NOW()
       WHERE id = ?`,
      [refund.id, amount || payment.amount, reason || null, paymentId]
    );

    await db.query('UPDATE orders SET status = ? WHERE id = ?', ['refunded', payment.order_id]);

    res.status(200).json({ success: true, message: 'Refund initiated successfully.', refundId: refund.id });
  } catch (err) {
    next(err);
  }
};

// ─── Get Payment Status ───────────────────────────────────────────────────────
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const [payment] = await db.query(
      'SELECT razorpay_payment_id, amount, method, status, created_at FROM payments WHERE order_id = ? AND user_id = ?',
      [orderId, req.user.id]
    );
    res.status(200).json({ success: true, payment });
  } catch (err) {
    next(err);
  }
};