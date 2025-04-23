import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store.redux';

const initialState = {
  isCustomer: true, // or false, depending on your default
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
  },
});

export const iscustomeractions = isCustomerSlice.actions;

export const iscustomerreducer = isCustomerSlice.reducer;

export const selectiscustomer = (state: RootState) => state.iscustomer;
