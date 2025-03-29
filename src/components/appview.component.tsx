import {ReactNode} from 'react';
import {View, StyleProp, ViewStyle} from 'react-native';
import { $ } from '../styles';
type AppViewProps = {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  key?: string | number;
};
export const AppView = (props: AppViewProps) => {
  return (
    <View key={props.key} style={[$.bg_tint_11,props.style]}>
      {props.children}
    </View>
  );
};
