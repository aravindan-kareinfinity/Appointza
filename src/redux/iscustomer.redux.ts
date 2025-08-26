import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store.redux';

const initialState = {
  isCustomer: false, // Default to false (organization) when user is logged in
  isLoggedIn: false, // Track if user is logged in
};

const isCustomerSlice = createSlice({
  name: 'isCustomer',
  initialState,
  reducers: {
    setIsCustomer: (state, action: PayloadAction<boolean>) => {
      state.isCustomer = action.payload;
    },
    toggleIsCustomer: (state) => {
      state.isCustomer = !state.isCustomer;
    },
    setLoginStatus: (state, action: PayloadAction<boolean>) => {
      state.isLoggedIn = action.payload;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.isCustomer = false;
    },
  },
});

export const iscustomeractions = isCustomerSlice.actions;

export const iscustomerreducer = isCustomerSlice.reducer;

export const selectiscustomer = (state: RootState) => state.iscustomer;
