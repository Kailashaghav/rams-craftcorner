import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package, Truck, MapPin, CheckCircle, Clock, XCircle,
  ChevronLeft, Phone, CreditCard, Gift, Copy
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  packed:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  shipped:   'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  returned:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  refunded:  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

// Order journey steps in sequence
const JOURNEY_STEPS = [
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'packed',    label: 'Packed',    icon: Package },
  { key: 'shipped',   label: 'Shipped',   icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
];

const getStepIndex = (status) => {
  if (['cancelled', 'returned', 'refunded'].includes(status)) return -1;
  return JOURNEY_STEPS.findIndex((s) => s.key === status);
};

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.order);
    } catch (err) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.post(`/orders/${id}/cancel`);
      toast.success('Order cancelled successfully');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const copyTrackingId = () => {
    if (order?.shipping?.awb_code) {
      navigator.clipboard.writeText(order.shipping.awb_code);
      toast.success('AWB code copied!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          <div className="shimmer h-8 w-1/3 rounded" />
          <div className="shimmer h-40 rounded-2xl" />
          <div className="shimmer h-60 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Order not found</h2>
          <Link to="/orders" className="btn-primary">View All Orders</Link>
        </div>
      </div>
    );
  }

  const stepIndex   = getStepIndex(order.status);
  const isCancelled = ['cancelled', 'returned', 'refunded'].includes(order.status);
  const canCancel   = ['pending', 'confirmed'].includes(order.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors">
          <ChevronLeft size={16} /> Back to My Orders
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
              Order #{order.order_number}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <span className={`text-sm px-4 py-2 rounded-full font-semibold capitalize ${STATUS_STYLES[order.status]}`}>
            {order.status}
          </span>
        </div>

        {/* Journey tracker */}
        {!isCancelled ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card mb-6">
            <div className="flex items-center justify-between relative">
              {JOURNEY_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isDone   = i <= stepIndex;
                const isActive = i === stepIndex;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: isActive ? 1.15 : 1 }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                        isDone ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      }`}
                    >
                      <Icon size={20} />
                    </motion.div>
                    <span className={`text-xs font-medium text-center ${isDone ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                    {i < JOURNEY_STEPS.length - 1 && (
                      <div
                        className={`absolute top-6 left-1/2 w-full h-0.5 -z-10 ${
                          i < stepIndex ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        style={{ transform: 'translateX(50%)' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Shipping info if shipped */}
            {order.shipping?.awb_code && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-gray-400">Tracking / AWB Number</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.shipping.awb_code}</p>
                  {order.shipping.courier_name && (
                    <p className="text-xs text-gray-500 mt-0.5">via {order.shipping.courier_name}</p>
                  )}
                </div>
                <button onClick={copyTrackingId} className="btn-outline text-xs py-2 px-4">
                  <Copy size={13} /> Copy
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-6 flex items-center gap-4">
            <XCircle size={32} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400 capitalize">Order {order.status}</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                {order.notes || 'This order was cancelled.'}
              </p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <img
                  src={item.product_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product_name)}&background=f43f5e&color=fff&size=80`}
                  alt={item.product_name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} × ₹{parseFloat(item.unit_price).toFixed(0)}</p>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white flex-shrink-0">
                  ₹{parseFloat(item.total_price).toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Subtotal</span><span>₹{parseFloat(order.subtotal).toFixed(0)}</span>
            </div>
            {parseFloat(order.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                <span>−₹{parseFloat(order.discount).toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Tax (GST)</span><span>₹{parseFloat(order.tax).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Shipping</span>
              <span>{parseFloat(order.shipping_charge) === 0 ? 'Free' : `₹${parseFloat(order.shipping_charge).toFixed(0)}`}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base pt-2 border-t border-gray-100 dark:border-gray-700">
              <span>Total</span>
              <span className="gradient-text text-lg">₹{parseFloat(order.total).toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Delivery + Payment info */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Address */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <MapPin size={15} className="text-primary-500" /> Delivery Address
            </h3>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{order.full_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              {order.address_line1}{order.address_line2 ? `, ${order.address_line2}` : ''}<br />
              {order.city}, {order.state} – {order.pincode}
            </p>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Phone size={11} /> {order.delivery_phone}
            </p>
            {order.slot_label && (
              <p className="text-xs text-gray-400 mt-1">🕐 {order.slot_label}</p>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <CreditCard size={15} className="text-primary-500" /> Payment Details
            </h3>
            {order.payment ? (
              <>
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-medium capitalize">{order.payment.method || 'Online'}</span> payment
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Status: <span className="capitalize font-medium text-green-600">{order.payment.status}</span>
                </p>
                {order.payment.razorpay_payment_id && (
                  <p className="text-xs text-gray-400 mt-1 break-all">
                    ID: {order.payment.razorpay_payment_id}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">Payment pending</p>
            )}
          </div>
        </div>

        {/* Gift message */}
        {order.gift_message && (
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-5 mb-6 flex items-start gap-3">
            <Gift size={18} className="text-primary-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">Gift Message</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{order.gift_message}"</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {canCancel && (
            <button onClick={handleCancelOrder} className="btn-outline flex-1 justify-center text-red-500 border-red-200 hover:bg-red-50">
              Cancel Order
            </button>
          )}
          <Link to="/contact" className="btn-ghost flex-1 justify-center">
            Need Help?
          </Link>
        </div>
      </div>
    </div>
  );
}
