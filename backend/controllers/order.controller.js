/**
 * Order Controller
 * Handles order creation, management, and status updates
 */

const db = require('../config/database');
const { sendOrderConfirmationEmail, sendShippingUpdateEmail } = require('../services/email.service');
const {
  sendOrderConfirmationWA,
  sendShippingUpdateWA,
  sendDeliveryNotificationWA,
} = require('../services/whatsapp.service');
const { createShipment } = require('../services/shiprocket.service');

const generateOrderNumber = () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CC-${dateStr}-${random}`;
};

// ─── Create Order ─────────────────────────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { address_id, delivery_slot_id, gift_message, delivery_date, coupon_code } = req.body;
    const userId = req.user.id;

    const cartItems = await db.query(
      `SELECT c.*, p.name as product_name, p.price, p.sale_price,
        COALESCE(i.quantity, 0) as stock,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as product_image
       FROM cart c JOIN products p ON c.product_id = p.id
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE c.user_id = ? AND c.saved_for_later = FALSE`,
      [userId]
    );

    if (!cartItems.length) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.product_name}". Only ${item.stock} left.`,
        });
      }
    }

    // Fixed: parseFloat every DB-derived DECIMAL value. mysql2 returns
    // DECIMAL columns as JS strings — using "+" directly on them causes
    // string concatenation instead of addition, silently corrupting totals.
    const subtotal = cartItems.reduce((acc, item) => {
      const price = parseFloat(item.sale_price || item.price) || 0;
      return acc + price * item.quantity;
    }, 0);

    let discount = 0;
    let couponId = null;
    if (coupon_code) {
      const [coupon] = await db.query(
        `SELECT * FROM coupons WHERE code = ? AND is_active = TRUE AND valid_from <= NOW() AND valid_until >= NOW()
         AND (usage_limit IS NULL OR used_count < usage_limit)`,
        [coupon_code]
      );

      if (coupon) {
        const minOrderAmount = parseFloat(coupon.min_order_amount) || 0;
        if (subtotal >= minOrderAmount) {
          const [usage] = await db.query(
            'SELECT COUNT(*) as cnt FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
            [coupon.id, userId]
          );
          if (!coupon.per_user_limit || usage.cnt < coupon.per_user_limit) {
            const couponValue = parseFloat(coupon.value) || 0;
            if (coupon.type === 'percentage') {
              discount = (subtotal * couponValue) / 100;
              if (coupon.max_discount) discount = Math.min(discount, parseFloat(coupon.max_discount));
            } else if (coupon.type === 'fixed') {
              discount = couponValue;
            }
            discount = Math.min(discount, subtotal);
            couponId = coupon.id;
          }
        }
      }
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.18 * 100) / 100;
    let shippingCharge = subtotal < 499 ? 49 : 0;

    // Fixed: parseFloat on extra_charge — this was the exact bug source
    let slotCharge = 0;
    if (delivery_slot_id) {
      const [slot] = await db.query('SELECT extra_charge FROM delivery_slots WHERE id = ?', [delivery_slot_id]);
      if (slot) slotCharge = parseFloat(slot.extra_charge) || 0;
    }

    const total = Math.round((taxableAmount + tax + shippingCharge + slotCharge) * 100) / 100;

    // Safety net — never let a bad total slip through to payment
    if (!isFinite(total) || total < 1) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Order total (₹${isFinite(total) ? total : 'invalid'}) is below the ₹1 minimum required for payment.`,
      });
    }

    const orderNumber = generateOrderNumber();

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, order_number, address_id, coupon_id, delivery_slot_id,
        subtotal, discount, tax, shipping_charge, total, gift_message, delivery_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId, orderNumber, address_id, couponId, delivery_slot_id || null,
        subtotal, discount, tax, shippingCharge + slotCharge, total,
        gift_message || null, delivery_date || null,
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      const unitPrice = parseFloat(item.sale_price || item.price) || 0;
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, custom_box_id, product_name, product_image, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.custom_box_id || null, item.product_name, item.product_image, item.quantity, unitPrice, unitPrice * item.quantity]
      );

      await connection.execute(
        'UPDATE inventory SET quantity = quantity - ?, reserved_quantity = reserved_quantity + ? WHERE product_id = ?',
        [item.quantity, item.quantity, item.product_id]
      );
    }

    if (couponId) {
      await connection.execute('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [couponId]);
      await connection.execute(
        'INSERT INTO coupon_usage (coupon_id, user_id, order_id) VALUES (?, ?, ?)',
        [couponId, userId, orderId]
      );
    }

    await connection.execute('DELETE FROM cart WHERE user_id = ? AND saved_for_later = FALSE', [userId]);

    await connection.commit();

    const [order] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const [user] = await db.query('SELECT name, email, phone FROM users WHERE id = ?', [userId]);

    sendOrderConfirmationEmail(user, order).catch(console.error);
    if (user.phone) {
      sendOrderConfirmationWA(user.phone, { ...order, userName: user.name, userEmail: user.email }).catch(console.error);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      orderId,
      orderNumber,
      total,
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// ─── Get User Orders ──────────────────────────────────────────────────────────
exports.getUserOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const limitNum  = Math.max(1, Math.min(50, parseInt(limit) || 10));
    const pageNum   = Math.max(1, parseInt(page) || 1);
    const offsetNum = (pageNum - 1) * limitNum;
    const userId = req.user.id;

    const [countResult] = await db.query('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [userId]);

    const orders = await db.query(
      `SELECT o.*, a.city, a.state, a.pincode,
        (SELECT GROUP_CONCAT(product_name SEPARATOR ', ') FROM order_items WHERE order_id = o.id) as items_summary
       FROM orders o JOIN addresses a ON o.address_id = a.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`,
      [userId]
    );

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        total: countResult.total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(countResult.total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Order Details ────────────────────────────────────────────────────────
exports.getOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [order] = await db.query(
      `SELECT o.*, a.full_name, a.phone as delivery_phone, a.address_line1, a.address_line2,
        a.city, a.state, a.pincode, a.country,
        c.code as coupon_code, c.type as coupon_type, c.value as coupon_value,
        ds.label as slot_label
       FROM orders o
       JOIN addresses a ON o.address_id = a.id
       LEFT JOIN coupons c ON o.coupon_id = c.id
       LEFT JOIN delivery_slots ds ON o.delivery_slot_id = ds.id
       WHERE o.id = ? AND o.user_id = ?`,
      [id, userId]
    );

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    const [payment] = await db.query(
      'SELECT razorpay_payment_id, amount, method, status, created_at FROM payments WHERE order_id = ?',
      [order.id]
    );
    const [shipping] = await db.query('SELECT * FROM shipping WHERE order_id = ?', [order.id]);

    res.status(200).json({ success: true, order: { ...order, items, payment, shipping } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Order Status (Admin) ──────────────────────────────────────────────
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const [order] = await db.query(
      'SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [id]
    );

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    await db.query('UPDATE orders SET status = ?, notes = ? WHERE id = ?', [status, notes || order.notes, id]);

    if (status === 'shipped') {
      const [address] = await db.query('SELECT * FROM addresses WHERE id = ?', [order.address_id]);
      const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
      try {
        const shipmentResponse = await createShipment({ ...order, userEmail: order.user_email }, address, items);
        if (shipmentResponse?.shipment_id) {
          await db.query(
            `INSERT INTO shipping (order_id, shiprocket_order_id, status) VALUES (?, ?, 'created')
             ON DUPLICATE KEY UPDATE shiprocket_order_id = ?, status = 'created'`,
            [id, shipmentResponse.shipment_id, shipmentResponse.shipment_id]
          );
        }
      } catch (shipErr) {
        console.error('Shiprocket error:', shipErr.message);
      }
    }

    if (status === 'delivered' && order.user_phone) {
      sendDeliveryNotificationWA(order.user_phone, { ...order, userName: order.user_name }).catch(console.error);
    }

    await db.query(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [
        order.user_id, 'order_update',
        `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        `Your order #${order.order_number} has been ${status}.`,
        JSON.stringify({ orderId: id, orderNumber: order.order_number, status }),
      ]
    );

    res.status(200).json({ success: true, message: `Order status updated to '${status}'.` });
  } catch (err) {
    next(err);
  }
};

// ─── Cancel Order ─────────────────────────────────────────────────────────────
exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [order] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, userId]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel order in '${order.status}' status.` });
    }

    await db.query('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', id]);

    const items = await db.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      await db.query(
        'UPDATE inventory SET quantity = quantity + ?, reserved_quantity = reserved_quantity - ? WHERE product_id = ?',
        [item.quantity, item.quantity, item.product_id]
      );
    }

    res.status(200).json({ success: true, message: 'Order cancelled successfully.' });
  } catch (err) {
    next(err);
  }
};