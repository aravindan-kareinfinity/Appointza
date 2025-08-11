import {Dimensions, StyleProp, ViewStyle, StatusBar} from 'react-native';

export class AppView {
  private constructor() {}

  private static _instance: AppView | null = null;
  public static get instance(): AppView {
    if (AppView._instance == null) {
      this._instance = new AppView();
    }
    return this._instance!;
  }
  status_bar_height: number = StatusBar.currentHeight!;
  spacer: number = 10;
  /* misc */
  follow_statusbar: StyleProp<ViewStyle> = {
    marginTop: this.status_bar_height,
  };

  width: number = Dimensions.get('screen').width;
  height: number = Dimensions.get('screen').height;
  /* alignment */
  flex_1: StyleProp<ViewStyle> = {flex: 1};
  flex_column: StyleProp<ViewStyle> = {flexDirection: 'column'};
  flex_row: StyleProp<ViewStyle> = {flexDirection: 'row'};
  flex_wrap_wrap: StyleProp<ViewStyle> = {flexWrap: 'wrap'};
  justify_content_start: StyleProp<ViewStyle> = {
    justifyContent: 'flex-start',
  };
  justify_content_end: StyleProp<ViewStyle> = {justifyContent: 'flex-end'};
  justify_content_center: StyleProp<ViewStyle> = {justifyContent: 'center'};
  align_items_start: StyleProp<ViewStyle> = {alignItems: 'flex-start'};
  align_items_end: StyleProp<ViewStyle> = {alignItems: 'flex-end'};
  align_items_center: StyleProp<ViewStyle> = {alignItems: 'center'};

  space_tiny = 2;
  space_extrasmall = 4;
  space_small = 8;
  space_compact = 12;
  space_regular = 16;
  space_normal = 20;
  space_medium = 24;
  space_big = 32;
  space_large = 40;
  space_huge = 48;
  space_massive = 64;
  space_enormous = 80;
  space_giant = 96;
  space_extralarge = 128;
  space_colossal = 160;

  /* margin */
  m_tiny: StyleProp<ViewStyle> = {margin: 2};
  m_extrasmall: StyleProp<ViewStyle> = {margin: 4};
  m_small: StyleProp<ViewStyle> = {margin: 8};
  m_compact: StyleProp<ViewStyle> = {margin: 12};
  m_regular: StyleProp<ViewStyle> = {margin: 16};
  m_normal: StyleProp<ViewStyle> = {margin: 20};
  m_medium: StyleProp<ViewStyle> = {margin: 24};
  m_big: StyleProp<ViewStyle> = {margin: 32};
  m_large: StyleProp<ViewStyle> = {margin: 40};
  m_huge: StyleProp<ViewStyle> = {margin: 48};
  m_massive: StyleProp<ViewStyle> = {margin: 64};
  m_enormous: StyleProp<ViewStyle> = {margin: 80};
  m_giant: StyleProp<ViewStyle> = {margin: 96};
  m_extralarge: StyleProp<ViewStyle> = {margin: 128};
  m_colossal: StyleProp<ViewStyle> = {margin: 160};

  ml_tiny: StyleProp<ViewStyle> = {marginLeft: 2};
  ml_extrasmall: StyleProp<ViewStyle> = {marginLeft: 4};
  ml_small: StyleProp<ViewStyle> = {marginLeft: 8};
  ml_compact: StyleProp<ViewStyle> = {marginLeft: 12};
  ml_regular: StyleProp<ViewStyle> = {marginLeft: 16};
  ml_normal: StyleProp<ViewStyle> = {marginLeft: 20};
  ml_medium: StyleProp<ViewStyle> = {marginLeft: 24};
  ml_big: StyleProp<ViewStyle> = {marginLeft: 32};
  ml_large: StyleProp<ViewStyle> = {marginLeft: 40};
  ml_huge: StyleProp<ViewStyle> = {marginLeft: 48};
  ml_massive: StyleProp<ViewStyle> = {marginLeft: 64};
  ml_enormous: StyleProp<ViewStyle> = {marginLeft: 80};
  ml_giant: StyleProp<ViewStyle> = {marginLeft: 96};
  ml_extralarge: StyleProp<ViewStyle> = {marginLeft: 128};
  ml_colossal: StyleProp<ViewStyle> = {marginLeft: 160};

