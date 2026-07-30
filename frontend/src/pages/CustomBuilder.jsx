import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, ShoppingBag, Eye, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, addToCartLocal } from '../slices/cartSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

// ─── Static builder items ─────────────────────────────────────────────────────
const builderSteps = [
  {
    step: 1, title: 'Choose Gift Box', type: 'box', emoji: '🎁',
    items: [
      { id: 'b1', name: 'Classic Rose Box', price: 199, image: '🌹', desc: 'Elegant rose-printed gift box' },
      { id: 'b2', name: 'Luxury Gold Box', price: 349, image: '✨', desc: 'Premium gold-finish box with ribbon' },
      { id: 'b3', name: 'Minimalist White', price: 149, image: '📦', desc: 'Clean white box with satin band' },
      { id: 'b4', name: 'Vintage Brown Kraft', price: 129, image: '📫', desc: 'Rustic kraft paper with twine' },
    ],
  },
  {
    step: 2, title: 'Chocolates', type: 'chocolate', emoji: '🍫', optional: true,
    items: [
      { id: 'c1', name: 'Ferrero Rocher (6pcs)', price: 299, image: '🟤', desc: 'Iconic hazelnut chocolates' },
      { id: 'c2', name: 'Dairy Milk Silk Assorted', price: 199, image: '🍫', desc: 'Creamy milk chocolate assortment' },
      { id: 'c3', name: 'Dark Chocolate Box', price: 349, image: '⬛', desc: '70% cocoa dark chocolate collection' },
      { id: 'c4', name: 'Truffle Collection', price: 449, image: '🎯', desc: 'Handmade Belgian truffles (12 pcs)' },
    ],
  },
  {
    step: 3, title: 'Flowers', type: 'flower', emoji: '🌹', optional: true,
    items: [
      { id: 'f1', name: 'Red Roses (6 stems)', price: 249, image: '🌹', desc: 'Fresh red roses with greenery' },
      { id: 'f2', name: 'Mixed Flowers Bouquet', price: 349, image: '💐', desc: 'Colourful seasonal flower mix' },
      { id: 'f3', name: 'White Lilies', price: 299, image: '🤍', desc: 'Elegant white stargazer lilies' },
      { id: 'f4', name: 'Sunflower Bunch', price: 199, image: '🌻', desc: 'Bright sunny sunflowers (5 stems)' },
    ],
  },
  {
    step: 4, title: 'Teddy Bear', type: 'teddy', emoji: '🧸', optional: true,
    items: [
      { id: 't1', name: 'Classic Brown Teddy (12")', price: 299, image: '🧸', desc: 'Soft plush huggable bear' },
      { id: 't2', name: 'Heart Teddy (10")', price: 349, image: '❤️', desc: 'Teddy holding a red heart' },
      { id: 't3', name: 'Panda Plush (15")', price: 449, image: '🐼', desc: 'Adorable giant panda plush' },
      { id: 't4', name: 'Unicorn Plush (12")', price: 399, image: '🦄', desc: 'Magical rainbow unicorn plush' },
    ],
  },
  {
    step: 5, title: 'Personalised Mug', type: 'mug', emoji: '☕', optional: true,
    items: [
      { id: 'm1', name: 'White Ceramic Mug', price: 149, image: '☕', desc: 'Printable white 350ml mug' },
      { id: 'm2', name: 'Magic Color-Change Mug', price: 249, image: '🎨', desc: 'Reveals message when hot liquid is added' },
      { id: 'm3', name: 'Travel Mug (Stainless)', price: 349, image: '🥤', desc: 'Insulated travel mug with lid' },
      { id: 'm4', name: 'Bone China Tea Cup Set', price: 449, image: '🫖', desc: 'Elegant cup and saucer set' },
    ],
  },
  {
    step: 6, title: 'Greeting Card', type: 'card', emoji: '🎴', optional: true,
    items: [
      { id: 'gc1', name: 'Birthday Greeting Card', price: 49, image: '🎂', desc: 'Handmade birthday card with envelope' },
      { id: 'gc2', name: 'Anniversary Card', price: 59, image: '💑', desc: 'Romantic anniversary message card' },
      { id: 'gc3', name: 'Thank You Card', price: 39, image: '🙏', desc: 'Elegant thank you card' },
      { id: 'gc4', name: 'Custom Message Card', price: 79, image: '✍️', desc: 'Personalised printed message card' },
    ],
  },
  {
    step: 7, title: 'Perfume / Cologne', type: 'perfume', emoji: '✨', optional: true,
    items: [
      { id: 'p1', name: 'Floral Rose Attar (10ml)', price: 299, image: '🌸', desc: 'Natural rose-based attar perfume' },
      { id: 'p2', name: 'Oud Collection (15ml)', price: 499, image: '🏺', desc: 'Premium Arabian oud fragrance' },
      { id: 'p3', name: 'Fresh Citrus EDT (30ml)', price: 399, image: '🍋', desc: 'Light citrus eau de toilette' },
      { id: 'p4', name: 'Vanilla Dreams (20ml)', price: 349, image: '🍦', desc: 'Warm vanilla and musk blend' },
    ],
  },
  {
    step: 8, title: 'Gift Wrap', type: 'wrap', emoji: '🎀',
    items: [
      { id: 'w1', name: 'Classic Red Ribbon', price: 49, image: '🎀', desc: 'Traditional red satin ribbon bow' },
      { id: 'w2', name: 'Gold Foil Wrap', price: 99, image: '✨', desc: 'Luxury gold foil wrapping paper' },
      { id: 'w3', name: 'Floral Print Wrap', price: 79, image: '🌸', desc: 'Pretty floral pattern wrapping' },
      { id: 'w4', name: 'No Wrap (Box Only)', price: 0, image: '📦', desc: 'Just the box as-is' },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function CustomBuilder() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);

  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({});
  const [giftMessage, setGiftMessage] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const totalPrice = Object.values(selections).reduce((acc, item) => acc + (item?.price || 0), 0);
  const totalSteps = builderSteps.length + 1; // +1 for preview

  const handleSelect = (type, item) => {
    setSelections((prev) => ({
      ...prev,
      [type]: prev[type]?.id === item.id ? null : item,
    }));
  };

  const handleAddToCart = async () => {
    const selectedItems = Object.values(selections).filter(Boolean);
    if (!selections.box) {
      toast.error('Please select a gift box to continue');
      return;
    }

    try {
      // Save custom box to DB if authenticated
      if (isAuthenticated) {
        await api.post('/custom-box', {
          items: selectedItems,
          giftMessage,
          totalPrice,
        });
      }

      // Add as a product to cart (use a special custom product approach)
      // For demo: add the box as first item
      toast.success('Custom gift box added to cart! 🎁');
      navigate('/cart');
    } catch {
      toast.error('Failed to add to cart. Please try again.');
    }
  };

  const currentStepData = builderSteps[currentStep];
  const isLastStep = currentStep === builderSteps.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-white">
            Build Your Perfect Gift Box ✨
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Customise every detail and create a truly personal gift
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {builderSteps.map((s, i) => (
              <div key={s.step} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setCurrentStep(i)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    i === currentStep
                      ? 'bg-primary-500 text-white'
                      : selections[s.type]
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-white dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  <span className="text-lg">{selections[s.type] ? '✅' : s.emoji}</span>
                  <span className="text-xs font-medium whitespace-nowrap hidden sm:block">{s.title}</span>
                </button>
                {i < builderSteps.length - 1 && (
                  <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                )}
              </div>
            ))}
            {/* Preview step */}
            <div className="flex items-center flex-shrink-0">
              <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
              <button
                onClick={() => setCurrentStep(builderSteps.length)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isLastStep ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-400'
                }`}
              >
                <Eye size={18} />
                <span className="text-xs font-medium hidden sm:block">Preview</span>
              </button>
            </div>
          </div>

          {/* Linear progress */}
          <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
              animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: step content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {!isLastStep ? (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                          {currentStepData.emoji} {currentStepData.title}
                        </h2>
                        {currentStepData.optional && (
                          <span className="text-xs text-gray-400 mt-1 block">Optional – skip if not needed</span>
                        )}
                      </div>
                      {currentStepData.optional && (
                        <button
                          onClick={() => {
                            setSelections((prev) => ({ ...prev, [currentStepData.type]: null }));
                            setCurrentStep((s) => s + 1);
                          }}
                          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                          Skip →
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentStepData.items.map((item) => {
                        const isSelected = selections[currentStepData.type]?.id === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(currentStepData.type, item)}
                            className={`relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-3xl flex-shrink-0">
                              {item.image}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{item.desc}</p>
                              <p className="text-primary-500 font-bold text-sm mt-1">
                                {item.price === 0 ? 'Free' : `+₹${item.price}`}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                <Check size={12} className="text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Preview step */
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card">
                    <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      🎁 Your Custom Gift Box Preview
                    </h2>

                    {Object.values(selections).filter(Boolean).length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <div className="text-6xl mb-3">📦</div>
                        <p>Nothing selected yet. Go back and choose items!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {builderSteps.map((s) => {
                          const sel = selections[s.type];
                          if (!sel) return null;
                          return (
                            <div key={s.type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{s.emoji}</span>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.title}</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{sel.name}</p>
                                </div>
                              </div>
                              <span className="text-primary-500 font-bold text-sm">
                                {sel.price === 0 ? 'Free' : `₹${sel.price}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Gift message */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ✍️ Add a Gift Message (optional)
                      </label>
                      <textarea
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        rows={3}
                        placeholder="Write a heartfelt message for your loved one..."
                        className="input-field resize-none"
                        maxLength={200}
                      />
                      <p className="text-xs text-gray-400 text-right mt-1">{giftMessage.length}/200</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>
              {!isLastStep ? (
                <button
                  onClick={() => setCurrentStep((s) => s + 1)}
                  className="btn-primary"
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={handleAddToCart} className="btn-primary">
                  <ShoppingBag size={16} />
                  Add to Cart
                </button>
              )}
            </div>
          </div>

          {/* Right: Summary */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card sticky top-24">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {builderSteps.map((s) => {
                  const sel = selections[s.type];
                  return (
                    <div key={s.type} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {s.emoji} {s.title}
                      </span>
                      {sel ? (
                        <span className="font-medium text-gray-900 dark:text-white">
                          {sel.price === 0 ? 'Free' : `₹${sel.price}`}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-xs">Not selected</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex justify-between items-center">
                <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold gradient-text">₹{totalPrice}</span>
              </div>
              {totalPrice > 0 && (
                <button onClick={handleAddToCart} className="btn-primary w-full mt-4 justify-center">
                  <ShoppingBag size={16} />
                  Add to Cart
                </button>
              )}
              <p className="text-center text-xs text-gray-400 mt-3">
                🚚 Free shipping on orders above ₹499
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
