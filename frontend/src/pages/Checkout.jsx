import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, MessageSquare, Tag, CreditCard,
  ChevronRight, Plus, Check, ShoppingBag
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { selectCartItems, selectCartSubtotal, fetchCart } from '../slices/cartSlice';
import { clearCart } from '../slices/cartSlice';

const steps = ['Address', 'Delivery', 'Payment'];

const deliverySlots = [
  { id: 1, label: 'Morning (8AM – 12PM)',              extra: 0,   icon: '🌅' },
  { id: 2, label: 'Afternoon (12PM – 4PM)',            extra: 0,   icon: '☀️'  },
  { id: 3, label: 'Evening (4PM – 8PM)',               extra: 50,  icon: '🌆' },
  { id: 4, label: 'Midnight Surprise (10PM – 12AM)',   extra: 199, icon: '🌙' },
];

export default function Checkout() {
  const navigate   = useDispatch();
  const dispatch   = useDispatch();
  const nav        = useNavigate();
  const { user }   = useSelector((s) => s.auth);
  const cartItems  = useSelector(selectCartItems);
  const subtotal   = useSelector(selectCartSubtotal);

  const [currentStep,    setCurrentStep]    = useState(0);
  const [addresses,      setAddresses]      = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addingAddress,  setAddingAddress]  = useState(false);
  const [selectedSlot,   setSelectedSlot]   = useState(deliverySlots[0]);
  const [couponCode,     setCouponCode]     = useState('');
  const [coupon,         setCoupon]         = useState(null);
  const [giftMessage,    setGiftMessage]    = useState('');
  const [deliveryDate,   setDeliveryDate]   = useState('');
  const [loading,        setLoading]        = useState(false);
  const [cartSynced,     setCartSynced]     = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // ── On mount: sync cart to backend, then load addresses ──────────────────
  useEffect(() => {
    const init = async () => {
      // 1. Make sure backend cart is in sync
      await syncCartToBackend();
      // 2. Load saved addresses
      await fetchAddresses();
    };
    init();
  }, []);

  // Redirect if cart is empty after sync
  useEffect(() => {
    if (cartSynced && cartItems.length === 0) {
      toast.error('Your cart is empty');
      nav('/gift-boxes');
    }
  }, [cartSynced, cartItems]);

  // ── Sync local Redux cart → backend ──────────────────────────────────────
  const syncCartToBackend = async () => {
    try {
      // First check what's already in backend cart
      const res = await api.get('/cart');
      const backendItems = res.data.items || [];

      // If backend cart is empty but Redux has items, push them up
      if (backendItems.length === 0 && cartItems.length > 0) {
        for (const item of cartItems) {
          try {
            await api.post('/cart', {
              productId: item.product_id,
              quantity:  item.quantity,
            });
          } catch (e) {
            console.warn('Could not sync item:', item.product_name, e.message);
          }
        }
        // Refresh Redux cart from backend
        dispatch(fetchCart());
      }
    } catch (e) {
      console.warn('Cart sync error:', e.message);
    } finally {
      setCartSynced(true);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      const list = res.data.addresses || [];
      setAddresses(list);
      const def = list.find((a) => a.is_default) || list[0];
      if (def) setSelectedAddress(def);
    } catch (e) {
      console.warn('Address fetch error:', e.message);
    }
  };

  const onAddAddress = async (data) => {
    try {
      await api.post('/addresses', data);
      toast.success('Address saved!');
      setAddingAddress(false);
      reset();
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await api.post('/cart/apply-coupon', { code: couponCode.toUpperCase() });
      setCoupon(res.data.coupon);
      toast.success('Coupon applied! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    }
  };

  // ── Price calculations ─────────────────────────────────────────────────────
  const discount = coupon
    ? coupon.type === 'percentage'
      ? Math.min((subtotal * coupon.value) / 100, coupon.max_discount || Infinity)
      : coupon.value
    : 0;
  const taxableAmount = subtotal - discount;
  const tax           = Math.round(taxableAmount * 0.18 * 100) / 100;
  const shipping      = subtotal >= 499 ? 0 : 49;
  const slotCharge    = selectedSlot?.extra || 0;
  const total         = Math.round((taxableAmount + tax + shipping + slotCharge) * 100) / 100;

  // ── Place Order + Open Razorpay ───────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      setCurrentStep(0);
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      nav('/gift-boxes');
      return;
    }

    setLoading(true);
    try {
      // 1. Ensure cart synced to backend
      await syncCartToBackend();

      // 2. Create order
      const orderRes = await api.post('/orders', {
        address_id:       selectedAddress.id,
        delivery_slot_id: selectedSlot?.id,
        gift_message:     giftMessage || null,
        delivery_date:    deliveryDate || null,
        coupon_code:      coupon?.code || null,
      });

      const { orderId, orderNumber, total: orderTotal } = orderRes.data;

      // 3. Create Razorpay payment order
      const paymentRes = await api.post('/payments/create-order', { orderId });
      const { razorpayOrderId, key } = paymentRes.data;

      // 4. Open Razorpay checkout
      const options = {
        key,
        amount:   Math.round(orderTotal * 100),
        currency: 'INR',
        name:     'Craft Corner',
        description: `Order #${orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name:    user?.name    || '',
          email:   user?.email   || '',
          contact: user?.phone   || '',
        },
        theme:  { color: '#f43f5e' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderId,
            });
            dispatch(clearCart());
            toast.success('Payment successful! 🎉');
            nav(`/order-success/${orderId}`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: async () => {
            try {
              await api.post('/payments/failure', {
                razorpay_order_id: razorpayOrderId,
                orderId,
              });
            } catch {}
            toast.error('Payment cancelled.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order';
      toast.error(msg);
      console.error('Order error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!cartSynced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎁</div>
          <p className="text-gray-500">Preparing your checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <button
                onClick={() => i < currentStep && setCurrentStep(i)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i < currentStep  ? 'bg-green-500 text-white cursor-pointer' :
                  i === currentStep ? 'bg-primary-500 text-white' :
                  'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}
              >
                {i < currentStep ? <Check size={14} /> : i + 1}
              </button>
              <span className={`text-sm font-medium hidden sm:block ${i === currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                {step}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Main ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Step 0: Address */}
            {currentStep === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card">
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <MapPin size={18} className="text-primary-500" /> Delivery Address
                </h2>

                {addresses.map((addr) => (
                  <button key={addr.id} onClick={() => setSelectedAddress(addr)}
                    className={`w-full text-left p-4 rounded-xl border-2 mb-3 transition-colors ${
                      selectedAddress?.id === addr.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">{addr.full_name}</span>
                          <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs">{addr.label}</span>
                          {addr.is_default == 1 && <span className="badge bg-primary-100 text-primary-600 text-xs">Default</span>}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} – {addr.pincode}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">📞 {addr.phone}</p>
                      </div>
                      {selectedAddress?.id === addr.id && (
                        <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 mt-1">
                          <Check size={11} className="text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}

                {!addingAddress ? (
                  <button onClick={() => setAddingAddress(true)}
                    className="flex items-center gap-2 text-sm text-primary-500 font-medium hover:text-primary-600 mt-2">
                    <Plus size={16} /> Add New Address
                  </button>
                ) : (
                  <form onSubmit={handleSubmit(onAddAddress)} className="mt-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                        <input {...register('full_name', { required: true })} className="input-field text-sm" placeholder="Recipient's name" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
                        <input {...register('phone', { required: true })} className="input-field text-sm" placeholder="10-digit mobile" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Address Line 1 *</label>
                      <input {...register('address_line1', { required: true })} className="input-field text-sm" placeholder="Flat/House, Street" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Address Line 2</label>
                      <input {...register('address_line2')} className="input-field text-sm" placeholder="Area, Landmark (optional)" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label>
                        <input {...register('city', { required: true })} className="input-field text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">State *</label>
                        <input {...register('state', { required: true })} className="input-field text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode *</label>
                        <input {...register('pincode', { required: true })} className="input-field text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="btn-primary text-sm py-2">Save Address</button>
                      <button type="button" onClick={() => setAddingAddress(false)} className="btn-ghost text-sm">Cancel</button>
                    </div>
                  </form>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => selectedAddress ? setCurrentStep(1) : toast.error('Please select an address')}
                    className="btn-primary"
                  >
                    Continue to Delivery <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 1: Delivery */}
            {currentStep === 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card space-y-6">
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock size={18} className="text-primary-500" /> Delivery Options
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Delivery Date
                  </label>
                  <input type="date" value={deliveryDate}
                    min={minDate.toISOString().split('T')[0]}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Time Slot</label>
                  <div className="space-y-3">
                    {deliverySlots.map((slot) => (
                      <button key={slot.id} onClick={() => setSelectedSlot(slot)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                          selectedSlot?.id === slot.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{slot.icon}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{slot.label}</span>
                        </div>
                        <span className="text-sm font-bold text-primary-500">
                          {slot.extra === 0 ? 'Free' : `+₹${slot.extra}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <MessageSquare size={14} /> Gift Message (optional)
                  </label>
                  <textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)}
                    rows={3} maxLength={200} placeholder="Add a heartfelt message..."
                    className="input-field resize-none"
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{giftMessage.length}/200</p>
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setCurrentStep(0)} className="btn-ghost">← Back</button>
                  <button onClick={() => setCurrentStep(2)} className="btn-primary">
                    Continue to Payment <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card space-y-6">
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard size={18} className="text-primary-500" /> Payment
                </h2>

                {/* Coupon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Tag size={14} /> Coupon Code
                  </label>
                  {coupon ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <Check size={16} className="text-green-500" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        {coupon.code} — ₹{discount.toFixed(0)} saved!
                      </span>
                      <button onClick={() => { setCoupon(null); setCouponCode(''); }}
                        className="ml-auto text-xs text-gray-400 hover:text-red-500">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code (e.g. FIRST15)"
                        className="input-field flex-1 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                      />
                      <button onClick={applyCoupon} className="btn-outline text-sm px-5">Apply</button>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Try: FIRST15 or FLAT100</p>
                </div>

                {/* Payment info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Accepted Payment Methods</p>
                  <div className="flex flex-wrap gap-2">
                    {['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'EMI'].map((m) => (
                      <span key={m} className="text-xs px-3 py-1 bg-white dark:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500">
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">🔒 Secured by Razorpay</p>
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setCurrentStep(1)} className="btn-ghost">← Back</button>
                  <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary py-3 px-8">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : `Pay ₹${total.toFixed(0)}`}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Order Summary ── */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card sticky top-24">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ShoppingBag size={16} className="text-primary-500" /> Order Summary
              </h3>

              <div className="space-y-3 mb-4 max-h-56 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.product_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product_name)}&background=f43f5e&color=fff&size=80`}
                      alt={item.product_name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1">{item.product_name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white flex-shrink-0">
                      ₹{(parseFloat(item.unit_price || item.price || 0) * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span><span>–₹{discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax (18% GST)</span><span>₹{tax.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-500">Free</span> : `₹${shipping}`}</span>
                </div>
                {slotCharge > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Slot Charge</span><span>₹{slotCharge}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                  <span>Total</span>
                  <span className="gradient-text text-lg">₹{total.toFixed(0)}</span>
                </div>
              </div>

              {selectedAddress && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-xs">
                  <p className="font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Delivering to</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedAddress.full_name}</p>
                  <p className="text-gray-500 dark:text-gray-400">{selectedAddress.city}, {selectedAddress.state} – {selectedAddress.pincode}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
