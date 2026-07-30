import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const res = await api.get(`/products?${queryString}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchFeaturedProducts = createAsyncThunk('products/fetchFeatured', async () => {
  const res = await api.get('/products/featured');
  return res.data.products;
});

export const fetchProduct = createAsyncThunk('products/fetchOne', async (slug, { rejectWithValue }) => {
  try {
    const res = await api.get(`/products/${slug}`);
    return res.data.product;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    featured: [],
    current: null,
    pagination: null,
    isLoading: false,
    error: null,
    recentlyViewed: JSON.parse(localStorage.getItem('recentlyViewed') || '[]'),
  },
  reducers: {
    addToRecentlyViewed: (state, action) => {
      const product = action.payload;
      state.recentlyViewed = [
        product,
        ...state.recentlyViewed.filter((p) => p.id !== product.id),
      ].slice(0, 8);
      localStorage.setItem('recentlyViewed', JSON.stringify(state.recentlyViewed));
    },
    clearCurrentProduct: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => { state.featured = action.payload; })
      .addCase(fetchProduct.pending, (state) => { state.isLoading = true; state.current = null; })
      .addCase(fetchProduct.fulfilled, (state, action) => { state.isLoading = false; state.current = action.payload; })
      .addCase(fetchProduct.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; });
  },
});

export const { addToRecentlyViewed, clearCurrentProduct } = productSlice.actions;
export default productSlice.reducer;