  mr_tiny: StyleProp<ViewStyle> = {marginRight: 2};
  mr_extrasmall: StyleProp<ViewStyle> = {marginRight: 4};
  mr_small: StyleProp<ViewStyle> = {marginRight: 8};
  mr_compact: StyleProp<ViewStyle> = {marginRight: 12};
  mr_regular: StyleProp<ViewStyle> = {marginRight: 16};
  mr_normal: StyleProp<ViewStyle> = {marginRight: 20};
  mr_medium: StyleProp<ViewStyle> = {marginRight: 24};
  mr_big: StyleProp<ViewStyle> = {marginRight: 32};
  mr_large: StyleProp<ViewStyle> = {marginRight: 40};
  mr_huge: StyleProp<ViewStyle> = {marginRight: 48};
  mr_massive: StyleProp<ViewStyle> = {marginRight: 64};
  mr_enormous: StyleProp<ViewStyle> = {marginRight: 80};
  mr_giant: StyleProp<ViewStyle> = {marginRight: 96};
  mr_extralarge: StyleProp<ViewStyle> = {marginRight: 128};
  mr_colossal: StyleProp<ViewStyle> = {marginRight: 160};

  mt_tiny: StyleProp<ViewStyle> = {marginTop: 2};
  mt_extrasmall: StyleProp<ViewStyle> = {marginTop: 4};
  mt_small: StyleProp<ViewStyle> = {marginTop: 8};
  mt_compact: StyleProp<ViewStyle> = {marginTop: 12};
  mt_regular: StyleProp<ViewStyle> = {marginTop: 16};
  mt_normal: StyleProp<ViewStyle> = {marginTop: 20};
  mt_medium: StyleProp<ViewStyle> = {marginTop: 24};
  mt_big: StyleProp<ViewStyle> = {marginTop: 32};
  mt_large: StyleProp<ViewStyle> = {marginTop: 40};
  mt_huge: StyleProp<ViewStyle> = {marginTop: 48};
  mt_massive: StyleProp<ViewStyle> = {marginTop: 64};
  mt_enormous: StyleProp<ViewStyle> = {marginTop: 80};
  mt_giant: StyleProp<ViewStyle> = {marginTop: 96};
  mt_extralarge: StyleProp<ViewStyle> = {marginTop: 128};
  mt_colossal: StyleProp<ViewStyle> = {marginTop: 160};

  mb_tiny: StyleProp<ViewStyle> = {marginBottom: 2};
  mb_extrasmall: StyleProp<ViewStyle> = {marginBottom: 4};
  mb_small: StyleProp<ViewStyle> = {marginBottom: 8};
  mb_compact: StyleProp<ViewStyle> = {marginBottom: 12};
  mb_regular: StyleProp<ViewStyle> = {marginBottom: 16};
  mb_normal: StyleProp<ViewStyle> = {marginBottom: 20};
  mb_medium: StyleProp<ViewStyle> = {marginBottom: 24};
  mb_big: StyleProp<ViewStyle> = {marginBottom: 32};
  mb_large: StyleProp<ViewStyle> = {marginBottom: 40};
  mb_huge: StyleProp<ViewStyle> = {marginBottom: 48};
  mb_massive: StyleProp<ViewStyle> = {marginBottom: 64};
  mb_enormous: StyleProp<ViewStyle> = {marginBottom: 80};
  mb_giant: StyleProp<ViewStyle> = {marginBottom: 96};
  mb_extralarge: StyleProp<ViewStyle> = {marginBottom: 128};
  mb_colossal: StyleProp<ViewStyle> = {marginBottom: 160};

  mx_tiny: StyleProp<ViewStyle> = {marginHorizontal: this.space_tiny};
  mx_extrasmall: StyleProp<ViewStyle> = {
    marginHorizontal: this.space_extrasmall,
  };
  mx_small: StyleProp<ViewStyle> = {marginHorizontal: this.space_small};
  mx_compact: StyleProp<ViewStyle> = {marginHorizontal: this.space_compact};
  mx_regular: StyleProp<ViewStyle> = {marginHorizontal: this.space_regular};
  mx_normal: StyleProp<ViewStyle> = {marginHorizontal: this.space_normal};
  mx_medium: StyleProp<ViewStyle> = {marginHorizontal: this.space_medium};
  mx_big: StyleProp<ViewStyle> = {marginHorizontal: this.space_big};
  mx_large: StyleProp<ViewStyle> = {marginHorizontal: this.space_large};
  mx_huge: StyleProp<ViewStyle> = {marginHorizontal: this.space_huge};
  mx_massive: StyleProp<ViewStyle> = {marginHorizontal: this.space_massive};
  mx_enormous: StyleProp<ViewStyle> = {marginHorizontal: this.space_enormous};
  mx_giant: StyleProp<ViewStyle> = {marginHorizontal: this.space_giant};
  mx_extralarge: StyleProp<ViewStyle> = {
    marginHorizontal: this.space_extralarge,
  };
  mx_colossal: StyleProp<ViewStyle> = {marginHorizontal: this.space_colossal};

