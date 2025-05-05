import {ReactNode} from 'react';
import {TextProps, Text, StyleProp, TextStyle} from 'react-native';
import {$} from '../styles';
import { styled } from 'nativewind';

const StyledText = styled(Text);

type AppTextProps = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  className?: string;
};

export const AppText = (props: AppTextProps) => {
  const { className, ...rest } = props;
  return (
    <StyledText className={className} style={[$.fs_compact, $.fw_regular, $.text_tint_4, props.style]}>
      {props.children}
    </StyledText>
  );
};
