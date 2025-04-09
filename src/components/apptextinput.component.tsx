import React, { useState, useEffect } from 'react';
import {
  TextInput,
  ViewStyle,
  StyleProp,
  KeyboardTypeOptions,
  TextStyle,
} from 'react-native';
import { AppView } from './appview.component';
import { $ } from '../styles';
import { CustomIcon, CustomIcons } from './customicons.component';
import { AppText } from './apptext.component';

type AppTextInputProps = {
  keyboardtype?: KeyboardTypeOptions;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  icon?: CustomIcons;
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  required?: boolean;
  showerror?: boolean;
  autoCapitalize?: boolean;
  readonly?: boolean;
  maxLength?: number;
  errorMessage?: string;
  onBlur?: () => void;
  onFocus?: () => void;
};

export const AppTextInput = (props: AppTextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const isvalid = () => {
    if (!props.required) return true;
    return props.value && props.value.length > 0 && props.value !== "0";
  };

  const shouldShowError = props.showerror && !isvalid() && hasInteracted;

  const handleFocus = () => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasInteracted(true);
    if (props.onBlur) props.onBlur();
  };

  useEffect(() => {
    // Validate on initial render if value exists
    if (props.value && props.value.length > 0) {
      setHasInteracted(true);
    }
  }, []);

  return (
    <AppView>
      <AppView
        style={[
          $.bg_primary5,
          props.style,
          isFocused && [$.border, $.border_tint_1],
          shouldShowError && [$.border, $.border_danger],
        ]}>
        {props.placeholder &&
          props.value !== undefined &&
          props.value.length > 0 && (
            <AppText style={[$.fs_compact, $.text_primary5]}>
              {props.placeholder}
            </AppText>
          )}
        <AppView style={[$.flex_row, $.align_items_center]}>
          {props.icon !== undefined && (
            <AppView style={[$.pr_compact]}>
              <CustomIcon
                size={$.s_medium}
                color={shouldShowError ? $.danger : $.tint_5}
                name={props.icon}
              />
            </AppView>
          )}
          <TextInput
            autoCapitalize={props.autoCapitalize ? 'characters' : 'none'}
            keyboardType={props.keyboardtype}
            value={props.value}
            onChangeText={props.onChangeText}
            style={[
              $.flex_1,
              $.fs_compact,
              $.fw_semibold,
              $.text_primary5,
              { padding: 0 },
              props.inputStyle,
            ]}
            placeholder={props.placeholder}
            placeholderTextColor={$.tint_primary_5}
            readOnly={props.readonly}
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={props.maxLength}
          />
          {props.required && (
            <AppText style={[$.text_danger, $.fs_regular]}>*</AppText>
          )}
        </AppView>
      </AppView>
      
      {shouldShowError && props.errorMessage && (
        <AppText style={[$.text_danger, $.fs_small, $.mt_tiny]}>
          {props.errorMessage}
        </AppText>
      )}
    </AppView>
  );
};