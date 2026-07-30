import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Star, Package, Shield, Truck, Gift, Sparkles, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeaturedProducts } from '../slices/productSlice';
import ProductCard from '../components/products/ProductCard';

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

// ─── Data ─────────────────────────────────────────────────────────────────────
const occasions = [
  { label: 'Birthday', emoji: '🎂', href: '/occasions/birthday', color: 'from-pink-400 to-rose-500' },
  { label: 'Anniversary', emoji: '💍', href: '/occasions/anniversary', color: 'from-purple-400 to-indigo-500' },
  { label: 'Wedding', emoji: '💒', href: '/occasions/wedding', color: 'from-rose-300 to-pink-500' },
  { label: 'Baby Shower', emoji: '🍼', href: '/occasions/baby-shower', color: 'from-sky-400 to-blue-500' },
  { label: 'Corporate', emoji: '🏢', href: '/occasions/corporate', color: 'from-slate-400 to-gray-600' },
  { label: 'Festivals', emoji: '🪔', href: '/occasions/festivals', color: 'from-amber-400 to-orange-500' },
  { label: 'Get Well', emoji: '🌸', href: '/occasions/get-well', color: 'from-emerald-400 to-teal-500' },
  { label: 'Thank You', emoji: '🙏', href: '/occasions/thank-you', color: 'from-violet-400 to-purple-500' },
];

const testimonials = [
  { name: 'Priya Sharma', city: 'Mumbai', rating: 5, text: 'The birthday gift box I ordered was absolutely stunning! My sister was in tears. Will definitely order again.', avatar: 'PS' },
  { name: 'Rahul Mehta', city: 'Delhi', rating: 5, text: 'Best corporate gift hampers I have ever seen. Our clients were extremely impressed. Quality is top-notch!', avatar: 'RM' },
  { name: 'Ananya Gupta', city: 'Bangalore', rating: 5, text: 'The custom builder is so fun to use. I created a personalised box for my husband on our anniversary – he loved it!', avatar: 'AG' },
  { name: 'Vikram Singh', city: 'Pune', rating: 5, text: 'Ordered a midnight surprise delivery for my parents anniversary. Delivery was on time and packaging was beautiful.', avatar: 'VS' },
];

