/**
 * WhatsApp Business API Service
 * Sends automated WhatsApp messages for order events
 */

const axios = require('axios');

const WA_API_URL = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
const HEADERS = {
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  'Content-Type': 'application/json',
};

const sendWhatsAppMessage = async (to, templateName, components = []) => {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) {
    console.warn('WhatsApp credentials not configured');
    return null;
  }

  try {
    const phone = to.replace(/[^0-9]/g, '').replace(/^0/, '91');

    const res = await axios.post(
      WA_API_URL,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: { name: templateName, language: { code: 'en' }, components },
      },
      { headers: HEADERS }
    );

    return res.data;
  } catch (error) {
    console.error('WhatsApp send error:', error?.response?.data || error.message);
    return null;
  }
};

// Order confirmation WhatsApp
const sendOrderConfirmationWA = async (phone, order) => {
  return sendWhatsAppMessage(phone, 'order_confirmation', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: order.userName },
        { type: 'text', text: order.order_number },
        { type: 'text', text: `₹${order.total}` },
        { type: 'text', text: order.delivery_date || 'TBD' },
      ],
    },
  ]);
};

// Payment confirmation WhatsApp
const sendPaymentConfirmationWA = async (phone, payment) => {
  return sendWhatsAppMessage(phone, 'payment_confirmation', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: payment.userName },
        { type: 'text', text: payment.order_number },
        { type: 'text', text: `₹${payment.amount}` },
        { type: 'text', text: payment.razorpay_payment_id },
      ],
    },
  ]);
};

// Shipping update WhatsApp
const sendShippingUpdateWA = async (phone, shipping) => {
  return sendWhatsAppMessage(phone, 'shipping_update', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: shipping.userName },
        { type: 'text', text: shipping.order_number },
        { type: 'text', text: shipping.awb_code },
        { type: 'text', text: shipping.courier_name },
        { type: 'text', text: shipping.tracking_url || 'Check app' },
      ],
    },
  ]);
};

// Delivery notification WhatsApp
const sendDeliveryNotificationWA = async (phone, order) => {
  return sendWhatsAppMessage(phone, 'order_delivered', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: order.userName },
        { type: 'text', text: order.order_number },
      ],
    },
  ]);
};

module.exports = {
  sendOrderConfirmationWA,
  sendPaymentConfirmationWA,
  sendShippingUpdateWA,
  sendDeliveryNotificationWA,
};
