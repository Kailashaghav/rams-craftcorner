import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile } from './slices/authSlice';
import { fetchCart } from './slices/cartSlice';
import { fetchWishlist } from './slices/wishlistSlice';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import LoadingScreen from './components/common/LoadingScreen';
import Chatbot from './components/chatbot/Chatbot';

// ─── Lazy pages ───────────────────────────────────────────────────────────────
const Home           = lazy(() => import('./pages/Home'));
const GiftBoxes      = lazy(() => import('./pages/GiftBoxes'));
const ProductDetail  = lazy(() => import('./pages/ProductDetail'));
const Cart           = lazy(() => import('./pages/Cart'));
const Wishlist       = lazy(() => import('./pages/Wishlist'));
const Checkout       = lazy(() => import('./pages/Checkout'));
const OrderSuccess   = lazy(() => import('./pages/OrderSuccess'));
const OrderTracking  = lazy(() => import('./pages/OrderTracking'));
const Orders         = lazy(() => import('./pages/Orders'));
const CustomBuilder  = lazy(() => import('./pages/CustomBuilder'));
const Login          = lazy(() => import('./pages/auth/Login'));
const Register       = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/auth/ResetPassword'));
const Profile        = lazy(() => import('./pages/Profile'));
const AboutUs        = lazy(() => import('./pages/AboutUs'));
const ContactUs      = lazy(() => import('./pages/ContactUs'));
const PrivacyPolicy  = lazy(() => import('./pages/PrivacyPolicy'));
const Terms          = lazy(() => import('./pages/Terms'));
const FAQ            = lazy(() => import('./pages/FAQ'));
const NotFound       = lazy(() => import('./pages/NotFound'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts  = lazy(() => import('./pages/admin/Products'));
const AdminOrders    = lazy(() => import('./pages/admin/Orders'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers'));
const AdminInventory = lazy(() => import('./pages/admin/Inventory'));
const AdminCoupons   = lazy(() => import('./pages/admin/Coupons'));
const AdminReviews   = lazy(() => import('./pages/admin/Reviews'));
const AdminSettings  = lazy(() => import('./pages/admin/Settings'));
const AdminLogin     = lazy(() => import('./pages/auth/AdminLogin'));

// ─── Route Guards ─────────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <LoadingScreen />;
  if (!isAuthenticated || user?.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((s) => s.ui);
  const { isAuthenticated } = useSelector((s) => s.auth);

  // Init: dark mode + profile + cart + wishlist
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    const token = localStorage.getItem('accessToken');
    if (token) {
      dispatch(fetchProfile());
    }
  }, []);

  // Once authenticated, fetch cart and wishlist
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [isAuthenticated]);

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Admin */}
          <Route path="/admin/login" element={<GuestRoute><AdminLogin /></GuestRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard"  element={<AdminDashboard />} />
            <Route path="products"   element={<AdminProducts />} />
            <Route path="orders"     element={<AdminOrders />} />
            <Route path="customers"  element={<AdminCustomers />} />
            <Route path="inventory"  element={<AdminInventory />} />
            <Route path="coupons"    element={<AdminCoupons />} />
            <Route path="reviews"    element={<AdminReviews />} />
            <Route path="settings"   element={<AdminSettings />} />
          </Route>

          {/* Auth */}
          <Route path="/login"               element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register"            element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password"     element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/reset-password/:token" element={<GuestRoute><ResetPassword /></GuestRoute>} />

          {/* Main */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="gift-boxes"             element={<GiftBoxes />} />
            <Route path="gift-boxes/:slug"       element={<ProductDetail />} />
            <Route path="categories/:slug"       element={<GiftBoxes />} />
            <Route path="occasions/:occasion"    element={<GiftBoxes />} />
            <Route path="cart"                   element={<Cart />} />
            <Route path="wishlist"               element={<PrivateRoute><Wishlist /></PrivateRoute>} />
            <Route path="custom-builder"         element={<CustomBuilder />} />
            <Route path="checkout"               element={<PrivateRoute><Checkout /></PrivateRoute>} />
            <Route path="order-success/:id"      element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />
            <Route path="orders"                 element={<PrivateRoute><Orders /></PrivateRoute>} />
            <Route path="orders/:id"             element={<PrivateRoute><OrderTracking /></PrivateRoute>} />
            <Route path="profile"                element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="about"                  element={<AboutUs />} />
            <Route path="contact"                element={<ContactUs />} />
            <Route path="privacy-policy"         element={<PrivacyPolicy />} />
            <Route path="terms"                  element={<Terms />} />
            <Route path="faq"                    element={<FAQ />} />
            <Route path="*"                      element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>

      {/* Floating AI Chatbot */}
      <Chatbot />
    </>
  );
}