const features = [
  { icon: Package, title: 'Premium Packaging', desc: 'Every gift is packed with luxury eco-friendly materials', color: 'text-primary-500 bg-primary-50' },
  { icon: Truck, title: 'Same Day Delivery', desc: 'Order before 2PM for same day delivery in select cities', color: 'text-purple-500 bg-purple-50' },
  { icon: Shield, title: '100% Secure', desc: 'End-to-end secure payments with Razorpay', color: 'text-gold-500 bg-gold-50' },
  { icon: Gift, title: 'Fully Customizable', desc: 'Build your dream gift box from scratch with our builder', color: 'text-emerald-500 bg-emerald-50' },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const dispatch = useDispatch();
  const { featured, isLoading } = useSelector((s) => s.products);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
  }, [dispatch]);

  return (
    <div className="overflow-hidden">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[92vh] flex items-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary-200/30 to-purple-200/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-gold-200/30 to-primary-200/30 blur-3xl" />
          {/* Floating emojis */}
          {['🎁', '🌸', '✨', '💝', '🎀', '🌹'].map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl md:text-5xl select-none"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [-5, 5, -5],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
              <Sparkles size={14} />
              Premium Gift Experiences
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              Gifts that{' '}
              <span className="gradient-text">speak from</span>
              <br />the heart 💝
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
              Curated luxury gift boxes for every occasion. Choose from hundreds of premium products or build your own custom gift box — delivered with love.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/gift-boxes" className="btn-primary text-base py-4 px-8">
                Shop Gift Boxes
                <ArrowRight size={18} />
              </Link>
              <Link to="/custom-builder" className="btn-outline text-base py-4 px-8">
                <Gift size={18} />
                Build Your Own
              </Link>
            </div>
            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map((s) => <Star key={s} size={14} className="text-gold-400 fill-gold-400" />)}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">4.9/5 from 2,000+ reviews</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">🚀 50,000+ happy customers</div>
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:flex justify-center relative"
          >
            <div className="relative w-[480px] h-[480px]">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 rotate-6" />
              <div className="absolute inset-2 rounded-3xl bg-white dark:bg-gray-800 shadow-2xl flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-8xl mb-4">🎁</div>
                  <p className="font-display text-2xl font-bold text-gray-900 dark:text-white">Premium Gift Box</p>
                  <p className="text-gray-500 mt-2">Starting from ₹499</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {['🍫 Chocolates', '🌹 Flowers', '🧸 Teddy', '☕ Mug', '🎴 Card', '🎀 Wrap'].map((item) => (
                      <div key={item} className="bg-gray-50 dark:bg-gray-700 rounded-xl py-2 px-1 text-xs text-center text-gray-600 dark:text-gray-300">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating cards */}
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-xl shadow-card p-3 text-sm font-medium text-gray-900 dark:text-white"
              >
                🎉 Order confirmed!
              </motion.div>
              <motion.div
                animate={{ y: [8, -8, 8] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-xl shadow-card p-3 text-sm font-medium text-gray-900 dark:text-white"
              >
                🚚 Out for delivery
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <Section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div key={title} variants={fadeInUp} className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── Occasions ─── */}
      <Section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <span className="text-sm font-medium text-primary-500 uppercase tracking-widest">Shop by</span>
            <h2 className="section-title mt-2">Occasions</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              Find the perfect gift for every special moment in life.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {occasions.map(({ label, emoji, href, color }) => (
              <motion.div key={label} variants={fadeInUp}>
                <Link
                  to={href}
                  className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-800 hover:shadow-card-hover transition-all duration-300 text-center"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                    {emoji}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-500 transition-colors">
                    {label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── Featured Products ─── */}
      <Section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="flex items-end justify-between mb-10">
            <div>
              <span className="text-sm font-medium text-primary-500 uppercase tracking-widest">Handpicked</span>
              <h2 className="section-title mt-2">Featured Gifts</h2>
            </div>
            <Link to="/gift-boxes?featured=true" className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors">
              View All <ChevronRight size={16} />
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="shimmer aspect-square" />
                  <div className="p-4 space-y-2">
                    <div className="shimmer h-4 w-3/4 rounded" />
                    <div className="shimmer h-3 w-1/2 rounded" />
                    <div className="shimmer h-5 w-1/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* ─── Custom Builder CTA ─── */}
      <Section className="py-20 bg-gradient-to-r from-primary-500 via-rose-500 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div variants={fadeInUp}>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
                Build your perfect gift box from scratch ✨
              </h2>
              <p className="mt-4 text-white/80 text-lg">
                Choose every item — chocolates, flowers, teddy, mug, greeting card, perfume, and more. Preview it before you buy.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/custom-builder" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg">
                  <Gift size={20} />
                  Start Building
                  <ArrowRight size={18} />
                </Link>
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-3">
              {[
                { emoji: '🎁', label: 'Gift Box' },
                { emoji: '🍫', label: 'Chocolates' },
                { emoji: '🌹', label: 'Flowers' },
                { emoji: '🧸', label: 'Teddy' },
                { emoji: '☕', label: 'Mug' },
                { emoji: '🎴', label: 'Card' },
                { emoji: '✨', label: 'Perfume' },
                { emoji: '🎀', label: 'Gift Wrap' },
                { emoji: '🛒', label: 'Checkout' },
              ].map(({ emoji, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07, type: 'spring' }}
                  className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center"
                >
                  <div className="text-3xl mb-2">{emoji}</div>
                  <p className="text-white text-xs font-medium">{label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ─── Testimonials ─── */}
      <Section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <span className="text-sm font-medium text-primary-500 uppercase tracking-widest">Reviews</span>
            <h2 className="section-title mt-2">What our customers say</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map(({ name, city, rating, text, avatar }, i) => (
              <motion.div key={name} variants={fadeInUp} className="card p-6 dark:bg-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{name}</p>
                    <p className="text-xs text-gray-500">{city}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(rating)].map((_, j) => (
                    <Star key={j} size={12} className="text-gold-400 fill-gold-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">"{text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