  my_tiny: StyleProp<ViewStyle> = {marginVertical: this.space_tiny};
  my_extrasmall: StyleProp<ViewStyle> = {marginVertical: this.space_extrasmall};
  my_small: StyleProp<ViewStyle> = {marginVertical: this.space_small};
  my_compact: StyleProp<ViewStyle> = {marginVertical: this.space_compact};
  my_regular: StyleProp<ViewStyle> = {marginVertical: this.space_regular};
  my_normal: StyleProp<ViewStyle> = {marginVertical: this.space_normal};
  my_medium: StyleProp<ViewStyle> = {marginVertical: this.space_medium};
  my_big: StyleProp<ViewStyle> = {marginVertical: this.space_big};
  my_large: StyleProp<ViewStyle> = {marginVertical: this.space_large};
  my_huge: StyleProp<ViewStyle> = {marginVertical: this.space_huge};
  my_massive: StyleProp<ViewStyle> = {marginVertical: this.space_massive};
  my_enormous: StyleProp<ViewStyle> = {marginVertical: this.space_enormous};
  my_giant: StyleProp<ViewStyle> = {marginVertical: this.space_giant};
  my_extralarge: StyleProp<ViewStyle> = {marginVertical: this.space_extralarge};
  my_colossal: StyleProp<ViewStyle> = {marginVertical: this.space_colossal};

  p_tiny: StyleProp<ViewStyle> = {padding: this.space_tiny};
  p_extrasmall: StyleProp<ViewStyle> = {padding: this.space_extrasmall};
  p_small: StyleProp<ViewStyle> = {padding: this.space_small};
  p_compact: StyleProp<ViewStyle> = {padding: this.space_compact};
  p_regular: StyleProp<ViewStyle> = {padding: this.space_regular};
  p_normal: StyleProp<ViewStyle> = {padding: this.space_normal};
  p_medium: StyleProp<ViewStyle> = {padding: this.space_medium};
  p_big: StyleProp<ViewStyle> = {padding: this.space_big};
  p_large: StyleProp<ViewStyle> = {padding: this.space_large};
  p_huge: StyleProp<ViewStyle> = {padding: this.space_huge};
  p_massive: StyleProp<ViewStyle> = {padding: this.space_massive};
  p_enormous: StyleProp<ViewStyle> = {padding: this.space_enormous};
  p_giant: StyleProp<ViewStyle> = {padding: this.space_giant};
  p_extralarge: StyleProp<ViewStyle> = {padding: this.space_extralarge};
  p_colossal: StyleProp<ViewStyle> = {padding: this.space_colossal};

  pl_tiny: StyleProp<ViewStyle> = {paddingLeft: this.space_tiny};
  pl_extrasmall: StyleProp<ViewStyle> = {paddingLeft: this.space_extrasmall};
  pl_small: StyleProp<ViewStyle> = {paddingLeft: this.space_small};
  pl_compact: StyleProp<ViewStyle> = {paddingLeft: this.space_compact};
  pl_regular: StyleProp<ViewStyle> = {paddingLeft: this.space_regular};
  pl_normal: StyleProp<ViewStyle> = {paddingLeft: this.space_normal};
  pl_medium: StyleProp<ViewStyle> = {paddingLeft: this.space_medium};
  pl_big: StyleProp<ViewStyle> = {paddingLeft: this.space_big};
  pl_large: StyleProp<ViewStyle> = {paddingLeft: this.space_large};
  pl_huge: StyleProp<ViewStyle> = {paddingLeft: this.space_huge};
  pl_massive: StyleProp<ViewStyle> = {paddingLeft: this.space_massive};
  pl_enormous: StyleProp<ViewStyle> = {paddingLeft: this.space_enormous};
  pl_giant: StyleProp<ViewStyle> = {paddingLeft: this.space_giant};
  pl_extralarge: StyleProp<ViewStyle> = {paddingLeft: this.space_extralarge};
  pl_colossal: StyleProp<ViewStyle> = {paddingLeft: this.space_colossal};

