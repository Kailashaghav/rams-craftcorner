import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, MapPin, ArrowRight } from 'lucide-react';
import api from '../services/api';
import confetti from 'canvas-confetti';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    // Fire confetti
    const fire = () => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#f43f5e', '#a855f7', '#f59e0b'] });
    };
    setTimeout(fire, 300);
    setTimeout(fire, 800);

    // Fetch order
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.order);
      } catch {}
    };
    fetchOrder();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center py-12">
      <div className="max-w-lg w-full mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle size={48} className="text-green-500" />
          </motion.div>

          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Order Placed! 🎉
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Your gift is on its way to making someone happy!
          </p>

          {order && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 mb-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Order Number</span>
                <span className="font-bold text-primary-500">#{order.order_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Amount</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{parseFloat(order.total).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 capitalize">{order.status}</span>
              </div>
              {order.delivery_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Expected Delivery</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(order.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Order journey */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[
              { icon: CheckCircle, label: 'Confirmed', done: true },
              { icon: Package, label: 'Packing', done: false },
              { icon: Truck, label: 'Shipped', done: false },
              { icon: MapPin, label: 'Delivered', done: false },
            ].map(({ icon: Icon, label, done }, i, arr) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`flex flex-col items-center gap-1 ${done ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`}>
                  <Icon size={20} />
                  <span className="text-xs">{label}</span>
                </div>
                {i < arr.length - 1 && <div className="w-6 h-px bg-gray-200 dark:bg-gray-600 mt-0 mb-4" />}
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            📧 Confirmation sent to your email<br />
            📱 WhatsApp notification sent
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={`/orders/${id}`} className="btn-outline flex-1 justify-center">
              Track Order
            </Link>
            <Link to="/gift-boxes" className="btn-primary flex-1 justify-center">
              Continue Shopping <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
