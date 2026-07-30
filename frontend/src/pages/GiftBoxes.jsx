import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Grid3X3, List } from 'lucide-react';
import { fetchProducts } from '../slices/productSlice';
import ProductCard from '../components/products/ProductCard';

const sortOptions = [
  { value: 'created_at-DESC', label: 'Newest First' },
  { value: 'price-ASC',       label: 'Price: Low to High' },
  { value: 'price-DESC',      label: 'Price: High to Low' },
  { value: 'rating-DESC',     label: 'Top Rated' },
];

const priceRanges = [
  { label: 'Under ₹500',       min: 0,    max: 500  },
  { label: '₹500 – ₹1000',    min: 500,  max: 1000 },
  { label: '₹1000 – ₹2000',   min: 1000, max: 2000 },
  { label: '₹2000 – ₹5000',   min: 2000, max: 5000 },
  { label: 'Above ₹5000',      min: 5000, max: null  },
];

export default function GiftBoxes() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { items: products, pagination, isLoading } = useSelector((s) => s.products);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode]       = useState('grid');
  const [page, setPage]               = useState(1);
  const [filters, setFilters]         = useState({
    search:   searchParams.get('search')   || '',
    sort:     'created_at-DESC',
    minPrice: '',
    maxPrice: '',
    occasion: searchParams.get('occasion') || '',
    featured: searchParams.get('featured') || '',
  });

  const loadProducts = useCallback(() => {
    const [sort, order] = filters.sort.split('-');

    // Only send params that have real values — fixes 500 error
    const params = { page, limit: 12, sort, order };
    if (filters.search)               params.search   = filters.search;
    if (filters.minPrice !== '')      params.minPrice = filters.minPrice;
    if (filters.maxPrice !== '')      params.maxPrice = filters.maxPrice;
    if (filters.occasion !== '')      params.occasion = filters.occasion;
    if (filters.featured === 'true')  params.featured = 'true';

    dispatch(fetchProducts(params));
  }, [dispatch, filters, page]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handlePriceRange = ({ min, max }) => {
    setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max || '' }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', sort: 'created_at-DESC', minPrice: '', maxPrice: '', occasion: '', featured: '' });
    setPage(1);
  };

  const activeFiltersCount = [filters.search, filters.minPrice, filters.occasion, filters.featured]
    .filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
            {filters.occasion
              ? `${filters.occasion.charAt(0).toUpperCase() + filters.occasion.slice(1).replace('-',' ')} Gifts`
              : 'All Gift Boxes'}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {pagination ? `${pagination.total} beautiful gifts found` : 'Discover our curated collection'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                filtersOpen
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-primary-500 text-xs flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors">
                <X size={14} /> Clear all
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                {sortOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* View mode */}
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters */}
          {filtersOpen && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-60 flex-shrink-0 space-y-5"
            >
              {/* Search */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Search</h3>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search gifts..."
                  className="input-field text-sm"
                />
              </div>

              {/* Price ranges */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Price Range</h3>
                <div className="space-y-1.5">
                  {priceRanges.map(({ label, min, max }) => (
                    <button
                      key={label}
                      onClick={() => handlePriceRange({ min, max })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.minPrice == min && (filters.maxPrice == max || (!max && !filters.maxPrice))
                          ? 'bg-primary-50 text-primary-600 font-medium dark:bg-primary-900/30 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occasions */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Occasion</h3>
                <div className="space-y-1.5">
                  {['birthday','anniversary','wedding','baby-shower','corporate','festivals'].map((occ) => (
                    <button
                      key={occ}
                      onClick={() => handleFilterChange('occasion', filters.occasion === occ ? '' : occ)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                        filters.occasion === occ
                          ? 'bg-primary-50 text-primary-600 font-medium dark:bg-primary-900/30 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {occ.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </motion.aside>
          )}

          {/* Products */}
          <div className="flex-1">
            {isLoading ? (
              <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800">
                    <div className="shimmer aspect-square" />
                    <div className="p-4 space-y-2">
                      <div className="shimmer h-4 w-3/4 rounded" />
                      <div className="shimmer h-3 w-1/2 rounded" />
                      <div className="shimmer h-6 w-1/3 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No gifts found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or search query.</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {products.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Previous
                    </button>
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setPage(i + 1)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                          page === i + 1 ? 'bg-primary-500 text-white' : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
