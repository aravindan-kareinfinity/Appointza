import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Theme } from '../models/theme.model';

export type ThemeType = 'light';

export class DefaultColor {
  private constructor() {}

  private static _instance: DefaultColor | null = null;

  public static get instance(): DefaultColor {
    if (DefaultColor._instance == null) {
      DefaultColor._instance = new DefaultColor();
      DefaultColor._instance.initializeColors();
    }
    return DefaultColor._instance!;
  }

  public switchTheme(theme: ThemeType): void {
    this.currentTheme = theme;
    this.getTheme();
  }

  private currentTheme: ThemeType = 'light';

  public getTheme(): ThemeType {
    return this.currentTheme;
  }

  public getCurrentThemeType(): ThemeType {
    return this.currentTheme;
  }

  public getAvailableThemes(): ThemeType[] {
    return Object.keys(this.themes) as ThemeType[];
  }

  private themes: Record<ThemeType, Theme> = {
    light: {
      // Background colors
      background: '#f9fafb',
      cardBackground: '#ffffff',
    
      // Button colors
      primary: '#FF6A00',           // Updated from indigo to logo orange
      secondary: '#009CFF',         // Updated from orange to logo blue
    
      // Text colors
      text: '#1f2937',
      placeholder: '#9ca3af',
    
      // Border colors
      border: '#e5e7eb',
    
      // Legacy colors (mapped to new ones)
      tint_1: '#FF6A00',
      tint_2: '#009CFF',
      tint_3: '#1f2937',
      tint_4: '#9ca3af',
      tint_5: '#e5e7eb',
      tint_6: '#f9fafb',
      tint_7: '#ffffff',
      tint_8: '#FF6A00',
      tint_9: '#009CFF',
      tint_10: '#1f2937',
      tint_11: '#ffffff',
      tint_ash: '#9ca3af',
    
      // Alerts
      danger: '#ef4444',
      success: '#22c55e',
      warn: '#f59e0b',
    
      // Primary sets
      primary1: '#f9fafb',
      primary2: '#FF6A00',
      primary3: '#009CFF',
      primary4: '#ffffff',
      primary5: '#1f2937',
    }
    
  };

  get colors(): Theme {
    return this.themes[this.currentTheme];
  }

  // New color accessors
  get background(): string {
    return this.colors.background;
  }

  get cardBackground(): string {
    return this.colors.cardBackground;
  }

  get primary(): string {
    return this.colors.primary;
  }

  get secondary(): string {
    return this.colors.secondary;
  }

  get text(): string {
    return this.colors.text;
  }

  get placeholder(): string {
    return this.colors.placeholder;
  }

  get border(): string {
    return this.colors.border;
  }

  // Legacy color accessors (keeping for backward compatibility)
  get tint__1(): string {
    return this.colors.tint_1;
  }

  get tint__2(): string {
    return this.colors.tint_2;
  }

  get tint__3(): string {
    return this.colors.tint_3;
  }

  get tint__4(): string {
    return this.colors.tint_4;
  }

  get tint__5(): string {
    return this.colors.tint_5;
  }

  get tint__6(): string {
    return this.colors.tint_6;
  }

  get tint__7(): string {
    return this.colors.tint_7;
  }

  get tint__8(): string {
    return this.colors.tint_8;
  }

  get tint__9(): string {
    return this.colors.tint_9;
  }

  get tint__10(): string {
    return this.colors.tint_10;
  }

  get tint__11(): string {
    return this.colors.tint_11;
  }

  get tint__ash(): string {
    return this.colors.tint_ash;
  }

  get danger_(): string {
    return this.colors.danger;
  }

  get success_(): string {
    return this.colors.success;
  }

  get warn_(): string {
    return this.colors.warn;
  }

  get primary__1(): string {
    return this.colors.primary1;
  }

  get primary__2(): string {
    return this.colors.primary2;
  }

  get primary__5(): string {
    return this.colors.primary5;
  }

