
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Theme } from '../models/theme.model';


export type ThemeType = 'light' | 'dark' | 'custom'  | 'Aravind';

export class DefaultColor {
  private constructor() { }

  private static _instance: DefaultColor | null = null;


  public static get instance(): DefaultColor {
    if (DefaultColor._instance == null) {
      this._instance = new DefaultColor();
    }
    return this._instance!;
  }
  

  // Switch the current theme, validating the theme
  public switchTheme(theme: ThemeType): void {
    console.log("theme", theme);

    this.currentTheme = theme;
    console.log("ajn", theme, this.currentTheme);
    this.getTheme()
    const selectedTheme = this.getTheme();
  }

  private currentTheme: ThemeType = 'light';


  // Directly returns the selected theme's colors
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
    dark: {
      tint_1: '#FFFFFF',
      tint_2: '#F5F5F5',
      tint_3: '#EAEAEA',
      tint_4: '#D4D4D4',
      tint_5: '#BFBFBF',
      tint_6: '#A9A9A9',
      tint_7: '#949494',
      tint_8: '#7F7F7F',
      tint_9: '#696969',
      tint_10: '#545454',
      tint_11: '#3E3E3E',
      tint_ash: '#4B5563', // Ash Gray
      danger: '#FF3B30',
      success: '#34C759',
      warn: '#FFD60A',
      primary1:'',
      primary2:'',
      primary3:'',
      primary4:'',
      primary5:'',
    },
    light: {
      tint_1: '#0B3D02',  // Deep Forest Green  
      tint_2: '#165B12',  // Dark Green  
      tint_3: '#1F7A1F',  // Classic Green  
      tint_4: '#2C9B2F',  // Bright Leaf Green  
      tint_5: '#3DBB40',  // Vivid Green  
      tint_6: '#5DDC5A',  // Light Vibrant Green  
      tint_7: '#7FE27F',  // Soft Pastel Green  
      tint_8: '#A3EAA3',  // Mint Green  
      tint_9: '#C7F1C7',  // Pale Green  
      tint_10: '#EAF9EA', // Almost White Green  
      tint_11: '#FFFFFF',
      tint_ash: "#4B5563", // Ash Gray
    
      danger: '#D32F2F',  // Adjusted for better contrast
      success: '#388E3C', // Rich Success Green
      warn: '#FBC02D',   // Golden Warning
    
      primary1: '#EFF6FF',  // sky blue 
      primary2: '#2A5EDD',  // Dark Blue  
      primary3: '#2FA866',  // Fresh Emerald Green  
      primary4: '#81C784',  // Light Mint Green  
      primary5: '#000',  // black  
    }
,    

    Aravind: {
      tint_1: '#404040',  // Dark Gray
      tint_2: '#2B2B2B',  // Almost Black
      tint_3: '#565656',  // Charcoal Gray
      tint_4: '#6B6B6B',  // Medium Gray
      tint_5: '#818181',  // Soft Gray
      tint_6: '#969696',  // Neutral Gray
      tint_7: '#ADADAD',  // Light Gray
      tint_8: '#C3C3C3',  // Very Light Gray
      tint_9: '#D9D9D9',  // Pale Gray
      tint_10: '#EFEFEF', // Almost White
      tint_11: '#FFFFFF', // Pure White
      tint_ash: '#4B5563', // Ash Gray
      danger: '#FF3B30',  // Bright Red
      success: '#30D158', // Fresh Green
      warn: '#FFC300',    // Warm Yellow
      primary1:'',
      primary2:'',
      primary3:'',
      primary4:'',
      primary5:'',
},

    custom: {
      tint_1: '#2B2B2B',
      tint_2: '#3C3C3C',
      tint_3: '#4D4D4D',
      tint_4: '#5E5E5E',
      tint_5: '#6F6F6F',
      tint_6: '#808080',
      tint_7: '#919191',
      tint_8: '#A2A2A2',
      tint_9: '#B3B3B3',
      tint_10: '#C4C4C4',
      tint_11: '#D5D5D5',
      tint_ash: '#4B5563', // Ash Gray
      danger: '#FF6B6B',
      success: '#51CF66',
      warn: '#FFC107',
      primary1:'',
      primary2:'',
      primary3:'',
      primary4:'',
      primary5:'',
    },
  };

  get colors(): Theme {
    
    return this.themes[this.currentTheme];
  }

  // Accessors for theme colors
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
  get tint__ash(): string {
    return this.colors.tint_ash;
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

  
  border_danger: StyleProp<ViewStyle> = {borderColor: this.danger};
  border_success: StyleProp<ViewStyle> = {borderColor: this.success};
  border_warn: StyleProp<ViewStyle> = {borderColor: this.warn};

  border_primary1: StyleProp<ViewStyle> = {borderColor: this.primary__1};
  border_primary2: StyleProp<ViewStyle> = {borderColor: this.primary__2};
  border_primary5: StyleProp<ViewStyle> = {borderColor: this.primary__5};
}
