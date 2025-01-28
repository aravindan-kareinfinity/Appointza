import {ReactNode, useEffect, useState} from 'react';
import {TextProps, Text, StyleProp, TextStyle} from 'react-native';
import {$} from '../styles';

type AppTextProps = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
};
export const AppText = (props: AppTextProps) => {
  return (
    <Text style={[$.fs_compact, $.fw_regular,$.text_tint_4, props.style]}>
      {props.children}
    </Text>
  );
};
