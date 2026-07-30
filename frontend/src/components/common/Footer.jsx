import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Instagram, Facebook, Twitter, Youtube, MapPin, Phone, Mail, Send } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      await api.post('/contact/newsletter', { email });
      toast.success('Subscribed! Welcome to Craft Corner 🎉');
      setEmail('');
    } catch {
      toast.error('Already subscribed or invalid email');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-2xl font-bold text-white">Get exclusive offers!</h3>
              <p className="text-white/80 mt-1">Subscribe for gift ideas, deals, and early access.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-3 w-full md:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 md:w-72 px-4 py-3 rounded-full bg-white/20 backdrop-blur text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                required
              />
              <button
                type="submit"
                disabled={subscribing}
                className="px-6 py-3 bg-white text-primary-600 font-semibold rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2 flex-shrink-0"
              >
                <Send size={16} />
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎁</span>
              <span className="font-display font-bold text-xl text-white">Craft Corner</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Curated gift boxes crafted with love for every occasion. Making every moment memorable since 2023.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: 'https://www.instagram.com/ramya_naiduu17?igsh=MXIwZHgwZTYwc2E0', label: 'Instagram' },
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Youtube, href: '#', label: 'YouTube' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-primary-500 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/gift-boxes', label: 'Gift Boxes' },
                { to: '/custom-builder', label: 'Custom Builder' },
                { to: '/occasions/birthday', label: 'Birthday Gifts' },
                { to: '/occasions/anniversary', label: 'Anniversary' },
                { to: '/occasions/corporate', label: 'Corporate Gifts' },
                { to: '/about', label: 'About Us' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/faq', label: 'FAQs' },
                { to: '/contact', label: 'Contact Us' },
                { to: '/orders', label: 'Track Order' },
                { to: '/privacy-policy', label: 'Privacy Policy' },
                { to: '/terms', label: 'Terms & Conditions' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-primary-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">Craft Corner ,Brindavan Gardens , Guntur, Andhra Pradesh 522006</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-primary-400 flex-shrink-0" />
                <a href="tel:+917276910833" className="text-sm text-gray-400 hover:text-primary-400 transition-colors">
                  +91 72769 10833
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-primary-400 flex-shrink-0" />
                <a href="mailto:ramyapasyavula@gmail.com" className="text-sm text-gray-400 hover:text-primary-400 transition-colors">
                  ramyapasyavula@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Craft Corner. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* Payment logos */}
            {['Visa', 'Mastercard', 'UPI', 'Razorpay'].map((p) => (
              <span key={p} className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-500">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
