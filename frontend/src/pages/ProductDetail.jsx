import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Star, Heart, ShoppingBag, Share2, Truck, Shield, RefreshCw,
  ChevronLeft, ChevronRight, Minus, Plus, Check, MessageSquare
} from 'lucide-react';
import { fetchProduct, addToRecentlyViewed } from '../slices/productSlice';
import { addToCart, addToCartLocal } from '../slices/cartSlice';
import { toggleWishlist } from '../slices/wishlistSlice';
import { selectWishlistIds } from '../slices/wishlistSlice';
import ProductCard from '../components/products/ProductCard';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { current: product, isLoading } = useSelector((s) => s.products);
  const { isAuthenticated } = useSelector((s) => s.auth);
  const wishlistIds = useSelector(selectWishlistIds);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const isWishlisted = product ? wishlistIds.includes(product.id) : false;

  useEffect(() => {
    dispatch(fetchProduct(slug));
    window.scrollTo(0, 0);
  }, [slug, dispatch]);

  useEffect(() => {
    if (product) dispatch(addToRecentlyViewed(product));
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    if (isAuthenticated) {
      dispatch(addToCart({ productId: product.id, quantity }));
    } else {
      dispatch(addToCartLocal({ product, quantity }));
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate(isAuthenticated ? '/checkout' : '/login?redirect=/checkout');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  if (isLoading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="shimmer aspect-square rounded-2xl" />
          <div className="space-y-4">
            <div className="shimmer h-8 w-3/4 rounded-xl" />
            <div className="shimmer h-4 w-1/2 rounded-xl" />
            <div className="shimmer h-6 w-1/3 rounded-xl" />
            <div className="shimmer h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images
    : [{ image_url: '/placeholder-product.jpg', alt_text: product.name }];

  const price = product.sale_price || product.price;
  const discount = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link to="/" className="hover:text-primary-500 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link to="/gift-boxes" className="hover:text-primary-500 transition-colors">Gift Boxes</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 dark:text-white font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* ─── Images ─── */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 mb-4">
              <img
                src={images[activeImage]?.image_url}
                alt={images[activeImage]?.alt_text || product.name}
                className="w-full h-full object-cover"
              />
              {discount && (
                <div className="absolute top-4 left-4 badge bg-primary-500 text-white text-sm px-3 py-1">
                  {discount}% OFF
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      i === activeImage ? 'border-primary-500' : 'border-transparent'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Info ─── */}
          <div>
            {product.category_name && (
              <Link
                to={`/categories/${product.category_slug}`}
                className="text-sm font-medium text-primary-500 uppercase tracking-wider hover:underline"
              >
                {product.category_name}
              </Link>
            )}

            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mt-2 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {product.avg_rating > 0 && (
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      className={s <= Math.round(product.avg_rating) ? 'text-gold-400 fill-gold-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {parseFloat(product.avg_rating).toFixed(1)}
                </span>
                <span className="text-sm text-gray-400">({product.review_count} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-4 mt-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                ₹{parseFloat(price).toFixed(0)}
              </span>
              {product.sale_price && (
                <span className="text-xl text-gray-400 line-through">
                  ₹{parseFloat(product.price).toFixed(0)}
                </span>
              )}
              {discount && (
                <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm px-3 py-1">
                  Save {discount}%
                </span>
              )}
            </div>

            {/* Short description */}
            {product.short_description && (
              <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                {product.short_description}
              </p>
            )}

            {/* Stock status */}
            <div className="mt-4">
              {product.stock > 10 ? (
                <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check size={14} /> In Stock
                </span>
              ) : product.stock > 0 ? (
                <span className="text-amber-600 text-sm font-medium">
                  ⚠️ Only {product.stock} left!
                </span>
              ) : (
                <span className="text-red-500 text-sm font-medium">Out of Stock</span>
              )}
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-semibold text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock || 10, q + 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  Total: <strong className="text-gray-900 dark:text-white">₹{(parseFloat(price) * quantity).toFixed(0)}</strong>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="btn-outline flex-1 py-3.5 justify-center disabled:opacity-50"
              >
                <ShoppingBag size={18} />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="btn-primary flex-1 py-3.5 justify-center disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>

            {/* Secondary actions */}
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => isAuthenticated ? dispatch(toggleWishlist(product.id)) : navigate('/login')}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isWishlisted ? 'text-primary-500' : 'text-gray-500 hover:text-primary-500'
                }`}
              >
                <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>

            {/* Trust features */}
            <div className="mt-6 grid grid-cols-3 gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
              {[
                { icon: Truck, label: 'Free Delivery', sub: 'Above ₹499' },
                { icon: Shield, label: 'Secure Payment', sub: 'Razorpay' },
                { icon: RefreshCw, label: 'Easy Returns', sub: '7 days' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1">
                  <Icon size={20} className="text-primary-500" />
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">{label}</span>
                  <span className="text-xs text-gray-400">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Tabs: Description / Reviews ─── */}
        <div className="mt-16">
          <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700">
            {['description', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab === 'reviews' ? `Reviews (${product.review_count || 0})` : 'Description'}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === 'description' ? (
              <div
                className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.description || '<p>No description available.</p>' }}
              />
            ) : (
              <div>
                {product.reviews?.length > 0 ? (
                  <div className="space-y-6">
                    {product.reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 pb-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {review.user_name?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="font-semibold text-gray-900 dark:text-white">{review.user_name}</p>
                              <span className="text-xs text-gray-400">
                                {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex gap-0.5 mt-1">
                              {[1,2,3,4,5].map((s) => (
                                <Star key={s} size={13} className={s <= review.rating ? 'text-gold-400 fill-gold-400' : 'text-gray-200'} />
                              ))}
                            </div>
                            {review.title && <p className="font-medium text-gray-900 dark:text-white mt-2">{review.title}</p>}
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{review.comment}</p>
                            {review.is_verified && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-2">
                                <Check size={11} /> Verified Purchase
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
                    <p>No reviews yet. Be the first to review this product!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Related Products ─── */}
        {product.related?.length > 0 && (
          <div className="mt-12 pt-12 border-t border-gray-100 dark:border-gray-800">
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-8">You may also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {product.related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
