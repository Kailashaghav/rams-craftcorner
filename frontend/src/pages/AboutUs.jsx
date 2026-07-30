import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Star, Package, Smile, ArrowRight, CheckCircle } from 'lucide-react';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

const values = [
  { icon: Heart, title: 'Made with Love', desc: 'Every single gift is handcrafted personally with care and attention to the finest details.', color: 'bg-rose-100 text-rose-500' },
  { icon: Star, title: 'Quality First', desc: 'We use only premium materials to ensure your gift looks and feels truly special.', color: 'bg-amber-100 text-amber-500' },
  { icon: Package, title: 'Unique & Personal', desc: 'No two gifts are the same — each one is made uniquely for the person receiving it.', color: 'bg-purple-100 text-purple-500' },
  { icon: Smile, title: 'Your Satisfaction', desc: 'Your happiness is our priority. We pour our heart into every order, big or small.', color: 'bg-emerald-100 text-emerald-500' },
];

const milestones = [
  { year: '2024', label: 'Founded', desc: 'Started with a passion for handmade gifts' },
  { year: '100+', label: 'Orders', desc: 'Happy customers across India' },
  { year: '50+', label: 'Products', desc: 'Unique handcrafted gift options' },
  { year: '4.9★', label: 'Rating', desc: 'Average customer satisfaction score' },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-hidden">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary-200/30 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-purple-200/30 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
              <Heart size={14} fill="currentColor" /> Our Story
            </motion.div>
            <motion.h1 variants={fadeInUp} className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              Crafted with{' '}
              <span className="gradient-text">passion,</span>
              <br />delivered with love 💝
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              A first-year B.Tech student with a big dream — to make every celebration unforgettable through the art of handmade gifting.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Founder Section ── */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Photos */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              {/* Main photo */}
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/founder-1.jpeg"
                  alt="Founder of rams craftcorner"
                  className="w-full h-[500px] object-cover object-top"
                />
                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      🎁
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Founder & Creator</p>
                      <p className="text-white/80 text-xs">B.Tech Student · Handmade Gift Artist</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second photo — floating card */}
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-8 -right-8 w-48 h-64 rounded-2xl overflow-hidden shadow-xl border-4 border-white dark:border-gray-800 z-20"
              >
                <img
                  src="/founder-2.jpeg"
                  alt="Founder working"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Decorative ring */}
              <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full border-4 border-dashed border-primary-300 dark:border-primary-700 opacity-50" />
            </motion.div>

            {/* Story text */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:pl-8"
            >
              <span className="text-sm font-medium text-primary-500 uppercase tracking-widest">Meet the Founder</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-3 leading-tight">
                Hi, I'm the heart behind rams craftcorner 👋
              </h2>

              <div className="mt-6 space-y-5 text-gray-600 dark:text-gray-400 leading-relaxed">
                <p className="text-lg">
                  I'm a <strong className="text-gray-900 dark:text-white">first-year B.Tech student</strong> and the proud founder of rams craftcorner. What started as a passion for creating meaningful, one-of-a-kind gifts has grown into something I truly love.
                </p>
                <p>
                  I started this journey because I believe gifts should tell a story. Every product you see here is <strong className="text-gray-900 dark:text-white">handmade by me personally</strong> — with care, creativity, and genuine attention to quality.
                </p>
                <p>
                  Your trust means everything to me. Whether it's a birthday, anniversary, or just a way to say "I care" — I put my whole heart into every single order to make sure it feels truly special for the person receiving it.
                </p>
                <p className="text-primary-600 dark:text-primary-400 font-medium">
                  Thank you for supporting my dream. I can't wait to create something beautiful just for you! 💝
                </p>
              </div>

              {/* Checklist */}
              <div className="mt-8 space-y-3">
                {[
                  'Every gift handmade personally with love',
                  'Premium quality materials only',
                  'Custom orders warmly welcomed',
                  'Your satisfaction is my top priority',
                ].map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-primary-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{point}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/gift-boxes" className="btn-primary">
                  Shop Our Collection <ArrowRight size={16} />
                </Link>
                <Link to="/contact" className="btn-outline">
                  Get in Touch
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Milestones ── */}
      <section className="py-16 bg-gradient-to-r from-primary-500 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {milestones.map(({ year, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="font-display text-4xl font-bold text-white">{year}</p>
                <p className="text-white font-semibold mt-1">{label}</p>
                <p className="text-white/70 text-sm mt-1">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.span variants={fadeInUp} className="text-sm font-medium text-primary-500 uppercase tracking-widest">
              What we stand for
            </motion.span>
            <motion.h2 variants={fadeInUp} className="section-title mt-2">
              Our Values
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {values.map(({ icon: Icon, title, desc, color }) => (
              <motion.div
                key={title}
                variants={fadeInUp}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-center group"
              >
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className="text-6xl mb-6">🎁</motion.div>
            <motion.h2 variants={fadeInUp} className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Let me create something special for you
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-gray-500 dark:text-gray-400 text-lg">
              Every order gets my full attention and care. Let's make your loved one feel truly special.
            </motion.p>
            <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/gift-boxes" className="btn-primary text-base py-4 px-8">
                Browse All Gifts <ArrowRight size={18} />
              </Link>
              <Link to="/custom-builder" className="btn-outline text-base py-4 px-8">
                Build Custom Gift ✨
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
