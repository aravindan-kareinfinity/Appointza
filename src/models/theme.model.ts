export enum ThemeType {
    dark = 'dark',
    light = 'light',
    blue = 'blue',
  }
  
export class Theme {
  // Background colors
  background: string = '#f9fafb';        // Light gray background
  cardBackground: string = '#ffffff';    // White card background

  // Button colors
  primary: string = '#6366f1';           // Indigo (used for Change Status)
  secondary: string = '#f97316';         // Orange (used for Manage Payment)

  // Text colors
  text: string = '#1f2937';              // Dark text
  placeholder: string = '#9ca3af';       // Gray placeholder text

  // Border colors
  border: string = '#e5e7eb';            // Light gray border

  // Legacy colors (keeping for backward compatibility)
  tint_1: string = '';
  tint_2: string = '';
  tint_3: string = '';
  tint_4: string = '';
  tint_5: string = '';
  tint_6: string = '';
  tint_7: string = '';
  tint_8: string = '';
  tint_9: string = '';
  tint_10: string = '';
  tint_11: string = '';
  tint_ash: string = '';
  danger: string = '';
  success: string = '';
  warn: string = '';
  primary1: string = '';
  primary2: string = '';
  primary3: string = '';
  primary4: string = '';
  primary5: string = '';
}
