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
import { validatorutil } from '../utils/validator.utils';
type AppTextInputProps = {
  keyboardtype?: KeyboardTypeOptions;
  style?: StyleProp<ViewStyle>;
  icon?: CustomIcons;
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  issubmitted?: boolean;
  maxLength?: number;
  autoCapitalize?: boolean;
  readonly?: boolean;
  onEndEditing?: (text: string) => void;
  validators?: AppTextInputValidator[];
};
export const AppTextInput = (props: AppTextInputProps) => {
  const [errormessage, setErrormessage] = useState('');
  const [istouched, setIstouched] = useState(false);
  useEffect(() => {
    validate();
  }, [props.value]);
  useEffect(() => {
    if (istouched == true && props.issubmitted == false) {
      setIstouched(false);
    }
  }, [props.issubmitted]);
  const validate = () => {
    setErrormessage('');
    var errormessagelist: string[] = [];
    props.validators?.forEach(validator => {
      var message = validator(props.value || '');
      if (message && message.trim().length > 0) {
        errormessagelist.push(message);
      }
    });
    setErrormessage(errormessagelist.join(',\n'));
  };
  return (
    <AppView
      style={[
        $.border,
        $.border_tint_9,
        $.p_compact,
        props.style,
        (istouched || props.issubmitted) &&
          errormessage.length > 0 && [$.border, $.border_danger],
        props.readonly && $.bg_tint_10,
      ]}>
      {props.placeholder &&
        props.value != undefined &&
        props.value.length > 0 && (
          <AppText style={[$.fs_small, $.fw_regular, $.text_tint_5]}>
            {props.placeholder}
          </AppText>
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
          onChangeText={text => {
            setIstouched(true);
            if (props.onChangeText) {
              props.onChangeText(text);
            }
          }}
          style={[
            $.flex_1,
            $.fs_small,
            $.fw_regular,
            $.text_tint_5,
            {padding: 0},
            props.value != undefined &&
              props.value.length > 0 && [
                $.fs_compact,
                $.fw_semibold,
                $.text_tint_1,
              ],
          ]}
          placeholder={props.placeholder}
          placeholderTextColor={$.tint_5}
          maxLength={props.maxLength}
          readOnly={props.readonly}
          onEndEditing={event => {
            const enteredText = event.nativeEvent.text;
            if (props.onEndEditing) {
              props.onEndEditing(enteredText);
            }
          }}></TextInput>
      </AppView>
      {(istouched || props.issubmitted) && errormessage.length > 0 && (
        <AppText style={[$.fs_small, $.text_danger]}>{errormessage}</AppText>
      )}
    </AppView>
  );
};

export type AppTextInputValidator = (text: string) => string | undefined;

export class AppTextInputValidators {
  mobilenumber = (message: string): AppTextInputValidator => {
    return (text: string) => {
      if (!validatorutil.mobilenumber(text)) {
        return message;
      }
    };
  };
  pincode = (message: string): AppTextInputValidator => {
    return (text: string) => {
      if (!validatorutil.pincode(text)) {
        return message;
      }
    };
  };
  otp = (message: string): AppTextInputValidator => {
    return (text: string) => {
      if (!validatorutil.otp(text)) {
        return message;
      }
    };
  };
  required = (): AppTextInputValidator => {
    return (text: string) => {
      if (validatorutil.required(text)) {
        return 'Required';
      }
    };
  };
}
export const apptextinputvalidators = new AppTextInputValidators();
