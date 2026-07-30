import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { closeCart } from '../../slices/uiSlice';
import {
  updateCartItem,
  removeFromCart,
  selectCartItems,
  selectCartSubtotal,
} from '../../slices/cartSlice';

export default function CartDrawer() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { cartOpen } = useSelector((s) => s.ui);
  const items      = useSelector(selectCartItems);
  const subtotal   = useSelector(selectCartSubtotal);
  const { isAuthenticated } = useSelector((s) => s.auth);

  const handleCheckout = () => {
    dispatch(closeCart());
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  const handleUpdateQty = (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      dispatch(removeFromCart(item.id));
    } else {
      dispatch(updateCartItem({ cartItemId: item.id, quantity: newQty }));
    }
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeCart())}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-primary-500" size={20} />
                <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
                  Your Cart ({items.length})
                </h2>
              </div>
              <button
                onClick={() => dispatch(closeCart())}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Your cart is empty
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    Add some beautiful gifts to get started!
                  </p>
                  <Link
                    to="/gift-boxes"
                    onClick={() => dispatch(closeCart())}
                    className="btn-primary"
                  >
                    Explore Gifts
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3"
                  >
                    <img
                      src={
                        item.product_image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product_name)}&background=f43f5e&color=fff&size=80`
                      }
                      alt={item.product_name}
                      className="w-18 h-18 rounded-lg object-cover flex-shrink-0"
                      style={{ width: 72, height: 72 }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {item.product_name}
                      </p>
                      <p className="text-primary-500 font-bold mt-1 text-sm">
                        ₹{parseFloat(item.unit_price || item.sale_price || item.price || 0).toFixed(0)}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity */}
                        <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() => handleUpdateQty(item, -1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary-500"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item, 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary-500"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <button
                          onClick={() => dispatch(removeFromCart(item.id))}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Subtotal</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    ₹{subtotal.toFixed(0)}
                  </span>
                </div>
                {subtotal < 499 && (
                  <p className="text-xs text-center text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg py-2 px-3">
                    Add ₹{(499 - subtotal).toFixed(0)} more for free shipping 🚚
                  </p>
                )}
                <button onClick={handleCheckout} className="btn-primary w-full justify-center py-3.5">
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </button>
                <Link
                  to="/cart"
                  onClick={() => dispatch(closeCart())}
                  className="block text-center text-sm text-gray-500 hover:text-primary-500 transition-colors"
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
