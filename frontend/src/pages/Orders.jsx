import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Calendar, MapPin, ShoppingBag } from 'lucide-react';
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

const STATUS_EMOJI = {
  pending: '⏳', confirmed: '✅', packed: '📦', shipped: '🚚',
  delivered: '🎉', cancelled: '❌', returned: '↩️', refunded: '💸',
};

export default function Orders() {
  const [orders, setOrders]         = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/my-orders?page=${page}&limit=10`);
      setOrders(res.data.orders || []);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">My Orders</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {pagination ? `${pagination.total} order${pagination.total !== 1 ? 's' : ''} placed` : 'Track and manage your orders'}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6">
                <div className="shimmer h-5 w-1/3 rounded mb-3" />
                <div className="shimmer h-4 w-2/3 rounded mb-2" />
                <div className="shimmer h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Your placed orders will show up here.</p>
            <Link to="/gift-boxes" className="btn-primary">
              <ShoppingBag size={16} /> Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/orders/${order.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="font-bold text-primary-500 text-sm">#{order.order_number}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                          {STATUS_EMOJI[order.status]} {order.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                        {order.items_summary || 'Order items'}
                      </p>

                      <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {order.city}, {order.state}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ₹{parseFloat(order.total).toFixed(0)}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Previous
                </button>
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                      page === i + 1 ? 'bg-primary-500 text-white' : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
