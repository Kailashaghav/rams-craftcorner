import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    darkMode: localStorage.getItem('darkMode') === 'true',
    sidebarOpen: false,
    cartOpen: false,
    searchOpen: false,
    chatOpen: false,
  },
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
      document.documentElement.classList.toggle('dark', state.darkMode);
    },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    toggleCart: (state) => { state.cartOpen = !state.cartOpen; },
    closeCart: (state) => { state.cartOpen = false; },
    toggleSearch: (state) => { state.searchOpen = !state.searchOpen; },
    toggleChat: (state) => { state.chatOpen = !state.chatOpen; },
    closeChat: (state) => { state.chatOpen = false; },
  },
});

export const { toggleDarkMode, toggleSidebar, toggleCart, closeCart, toggleSearch, toggleChat, closeChat } = uiSlice.actions;
export default uiSlice.reducer;