  pr_tiny: StyleProp<ViewStyle> = {paddingRight: this.space_tiny};
  pr_extrasmall: StyleProp<ViewStyle> = {paddingRight: this.space_extrasmall};
  pr_small: StyleProp<ViewStyle> = {paddingRight: this.space_small};
  pr_compact: StyleProp<ViewStyle> = {paddingRight: this.space_compact};
  pr_regular: StyleProp<ViewStyle> = {paddingRight: this.space_regular};
  pr_normal: StyleProp<ViewStyle> = {paddingRight: this.space_normal};
  pr_medium: StyleProp<ViewStyle> = {paddingRight: this.space_medium};
  pr_big: StyleProp<ViewStyle> = {paddingRight: this.space_big};
  pr_large: StyleProp<ViewStyle> = {paddingRight: this.space_large};
  pr_huge: StyleProp<ViewStyle> = {paddingRight: this.space_huge};
  pr_massive: StyleProp<ViewStyle> = {paddingRight: this.space_massive};
  pr_enormous: StyleProp<ViewStyle> = {paddingRight: this.space_enormous};
  pr_giant: StyleProp<ViewStyle> = {paddingRight: this.space_giant};
  pr_extralarge: StyleProp<ViewStyle> = {paddingRight: this.space_extralarge};
  pr_colossal: StyleProp<ViewStyle> = {paddingRight: this.space_colossal};

  pt_tiny: StyleProp<ViewStyle> = {paddingTop: this.space_tiny};
  pt_extrasmall: StyleProp<ViewStyle> = {paddingTop: this.space_extrasmall};
  pt_small: StyleProp<ViewStyle> = {paddingTop: this.space_small};
  pt_compact: StyleProp<ViewStyle> = {paddingTop: this.space_compact};
  pt_regular: StyleProp<ViewStyle> = {paddingTop: this.space_regular};
  pt_normal: StyleProp<ViewStyle> = {paddingTop: this.space_normal};
  pt_medium: StyleProp<ViewStyle> = {paddingTop: this.space_medium};
  pt_big: StyleProp<ViewStyle> = {paddingTop: this.space_big};
  pt_large: StyleProp<ViewStyle> = {paddingTop: this.space_large};
  pt_huge: StyleProp<ViewStyle> = {paddingTop: this.space_huge};
  pt_massive: StyleProp<ViewStyle> = {paddingTop: this.space_massive};
  pt_enormous: StyleProp<ViewStyle> = {paddingTop: this.space_enormous};
  pt_giant: StyleProp<ViewStyle> = {paddingTop: this.space_giant};
  pt_extralarge: StyleProp<ViewStyle> = {paddingTop: this.space_extralarge};
  pt_colossal: StyleProp<ViewStyle> = {paddingTop: this.space_colossal};

  pb_tiny: StyleProp<ViewStyle> = {paddingBottom: this.space_tiny};
  pb_extrasmall: StyleProp<ViewStyle> = {paddingBottom: this.space_extrasmall};
  pb_small: StyleProp<ViewStyle> = {paddingBottom: this.space_small};
  pb_compact: StyleProp<ViewStyle> = {paddingBottom: this.space_compact};
  pb_regular: StyleProp<ViewStyle> = {paddingBottom: this.space_regular};
  pb_normal: StyleProp<ViewStyle> = {paddingBottom: this.space_normal};
  pb_medium: StyleProp<ViewStyle> = {paddingBottom: this.space_medium};
  pb_big: StyleProp<ViewStyle> = {paddingBottom: this.space_big};
  pb_large: StyleProp<ViewStyle> = {paddingBottom: this.space_large};
  pb_huge: StyleProp<ViewStyle> = {paddingBottom: this.space_huge};
  pb_massive: StyleProp<ViewStyle> = {paddingBottom: this.space_massive};
  pb_enormous: StyleProp<ViewStyle> = {paddingBottom: this.space_enormous};
  pb_giant: StyleProp<ViewStyle> = {paddingBottom: this.space_giant};
  pb_extralarge: StyleProp<ViewStyle> = {paddingBottom: this.space_extralarge};
  pb_colossal: StyleProp<ViewStyle> = {paddingBottom: this.space_colossal};

