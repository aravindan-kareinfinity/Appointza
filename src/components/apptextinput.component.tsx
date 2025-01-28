import {TextInput, ViewStyle, StyleProp} from 'react-native';
import {AppView} from './appview.component';
import {$} from '../styles';
import {useEffect, useState} from 'react';
import {CustomIcon, CustomIcons} from './customicons.component';
import {AppText} from './apptext.component';
type AppTextInputProps = {
  style?: StyleProp<ViewStyle>;
  icon?: CustomIcons;
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
};
export const AppTextInput = (props: AppTextInputProps) => {
  return (
    <AppView style={[$.bg_tint_10, $.p_compact, props.style]}>
      {props.placeholder &&
        props.value != undefined &&
        props.value.length > 0 && (
          <AppText style={[$.fs_compact]}>{props.placeholder}</AppText>
        )}
      <AppView style={[$.flex_row, $.align_items_center]}>
        {props.icon != undefined && (
          <AppView style={[$.pr_compact]}>
            <CustomIcon size={$.s_medium} color={$.tint_5} name={props.icon} />
          </AppView>
        )}
        <TextInput
          value={props.value}
          onChangeText={props.onChangeText}
          style={[$.flex_1, $.fs_compact, $.fw_semibold, {padding: 0}]}
          placeholder={props.placeholder}
          placeholderTextColor={$.tint_5}></TextInput>
      </AppView>
    </AppView>
  );
};
