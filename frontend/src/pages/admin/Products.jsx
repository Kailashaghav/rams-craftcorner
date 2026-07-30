import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, X, Upload,
  Package, ChevronDown, Star, AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function ProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    category_id: product?.category_id || '',
    description: product?.description || '',
    short_description: product?.short_description || '',
    price: product?.price || '',
    sale_price: product?.sale_price || '',
    sku: product?.sku || '',
    occasion: product?.occasion || '',
    stock_quantity: product?.stock || 0,
    low_stock_alert: product?.low_stock_alert || 10,
    is_featured: product?.is_featured || false,
    is_customizable: product?.is_customizable || false,
    is_active: product?.is_active !== undefined ? product.is_active : true,
    tags: '',
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [saving, setSaving] = useState(false);

  const occasions = [
    'birthday','anniversary','wedding','baby-shower',
    'corporate','festivals','get-well','thank-you'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category_id || !form.price) {
      toast.error('Name, category and price are required');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => formData.append(key, val));
      images.forEach((img) => formData.append('images', img));

      if (product?.id) {
        await api.put(`/products/${product.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product updated!');
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product added successfully!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {product?.id ? '✏️ Edit Product' : '➕ Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Row 1 - Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Product Name *
            </label>
            <input
              name="name" value={form.name} onChange={handleChange}
              className="input-field" placeholder="e.g. Premium Birthday Gift Box" required
            />
          </div>

          {/* Row 2 - Category + Occasion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Category *
              </label>
              <div className="relative">
                <select
                  name="category_id" value={form.category_id}
                  onChange={handleChange} className="input-field appearance-none pr-8" required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Occasion
              </label>
              <div className="relative">
                <select
                  name="occasion" value={form.occasion}
                  onChange={handleChange} className="input-field appearance-none pr-8"
                >
                  <option value="">Select Occasion</option>
                  {occasions.map((occ) => (
                    <option key={occ} value={occ} className="capitalize">
                      {occ.replace('-', ' ')}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 3 - Price + Sale Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Price (₹) *
              </label>
              <input
                name="price" type="number" value={form.price}
                onChange={handleChange} className="input-field"
                placeholder="999" min="0" step="0.01" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Sale Price (₹) <span className="text-gray-400 font-normal text-xs">optional</span>
              </label>
              <input
                name="sale_price" type="number" value={form.sale_price}
                onChange={handleChange} className="input-field"
                placeholder="799" min="0" step="0.01"
              />
            </div>
          </div>

          {/* Row 4 - Stock + Low Stock Alert */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Stock Quantity
              </label>
              <input
                name="stock_quantity" type="number" value={form.stock_quantity}
                onChange={handleChange} className="input-field" placeholder="50" min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                SKU <span className="text-gray-400 font-normal text-xs">optional</span>
              </label>
              <input
                name="sku" value={form.sku} onChange={handleChange}
                className="input-field" placeholder="CC-BDAY-001"
              />
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Short Description
            </label>
            <input
              name="short_description" value={form.short_description}
              onChange={handleChange} className="input-field"
              placeholder="One line shown on product cards" maxLength={200}
            />
          </div>

          {/* Full Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Full Description
            </label>
            <textarea
              name="description" value={form.description}
              onChange={handleChange} rows={4}
              className="input-field resize-none"
              placeholder="Detailed product description shown on the product page..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Images <span className="text-gray-400 font-normal text-xs">up to 5</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
              <Upload size={22} className="text-gray-400 mb-1.5" />
              <p className="text-sm text-gray-500">Click to upload images</p>
              <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP up to 5MB each</p>
              <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
            </label>
            {previews.length > 0 && (
              <div className="flex gap-3 mt-3 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                    >
                      <X size={10} />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary-500 text-white text-center text-xs py-0.5">
                        Main
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { name: 'is_featured',     label: '⭐ Featured',    desc: 'Show on homepage' },
              { name: 'is_customizable', label: '✨ Customizable', desc: 'Allow in builder' },
              { name: 'is_active',       label: '✅ Active',       desc: 'Visible in store' },
            ].map(({ name, label, desc }) => (
              <label key={name} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary-300 transition-colors">
                <input
                  type="checkbox" name={name} checked={form[name]}
                  onChange={handleChange} className="mt-0.5 w-4 h-4 accent-pink-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-3">
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : product?.id ? 'Update Product' : '+ Add Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      const res = await api.get(`/products?${params}`);
      setProducts(res.data.products || []);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
    } catch {}
  };

  useEffect(() => { fetchProducts(); }, [page, search]);
  useEffect(() => { fetchCategories(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openAdd  = () => { setEditProduct(null); setShowModal(true); };
  const openEdit = (p)  => { setEditProduct(p);    setShowModal(true); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {pagination?.total || 0} products total
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-field pl-10 text-sm"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
              <div className="shimmer aspect-square" />
              <div className="p-4 space-y-2">
                <div className="shimmer h-4 rounded w-3/4" />
                <div className="shimmer h-3 rounded w-1/2" />
                <div className="shimmer h-5 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-2xl">
          <Package size={52} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No products yet</h3>
          <p className="text-gray-500 mb-6">Add your first product to start selling!</p>
          <button onClick={openAdd} className="btn-primary mx-auto">
            <Plus size={16} /> Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-card overflow-hidden group"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gray-50 dark:bg-gray-700 overflow-hidden">
                <img
                  src={product.primary_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=f43f5e&color=fff&size=300`}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.is_featured == 1 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400 text-white font-medium">⭐ Featured</span>
                  )}
                  {product.is_active == 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500 text-white font-medium">Hidden</span>
                  )}
                  {product.stock == 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-medium">Out of Stock</span>
                  )}
                </div>
                {/* Hover actions */}
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                  <button
                    onClick={() => openEdit(product)}
                    className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-primary-500"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-xs text-primary-500 font-medium uppercase tracking-wide mb-1">
                  {product.category_name}
                </p>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 leading-snug">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      ₹{parseFloat(product.sale_price || product.price).toFixed(0)}
                    </span>
                    {product.sale_price && (
                      <span className="text-xs text-gray-400 line-through ml-1.5">
                        ₹{parseFloat(product.price).toFixed(0)}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    product.stock == 0 ? 'text-red-500' :
                    product.stock <= 10 ? 'text-amber-500' : 'text-green-500'
                  }`}>
                    {product.stock == 0 ? 'Out of stock' : `${product.stock} in stock`}
                  </span>
                </div>
                <button
                  onClick={() => openEdit(product)}
                  className="w-full py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all"
                >
                  Edit Product
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          {[...Array(pagination.totalPages)].map((_, i) => (
            <button
              key={i + 1} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                page === i + 1 ? 'bg-primary-500 text-white' : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ProductModal
            product={editProduct}
            categories={categories}
            onClose={() => setShowModal(false)}
            onSave={fetchProducts}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