  px_tiny: StyleProp<ViewStyle> = {paddingHorizontal: this.space_tiny};
  px_extrasmall: StyleProp<ViewStyle> = {
    paddingHorizontal: this.space_extrasmall,
  };
  px_small: StyleProp<ViewStyle> = {paddingHorizontal: this.space_small};
  px_compact: StyleProp<ViewStyle> = {paddingHorizontal: this.space_compact};
  px_regular: StyleProp<ViewStyle> = {paddingHorizontal: this.space_regular};
  px_normal: StyleProp<ViewStyle> = {paddingHorizontal: this.space_normal};
  px_medium: StyleProp<ViewStyle> = {paddingHorizontal: this.space_medium};
  px_big: StyleProp<ViewStyle> = {paddingHorizontal: this.space_big};
  px_large: StyleProp<ViewStyle> = {paddingHorizontal: this.space_large};
  px_huge: StyleProp<ViewStyle> = {paddingHorizontal: this.space_huge};
  px_massive: StyleProp<ViewStyle> = {paddingHorizontal: this.space_massive};
  px_enormous: StyleProp<ViewStyle> = {paddingHorizontal: this.space_enormous};
  px_giant: StyleProp<ViewStyle> = {paddingHorizontal: this.space_giant};
  px_extralarge: StyleProp<ViewStyle> = {
    paddingHorizontal: this.space_extralarge,
  };
  px_colossal: StyleProp<ViewStyle> = {paddingHorizontal: this.space_colossal};

  py_tiny: StyleProp<ViewStyle> = {paddingVertical: this.space_tiny};
  py_extrasmall: StyleProp<ViewStyle> = {
    paddingVertical: this.space_extrasmall,
  };
  py_small: StyleProp<ViewStyle> = {paddingVertical: this.space_small};
  py_compact: StyleProp<ViewStyle> = {paddingVertical: this.space_compact};
  py_regular: StyleProp<ViewStyle> = {paddingVertical: this.space_regular};
  py_normal: StyleProp<ViewStyle> = {paddingVertical: this.space_normal};
  py_medium: StyleProp<ViewStyle> = {paddingVertical: this.space_medium};
  py_big: StyleProp<ViewStyle> = {paddingVertical: this.space_big};
  py_large: StyleProp<ViewStyle> = {paddingVertical: this.space_large};
  py_huge: StyleProp<ViewStyle> = {paddingVertical: this.space_huge};
  py_massive: StyleProp<ViewStyle> = {paddingVertical: this.space_massive};
  py_enormous: StyleProp<ViewStyle> = {paddingVertical: this.space_enormous};
  py_giant: StyleProp<ViewStyle> = {paddingVertical: this.space_giant};
  py_extralarge: StyleProp<ViewStyle> = {
    paddingVertical: this.space_extralarge,
  };
  py_colossal: StyleProp<ViewStyle> = {paddingVertical: this.space_colossal};

  /* border */
  border: StyleProp<ViewStyle> = {borderWidth: 1};
  border_bottom: StyleProp<ViewStyle> = {borderBottomWidth: 1};
  border_top: StyleProp<ViewStyle> = {borderTopWidth: 1};
  border_right: StyleProp<ViewStyle> = {borderRightWidth: 1};
  border_left: StyleProp<ViewStyle> = {borderLeftWidth: 1};
  border_rounded: StyleProp<ViewStyle> = {borderRadius: 5};
  border_rounded2: StyleProp<ViewStyle> = {borderRadius: 12};


  /* elevation */
  elevation_1: StyleProp<ViewStyle> = {elevation: 1};
  elevation_2: StyleProp<ViewStyle> = {elevation: 2};
  elevation_3: StyleProp<ViewStyle> = {elevation: 3};
  elevation_4: StyleProp<ViewStyle> = {elevation: 4};
  elevation_5: StyleProp<ViewStyle> = {elevation: 5};

  /* width */
  w_100: StyleProp<ViewStyle> = {
    width: '100%',
  };
  h_100: StyleProp<ViewStyle> = {
    height: '100%',
  };
}
