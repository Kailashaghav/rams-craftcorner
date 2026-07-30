import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, Users, Package, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  packed: '#8b5cf6',
  shipped: '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  returned: '#f97316',
  refunded: '#6b7280',
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} />
      </div>
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, revenueRes, productsRes, statusRes, ordersRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/revenue-chart'),
          api.get('/analytics/top-products?limit=5'),
          api.get('/analytics/order-status'),
          api.get('/analytics/recent-orders'),
        ]);
        setStats(statsRes.data.stats);
        setRevenueData(revenueRes.data.data);
        setTopProducts(productsRes.data.products);
        setOrderStatus(statusRes.data.data);
        setRecentOrders(ordersRes.data.orders);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="shimmer h-64 rounded-2xl" />
          <div className="shimmer h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Welcome back! Here's what's happening.</p>
        </div>
        <span className="text-sm text-gray-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={`₹${(stats?.revenue?.total / 1000).toFixed(1)}K`}
          sub={`₹${(stats?.revenue?.thisMonth / 1000).toFixed(1)}K this month`}
          color="bg-primary-100 dark:bg-primary-900/30 text-primary-500"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={stats?.orders?.total?.toLocaleString()}
          sub={`${stats?.orders?.pending} pending`}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-500"
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={stats?.customers?.total?.toLocaleString()}
          sub={`+${stats?.customers?.newThisMonth} this month`}
          color="bg-purple-100 dark:bg-purple-900/30 text-purple-500"
        />
        <StatCard
          icon={Package}
          label="Products"
          value={stats?.products?.total}
          sub={`${stats?.products?.lowStock} low stock · ${stats?.products?.outOfStock} out of stock`}
          color="bg-gold-100 dark:bg-gold-900/30 text-gold-500"
        />
      </div>

      {/* ─── Low stock alert ─── */}
      {stats?.products?.outOfStock > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>{stats.products.outOfStock} products</strong> are out of stock and{' '}
            <strong>{stats.products.lowStock}</strong> are running low.
            <Link to="/admin/inventory" className="ml-2 underline font-medium">Manage Inventory →</Link>
          </p>
        </div>
      )}

      {/* ─── Charts Row ─── */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">Revenue (Last 12 Months)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']}
                labelFormatter={(l) => `Month: ${l}`}
              />
              <Line type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4, fill: '#f43f5e' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order status donut */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Order Status</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={orderStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                {orderStatus.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {orderStatus.slice(0, 4).map((s) => (
              <div key={s.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.status] || '#9ca3af' }} />
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{s.status}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Top Products + Recent Orders ─── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Products</h3>
            <Link to="/admin/products" className="text-xs text-primary-500 hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                <img src={p.image || '/placeholder-product.jpg'} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.total_sold} sold</p>
                </div>
                <span className="text-sm font-bold text-primary-500 flex-shrink-0">₹{parseFloat(p.total_revenue).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-primary-500 hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {order.customer_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{order.customer_name}</p>
                  <p className="text-xs text-gray-400">#{order.order_number}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">₹{parseFloat(order.total).toFixed(0)}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                    style={{
                      background: `${STATUS_COLORS[order.status]}20`,
                      color: STATUS_COLORS[order.status],
                    }}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