  // Color variables
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
  danger: string = '';
  success: string = '';
  warn: string = '';
  tint_primary_5: string = '';
  tint_ash: string = '';
  primary2: string = '';

  private initializeColors() {
    // Direct access to theme colors to avoid getter issues
    const themeColors = this.themes[this.currentTheme];
    
    this.tint_1 = themeColors.tint_1;
    this.tint_2 = themeColors.tint_2;
    this.tint_3 = themeColors.tint_3;
    this.tint_4 = themeColors.tint_4;
    this.tint_5 = themeColors.tint_5;
    this.tint_6 = themeColors.tint_6;
    this.tint_7 = themeColors.tint_7;
    this.tint_8 = themeColors.tint_8;
    this.tint_9 = themeColors.tint_9;
    this.tint_10 = themeColors.tint_10;
    this.tint_11 = themeColors.tint_11;
    this.danger = themeColors.danger;
    this.success = themeColors.success;
    this.warn = themeColors.warn;
    this.tint_primary_5 = themeColors.primary5;
    this.tint_ash = themeColors.tint_ash;
    this.primary2 = themeColors.primary2;

    // Initialize text styles
    this.text_tint_1 = { color: themeColors.tint_1 };
    this.text_tint_2 = { color: themeColors.tint_2 };
    this.text_tint_3 = { color: themeColors.tint_3 };
    this.text_tint_4 = { color: themeColors.tint_4 };
    this.text_tint_5 = { color: themeColors.tint_5 };
    this.text_tint_6 = { color: themeColors.tint_6 };
    this.text_tint_7 = { color: themeColors.tint_7 };
    this.text_tint_8 = { color: themeColors.tint_8 };
    this.text_tint_9 = { color: themeColors.tint_9 };
    this.text_tint_10 = { color: themeColors.tint_10 };
    this.text_tint_11 = { color: themeColors.tint_11 };
    this.text_tint_ash = { color: themeColors.tint_ash };
    this.text_primary1 = { color: themeColors.primary1 };
    this.text_primary2 = { color: themeColors.primary2 };
    this.text_primary5 = { color: themeColors.primary5 };
    this.text_danger = { color: themeColors.danger };
    this.text_success = { color: themeColors.success };
    this.text_warn = { color: themeColors.warn };

    // Initialize background styles
    this.bg_tint_1 = { backgroundColor: themeColors.tint_1 };
    this.bg_tint_2 = { backgroundColor: themeColors.tint_2 };
    this.bg_tint_3 = { backgroundColor: themeColors.tint_3 };
    this.bg_tint_4 = { backgroundColor: themeColors.tint_4 };
    this.bg_tint_5 = { backgroundColor: themeColors.tint_5 };
    this.bg_tint_6 = { backgroundColor: themeColors.tint_6 };
    this.bg_tint_7 = { backgroundColor: themeColors.tint_7 };
    this.bg_tint_8 = { backgroundColor: themeColors.tint_8 };
    this.bg_tint_9 = { backgroundColor: themeColors.tint_9 };
    this.bg_tint_10 = { backgroundColor: themeColors.tint_10 };
    this.bg_tint_11 = { backgroundColor: themeColors.tint_11 };
    this.bg_danger = { backgroundColor: themeColors.danger };
    this.bg_success = { backgroundColor: themeColors.success };
    this.bg_warn = { backgroundColor: themeColors.warn };
    this.bg_primary1 = { backgroundColor: themeColors.primary1 };
    this.bg_primary2 = { backgroundColor: themeColors.primary2 };
    this.bg_primary5 = { backgroundColor: themeColors.primary5 };

    // Initialize border styles
    this.border_tint_1 = { borderColor: themeColors.tint_1 };
    this.border_tint_2 = { borderColor: themeColors.tint_2 };
    this.border_tint_3 = { borderColor: themeColors.tint_3 };
    this.border_tint_4 = { borderColor: themeColors.tint_4 };
    this.border_tint_5 = { borderColor: themeColors.tint_5 };
    this.border_tint_6 = { borderColor: themeColors.tint_6 };
    this.border_tint_7 = { borderColor: themeColors.tint_7 };
    this.border_tint_8 = { borderColor: themeColors.tint_8 };
    this.border_tint_9 = { borderColor: themeColors.tint_9 };
    this.border_tint_10 = { borderColor: themeColors.tint_10 };
    this.border_tint_11 = { borderColor: themeColors.tint_11 };
    this.border_danger = { borderColor: themeColors.danger };
    this.border_success = { borderColor: themeColors.success };
    this.border_warn = { borderColor: themeColors.warn };
    this.border_primary1 = { borderColor: themeColors.primary1 };
    this.border_primary2 = { borderColor: themeColors.primary2 };
    this.border_primary5 = { borderColor: themeColors.primary5 };
  }

