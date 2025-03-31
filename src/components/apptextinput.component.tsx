import {
  TextInput,
  ViewStyle,
  StyleProp,
  KeyboardTypeOptions,
} from 'react-native';
import {AppView} from './appview.component';
import {$} from '../styles';
import {useEffect, useState} from 'react';
import {CustomIcon, CustomIcons} from './customicons.component';
import {AppText} from './apptext.component';
type AppTextInputProps = {
  keyboardtype?: KeyboardTypeOptions;
  style?: StyleProp<ViewStyle>;
  icon?: CustomIcons;
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  required?: boolean;
  showerror?: boolean;
  autoCapitalize?: boolean;
  readonly?: boolean;
};
export const AppTextInput = (props: AppTextInputProps) => {
  const isvalid = () => {
    return (
      props.required &&
      props.value &&
      props.value.length > 0 &&
      props.value != "0"
    );
  };
  return (
    <AppView
      style={[
        $.bg_primary5,
        props.style,
        props.showerror && !isvalid() && [$.border,$.border_danger],
      ]}>
      {props.placeholder &&
        props.value != undefined &&
        props.value.length > 0 && (
          <AppText style={[$.fs_compact,$.text_primary5]}>{props.placeholder}</AppText>
        )}
      <AppView style={[$.flex_row, $.align_items_center]}>
        {props.icon != undefined && (
          <AppView style={[$.pr_compact]}>
            <CustomIcon size={$.s_medium} color={$.tint_5} name={props.icon} />
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
            {padding: 0},
          ]}
          placeholder={props.placeholder}
          placeholderTextColor={$.tint_primary_5}
          readOnly={props.readonly}></TextInput>
        {props.required && (
          <AppText style={[$.text_danger, $.fs_regular]}>*</AppText>
        )}
      </AppView>
    </AppView>
  );
};
