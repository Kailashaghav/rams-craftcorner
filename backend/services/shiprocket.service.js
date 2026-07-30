/**
 * Shiprocket Integration Service
 * Handles shipment creation, AWB generation, and tracking
 */

const axios = require('axios');

const SHIPROCKET_API = 'https://apiv2.shiprocket.in/v1/external';
let shiprocketToken = null;
let tokenExpiry = null;

// Authenticate with Shiprocket and cache token
const getShiprocketToken = async () => {
  if (shiprocketToken && tokenExpiry && Date.now() < tokenExpiry) {
    return shiprocketToken;
  }

  const res = await axios.post(`${SHIPROCKET_API}/auth/login`, {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  });

  shiprocketToken = res.data.token;
  tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000; // 9 days
  return shiprocketToken;
};

const shiprocketRequest = async (method, endpoint, data = null) => {
  const token = await getShiprocketToken();
  const config = {
    method,
    url: `${SHIPROCKET_API}${endpoint}`,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  };
  if (data) config.data = data;
  const res = await axios(config);
  return res.data;
};

// Create shipment order on Shiprocket
const createShipment = async (order, address, items) => {
  const payload = {
    order_id: order.order_number,
    order_date: new Date(order.created_at).toISOString().split('T')[0],
    pickup_location: 'Primary',
    billing_customer_name: address.full_name,
    billing_last_name: '',
    billing_address: address.address_line1,
    billing_address_2: address.address_line2 || '',
    billing_city: address.city,
    billing_pincode: address.pincode,
    billing_state: address.state,
    billing_country: 'India',
    billing_email: order.userEmail,
    billing_phone: address.phone,
    shipping_is_billing: true,
    order_items: items.map((item) => ({
      name: item.product_name,
      sku: item.product_id.toString(),
      units: item.quantity,
      selling_price: item.unit_price,
    })),
    payment_method: 'Prepaid',
    sub_total: order.subtotal,
    length: 20,
    breadth: 20,
    height: 15,
    weight: 1.5,
  };

  return shiprocketRequest('post', '/orders/create/adhoc', payload);
};

// Generate AWB code for a shipment
const generateAWB = async (shipmentId, courierId) => {
  return shiprocketRequest('post', '/courier/assign/awb', {
    shipment_id: shipmentId,
    courier_id: courierId,
  });
};

// Get shipment tracking details
const trackShipment = async (awbCode) => {
  return shiprocketRequest('get', `/courier/track/awb/${awbCode}`);
};

// Get available couriers for a pincode
const getAvailableCouriers = async (pickupPincode, deliveryPincode, weight = 1) => {
  return shiprocketRequest(
    'get',
    `/courier/serviceability?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=0`
  );
};

module.exports = { createShipment, generateAWB, trackShipment, getAvailableCouriers };
