import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star, Eye } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist } from '../../slices/wishlistSlice';
import { addToCart, addToCartLocal } from '../../slices/cartSlice';
import { selectWishlistIds } from '../../slices/wishlistSlice';
import { useMemo } from 'react';

export default function ProductCard({ product, index = 0 }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { isAuthenticated } = useSelector((s) => s.auth);

  // Fixed: memoized selector to prevent unnecessary re-renders
  const wishlistIds  = useSelector((s) => s.wishlist.items.map((i) => i.product_id));
  const isWishlisted = useMemo(() => wishlistIds.includes(product.id), [wishlistIds, product.id]);

  const price    = product.sale_price || product.price;
  const discount = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      dispatch(addToCart({ productId: product.id, quantity: 1 }));
    } else {
      dispatch(addToCartLocal({ product, quantity: 1 }));
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(toggleWishlist(product.id));
  };

  const handleViewProduct = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/gift-boxes/${product.slug}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="product-card group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
    >
      {/* Wrap only image + info, NOT buttons, in the Link */}
      <Link to={`/gift-boxes/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative overflow-hidden aspect-square bg-gray-50 dark:bg-gray-700">
          <img
            src={product.primary_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=f43f5e&color=fff&size=400`}
            alt={product.name}
            className="product-image w-full h-full object-cover"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount && (
              <span className="badge bg-primary-500 text-white text-xs px-2 py-0.5 font-medium">
                {discount}% OFF
              </span>
            )}
            {product.stock == 0 && (
              <span className="badge bg-gray-500 text-white text-xs px-2 py-0.5">Out of Stock</span>
            )}
            {product.is_customizable == 1 && (
              <span className="badge bg-purple-500 text-white text-xs px-2 py-0.5">Custom</span>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>

        {/* Info */}
        <div className="p-4 pb-2">
          {product.category_name && (
            <span className="text-xs font-medium text-primary-500 uppercase tracking-wider">
              {product.category_name}
            </span>
          )}
          <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-500 transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          {product.avg_rating > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star size={12} className="text-gold-400 fill-gold-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {parseFloat(product.avg_rating).toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">({product.review_count})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              ₹{parseFloat(price).toFixed(0)}
            </span>
            {product.sale_price && (
              <span className="text-sm text-gray-400 line-through">
                ₹{parseFloat(product.price).toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action buttons — OUTSIDE the Link to avoid <a> nesting */}
      <div className="px-4 pb-4 pt-2 flex items-center gap-2">
        <button
          onClick={handleAddToCart}
          disabled={product.stock == 0}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingBag size={13} />
          {product.stock == 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>

        <button
          onClick={handleWishlist}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
            isWishlisted
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-primary-400 hover:text-primary-500'
          }`}
        >
          <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={handleViewProduct}
          className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:border-primary-400 hover:text-primary-500 flex items-center justify-center transition-all"
        >
          <Eye size={14} />
        </button>
      </div>
    </motion.div>
  );
}
