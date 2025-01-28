import {useEffect, useState} from 'react';
import {
  StyleProp,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import {$} from '../styles';
import {AppText} from './apptext.component';

type AppButtonProps = {
  style?: StyleProp<ViewStyle>;
  textstyle?: StyleProp<TextStyle>;
  name: string;
  onPress?: () => void;
};
export const AppButton = (props: AppButtonProps) => {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      style={[$.p_compact, props.style]}>
      <AppText
        style={[$.fs_compact, $.fw_semibold, $.text_center, props.textstyle]}>
        {props.name}
      </AppText>
    </TouchableOpacity>
  );
};
