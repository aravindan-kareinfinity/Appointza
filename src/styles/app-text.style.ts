import {StyleProp, TextStyle} from 'react-native';

export class AppText {
  private constructor() {}

  private static _instance: AppText | null = null;
  public static get instance(): AppText {
    if (AppText._instance == null) {
      this._instance = new AppText();
    }
    return this._instance!;
  }
  s_tiny: number = 10;
  s_extrasmall: number = 12;
  s_small: number = 14;
  s_compact: number = 16;
  s_regular: number = 18;
  s_normal: number = 20;
  s_medium: number = 22;
  s_big: number = 24;
  s_large: number = 28;
  s_huge: number = 32;
  s_massive: number = 36;
  s_enormous: number = 40;
  s_giant: number = 48;
  s_extralarge: number = 56;
  s_colossal: number = 64;

  fs_tiny: StyleProp<TextStyle> = {fontSize: 10, lineHeight: 14};
  fs_extrasmall: StyleProp<TextStyle> = {fontSize: 12, lineHeight: 16};
  fs_small: StyleProp<TextStyle> = {fontSize: 14, lineHeight: 18};
  fs_compact: StyleProp<TextStyle> = {fontSize: 16, lineHeight: 20};
  fs_regular: StyleProp<TextStyle> = {fontSize: 18, lineHeight: 22};
  fs_normal: StyleProp<TextStyle> = {fontSize: 20, lineHeight: 24};
  fs_medium: StyleProp<TextStyle> = {fontSize: 22, lineHeight: 26};
  fs_big: StyleProp<TextStyle> = {fontSize: 24, lineHeight: 28};
  fs_large: StyleProp<TextStyle> = {fontSize: 28, lineHeight: 32};
  fs_huge: StyleProp<TextStyle> = {fontSize: 32, lineHeight: 36};
  fs_massive: StyleProp<TextStyle> = {fontSize: 36, lineHeight: 42};
  fs_enormous: StyleProp<TextStyle> = {fontSize: 40, lineHeight: 48};
  fs_giant: StyleProp<TextStyle> = {fontSize: 48, lineHeight: 56};
  fs_extralarge: StyleProp<TextStyle> = {fontSize: 56, lineHeight: 64};
  fs_colossal: StyleProp<TextStyle> = {fontSize: 64, lineHeight: 72};

  fw_black: StyleProp<TextStyle> = {fontFamily: 'Poppins-Black'};
  fw_blackitalic: StyleProp<TextStyle> = {
    fontFamily: 'Poppins-BlackItalic',
  };
  fw_bold: StyleProp<TextStyle> = {fontFamily: 'Poppins-Bold'};
  fw_bolditalic: StyleProp<TextStyle> = {
    fontFamily: 'Poppins-BoldItalic',
  };
  fw_extrabold: StyleProp<TextStyle> = {
    fontFamily: 'Poppins-ExtraBold',
  };
  fw_extrabolditalic: StyleProp<TextStyle> = {
    fontFamily: 'Poppins-ExtraBoldItalic',
  };
  fw_extralight: StyleProp<TextStyle> = {
    fontFamily: 'Poppins-ExtraLight',
  };
  fw_extralightitalic: StyleProp<TextStyle> = {
    fontFamily: 'Poppins-ExtraLightItalic',
  };
  fw_italic: StyleProp<TextStyle> = {fontFamily: 'Poppins-Italic'};
  fw_light: StyleProp<TextStyle> = {fontFamily: 'Poppins-Light'};
  fw_lightitalic: StyleProp<TextStyle> = {
    fontFamily: 'Poppins-LightItalic',
  };
  fw_medium: StyleProp<TextStyle> = {fontFamily: 'Poppins-Medium'};
  fw_mediumitalic: StyleProp<TextStyle> = {
    fontFamily: 'Poppins-MediumItalic',
  };
  fw_regular: StyleProp<TextStyle> = {fontFamily: 'Poppins-Regular'};
  fw_semibold: StyleProp<TextStyle> = {fontFamily: 'Poppins-SemiBold'};
  fw_semibolditalic: StyleProp<TextStyle> = {
    fontFamily: 'Poppins-SemiBoldItalic',
  };
  fw_thin: StyleProp<TextStyle> = {fontFamily: 'Poppins-Thin'};
  fw_thinitalic: StyleProp<TextStyle> = {
    fontFamily: 'Poppins-ThinItalic',
  };
  /* alignment */
  text_left: StyleProp<TextStyle> = {textAlign: 'left'};
  text_center: StyleProp<TextStyle> = {textAlign: 'center'};
  text_right: StyleProp<TextStyle> = {textAlign: 'right'};
}
