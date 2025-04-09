import React from 'react';
import {
  StyleProp,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import {$} from '../styles';
import {AppText} from './apptext.component';

type AppButtonProps = {
  /** Button text */
  name: string;
  /** Function to call when pressed */
  onPress?: () => void;
  /** Disables the button and shows loading indicator if isLoading is true */
  disabled?: boolean;
  /** Shows loading indicator */
  isLoading?: boolean;
  /** Style for the button container */
  style?: StyleProp<ViewStyle>;
  /** Style for the button text */
  textStyle?: StyleProp<TextStyle>;
  /** Color of the loading indicator */
  loadingColor?: string;
  /** Size of the loading indicator */
  loadingSize?: 'small' | 'large';
};

export const AppButton: React.FC<AppButtonProps> = ({
  name,
  onPress,
  disabled = false,
  isLoading = false,
  style,
  textStyle,
  loadingColor = '#ffffff',
  loadingSize = 'small',
  ...touchableProps
}) => {
  const isButtonDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isButtonDisabled}
      style={[
        $.p_compact,
        $.border_rounded,
        $.align_items_center,
        $.justify_content_center,
        {
          opacity: isButtonDisabled ? 0.6 : 1,
        },
        style,
      ]}
      activeOpacity={0.7}
      {...touchableProps}
    >
      {isLoading ? (
        <ActivityIndicator size={loadingSize} color={loadingColor} />
      ) : (
        <AppText
          style={[
            $.fs_compact,
            $.fw_semibold,
            $.text_center,
            textStyle,
          ]}
        >
          {name}
        </AppText>
      )}
    </TouchableOpacity>
  );
};