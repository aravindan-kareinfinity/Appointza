import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {RootState} from './store.redux';
import {UsersContext} from '../models/users.model';

const initialState = {
  value: new UsersContext(),
};
const usercontextslice = createSlice({
  name: 'usercontext',
  initialState,
  reducers: {
    clear: state => {
      state.value = new UsersContext();
    },
    set: (state, action: PayloadAction<UsersContext>) => {
      state.value = action.payload;
    },
  },
});

export const usercontextactions = usercontextslice.actions;
export const usercontextreducers = usercontextslice.reducer;
export const selectusercontext = (state: RootState) => state.usercontext;
