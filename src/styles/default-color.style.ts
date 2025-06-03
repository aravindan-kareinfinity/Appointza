import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Theme } from '../models/theme.model';

export type ThemeType = 'light';

export class DefaultColor {
  private constructor() {}

  private static _instance: DefaultColor | null = null;

  public static get instance(): DefaultColor {
    if (DefaultColor._instance == null) {
      this._instance = new DefaultColor();
    }
    return this._instance!;
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
  tint_1: string = this.colors.tint_1;
  tint_2: string = this.colors.tint_2;
  tint_3: string = this.colors.tint_3;
  tint_4: string = this.colors.tint_4;
  tint_5: string = this.colors.tint_5;
  tint_6: string = this.colors.tint_6;
  tint_7: string = this.colors.tint_7;
  tint_8: string = this.colors.tint_8;
  tint_9: string = this.colors.tint_9;
  tint_10: string = this.colors.tint_10;
  tint_11: string = this.colors.tint_11;
  danger: string = this.colors.danger;
  success: string = this.colors.success;
  warn: string = this.colors.warn;
  tint_primary_5: string = this.colors.primary5;
  tint_ash: string = this.colors.tint_ash;
  primary2: string = this.colors.primary2;

  /* Text Styles */
  text_tint_1: StyleProp<TextStyle> = { color: this.tint__1 };
  text_tint_2: StyleProp<TextStyle> = { color: this.tint__2 };
  text_tint_3: StyleProp<TextStyle> = { color: this.tint__3 };
  text_tint_4: StyleProp<TextStyle> = { color: this.tint__4 };
  text_tint_5: StyleProp<TextStyle> = { color: this.tint__5 };
  text_tint_6: StyleProp<TextStyle> = { color: this.tint__6 };
  text_tint_7: StyleProp<TextStyle> = { color: this.tint__7 };
  text_tint_8: StyleProp<TextStyle> = { color: this.tint__8 };
  text_tint_9: StyleProp<TextStyle> = { color: this.tint__9 };
  text_tint_10: StyleProp<TextStyle> = { color: this.tint__10 };
  text_tint_11: StyleProp<TextStyle> = { color: this.tint__11 };
  text_tint_ash: StyleProp<TextStyle> = { color: this.tint__ash };
  text_primary1: StyleProp<TextStyle> = { color: this.primary__1 };
  text_primary2: StyleProp<TextStyle> = { color: this.primary__2 };
  text_primary5: StyleProp<TextStyle> = { color: this.primary__5 };
  text_danger: StyleProp<TextStyle> = { color: this.danger_ };
  text_success: StyleProp<TextStyle> = { color: this.success_ };
  text_warn: StyleProp<TextStyle> = { color: this.warn_ };

  /* Background Styles */
  bg_tint_1: StyleProp<ViewStyle> = { backgroundColor: this.tint__1 };
  bg_tint_2: StyleProp<ViewStyle> = { backgroundColor: this.tint__2 };
  bg_tint_3: StyleProp<ViewStyle> = { backgroundColor: this.tint__3 };
  bg_tint_4: StyleProp<ViewStyle> = { backgroundColor: this.tint__4 };
  bg_tint_5: StyleProp<ViewStyle> = { backgroundColor: this.tint__5 };
  bg_tint_6: StyleProp<ViewStyle> = { backgroundColor: this.tint__6 };
  bg_tint_7: StyleProp<ViewStyle> = { backgroundColor: this.tint__7 };
  bg_tint_8: StyleProp<ViewStyle> = { backgroundColor: this.tint__8 };
  bg_tint_9: StyleProp<ViewStyle> = { backgroundColor: this.tint__9 };
  bg_tint_10: StyleProp<ViewStyle> = { backgroundColor: this.tint__10 };
  bg_tint_11: StyleProp<ViewStyle> = { backgroundColor: this.tint__11 };
  bg_danger: StyleProp<ViewStyle> = { backgroundColor: this.danger_ };
  bg_success: StyleProp<ViewStyle> = { backgroundColor: this.success_ };
  bg_warn: StyleProp<ViewStyle> = { backgroundColor: this.warn_ };
  bg_primary1: StyleProp<ViewStyle> = { backgroundColor: this.primary__1 };
  bg_primary2: StyleProp<ViewStyle> = { backgroundColor: this.primary__2 };
  bg_primary5: StyleProp<ViewStyle> = { backgroundColor: this.primary__5 };

  /* Border Styles */
  border_tint_1: StyleProp<ViewStyle> = { borderColor: this.tint__1 };
  border_tint_2: StyleProp<ViewStyle> = { borderColor: this.tint__2 };
  border_tint_3: StyleProp<ViewStyle> = { borderColor: this.tint__3 };
  border_tint_4: StyleProp<ViewStyle> = { borderColor: this.tint__4 };
  border_tint_5: StyleProp<ViewStyle> = { borderColor: this.tint__5 };
  border_tint_6: StyleProp<ViewStyle> = { borderColor: this.tint__6 };
  border_tint_7: StyleProp<ViewStyle> = { borderColor: this.tint__7 };
  border_tint_8: StyleProp<ViewStyle> = { borderColor: this.tint__8 };
  border_tint_9: StyleProp<ViewStyle> = { borderColor: this.tint__9 };
  border_tint_10: StyleProp<ViewStyle> = { borderColor: this.tint__10 };
  border_tint_11: StyleProp<ViewStyle> = { borderColor: this.tint__11 };
  border_danger: StyleProp<ViewStyle> = { borderColor: this.danger };
  border_success: StyleProp<ViewStyle> = { borderColor: this.success };
  border_warn: StyleProp<ViewStyle> = { borderColor: this.warn };
  border_primary1: StyleProp<ViewStyle> = { borderColor: this.primary__1 };
  border_primary2: StyleProp<ViewStyle> = { borderColor: this.primary__2 };
  border_primary5: StyleProp<ViewStyle> = { borderColor: this.primary__5 };
}
