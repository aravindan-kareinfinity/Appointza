import {ReactNode} from 'react';
import {View, StyleProp, ViewStyle} from 'react-native';
type AppViewProps = {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  key?: string | number;
};
export const AppView = (props: AppViewProps) => {
  return (
    <View key={props.key} style={[props.style]}>
      {props.children}
    </View>
  );
};
