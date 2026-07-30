import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import toast from 'react-hot-toast';

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async () => {
  const res = await api.get('/wishlist');
  return res.data.items;
});

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (productId, { getState, rejectWithValue }) => {
  try {
    const { wishlist } = getState();
    const isWishlisted = wishlist.items.some((i) => i.product_id === productId);
    if (isWishlisted) {
      await api.delete(`/wishlist/${productId}`);
      toast.success('Removed from wishlist');
    } else {
      await api.post('/wishlist', { productId });
      toast.success('Added to wishlist ❤️');
    }
    const res = await api.get('/wishlist');
    return res.data.items;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: [], isLoading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => { state.items = action.payload || []; })
      .addCase(toggleWishlist.fulfilled, (state, action) => { state.items = action.payload || []; });
  },
});

export const selectWishlistIds = (state) => state.wishlist.items.map((i) => i.product_id);
export default wishlistSlice.reducer;