  /* Text Styles */
  text_tint_1!: StyleProp<TextStyle>;
  text_tint_2!: StyleProp<TextStyle>;
  text_tint_3!: StyleProp<TextStyle>;
  text_tint_4!: StyleProp<TextStyle>;
  text_tint_5!: StyleProp<TextStyle>;
  text_tint_6!: StyleProp<TextStyle>;
  text_tint_7!: StyleProp<TextStyle>;
  text_tint_8!: StyleProp<TextStyle>;
  text_tint_9!: StyleProp<TextStyle>;
  text_tint_10!: StyleProp<TextStyle>;
  text_tint_11!: StyleProp<TextStyle>;
  text_tint_ash!: StyleProp<TextStyle>;
  text_primary1!: StyleProp<TextStyle>;
  text_primary2!: StyleProp<TextStyle>;
  text_primary5!: StyleProp<TextStyle>;
  text_danger!: StyleProp<TextStyle>;
  text_success!: StyleProp<TextStyle>;
  text_warn!: StyleProp<TextStyle>;

  /* Background Styles */
  bg_tint_1!: StyleProp<ViewStyle>;
  bg_tint_2!: StyleProp<ViewStyle>;
  bg_tint_3!: StyleProp<ViewStyle>;
  bg_tint_4!: StyleProp<ViewStyle>;
  bg_tint_5!: StyleProp<ViewStyle>;
  bg_tint_6!: StyleProp<ViewStyle>;
  bg_tint_7!: StyleProp<ViewStyle>;
  bg_tint_8!: StyleProp<ViewStyle>;
  bg_tint_9!: StyleProp<ViewStyle>;
  bg_tint_10!: StyleProp<ViewStyle>;
  bg_tint_11!: StyleProp<ViewStyle>;
  bg_danger!: StyleProp<ViewStyle>;
  bg_success!: StyleProp<ViewStyle>;
  bg_warn!: StyleProp<ViewStyle>;
  bg_primary1!: StyleProp<ViewStyle>;
  bg_primary2!: StyleProp<ViewStyle>;
  bg_primary5!: StyleProp<ViewStyle>;

  /* Border Styles */
  border_tint_1!: StyleProp<ViewStyle>;
  border_tint_2!: StyleProp<ViewStyle>;
  border_tint_3!: StyleProp<ViewStyle>;
  border_tint_4!: StyleProp<ViewStyle>;
  border_tint_5!: StyleProp<ViewStyle>;
  border_tint_6!: StyleProp<ViewStyle>;
  border_tint_7!: StyleProp<ViewStyle>;
  border_tint_8!: StyleProp<ViewStyle>;
  border_tint_9!: StyleProp<ViewStyle>;
  border_tint_10!: StyleProp<ViewStyle>;
  border_tint_11!: StyleProp<ViewStyle>;
  border_danger!: StyleProp<ViewStyle>;
  border_success!: StyleProp<ViewStyle>;
  border_warn!: StyleProp<ViewStyle>;
  border_primary1!: StyleProp<ViewStyle>;
  border_primary2!: StyleProp<ViewStyle>;
  border_primary5!: StyleProp<ViewStyle>;
}
