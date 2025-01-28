import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store.redux';
import { ThemeType } from '../styles/default-color.style'; // Import the ThemeType definition

interface ThemeState {
  value: ThemeType; // Stores the current theme as a ThemeType
}

const initialState: ThemeState = {
  value: 'light', // Default theme
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // Switch theme action
    switchTheme: (state, action: PayloadAction<ThemeType>) => {
      state.value = action.payload; // Update the theme with the payload
    },
  },
});

// Export actions
export const themeActions = themeSlice.actions;

// Export reducer
export const themeReducer = themeSlice.reducer;

// Selector to get the current theme
export const selectTheme = (state: RootState): ThemeType => state.theme.value;
