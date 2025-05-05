import {ReactNode} from 'react';
import {View, StyleProp, ViewStyle} from 'react-native';
import { $ } from '../styles';
import { styled, StyledComponent } from 'nativewind';

const StyledView: StyledComponent<typeof View> = styled(View);

type AppViewProps = {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  key?: string | number;
  className?: string;
};

export const AppView = ({ style, children, key, className }: AppViewProps) => {
  const combinedStyle = [$.bg_tint_11, style];
  return (
    <StyledView 
      className={className} 
      key={key} 
      style={combinedStyle}
    >
      {children}
    </StyledView>
  );
};
