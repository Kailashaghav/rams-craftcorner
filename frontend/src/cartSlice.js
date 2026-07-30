import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../services/api';
import toast from 'react-hot-toast';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/cart');
    return res.data.items || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const addToCart = createAsyncThunk('cart/add', async ({ productId, quantity = 1 }, { rejectWithValue }) => {
  try {
    const res = await api.post('/cart', { productId, quantity });
    toast.success('Added to cart! 🎁');
    return res.data.items || [];
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to add to cart');
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ cartItemId, quantity }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/cart/${cartItemId}`, { quantity });
    return res.data.items || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (cartItemId, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/cart/${cartItemId}`);
    toast.success('Removed from cart');
    return res.data.items || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items:     [],
    coupon:    null,
    isLoading: false,
    error:     null,
  },
  reducers: {
    clearCart: (state) => {
      state.items  = [];
      state.coupon = null;
    },
    removeCoupon: (state) => {
      state.coupon = null;
    },
    // Guest cart — add without API call
    addToCartLocal: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((i) => i.product_id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({
          id:            Date.now(),
          product_id:    product.id,
          product_name:  product.name,
          product_image: product.primary_image,
          price:         product.sale_price || product.price,
          unit_price:    product.sale_price || product.price,
          sale_price:    product.sale_price,
          quantity,
          stock:         product.stock || 99,
        });
      }
      toast.success('Added to cart! 🎁');
    },
    setCoupon: (state, action) => {
      state.coupon = action.payload;
    },
  },
  extraReducers: (builder) => {
    const setItems = (state, action) => {
      state.items     = action.payload || [];
      state.isLoading = false;
    };
    builder
      .addCase(fetchCart.pending,      (state) => { state.isLoading = true; })
      .addCase(fetchCart.fulfilled,    setItems)
      .addCase(fetchCart.rejected,     (state) => { state.isLoading = false; })
      .addCase(addToCart.pending,      (state) => { state.isLoading = true; })
      .addCase(addToCart.fulfilled,    setItems)
      .addCase(addToCart.rejected,     (state) => { state.isLoading = false; })
      .addCase(updateCartItem.fulfilled, setItems)
      .addCase(removeFromCart.fulfilled, setItems);
  },
});

// ─── Memoized Selectors ───────────────────────────────────────────────────────

export const selectCartItems = createSelector(
  (state) => state.cart.items,
  (items) => items
);

export const selectCartCount = createSelector(
  (state) => state.cart.items,
  (items) => items.reduce((acc, i) => acc + i.quantity, 0)
);

export const selectCartSubtotal = createSelector(
  (state) => state.cart.items,
  (items) => items.reduce((acc, i) => {
    const price = parseFloat(i.unit_price || i.sale_price || i.price || 0);
    return acc + price * i.quantity;
  }, 0)
);

export const { clearCart, removeCoupon, addToCartLocal, setCoupon } = cartSlice.actions;
export default cartSlice.reducer;
