import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  Keyboard,
} from 'react-native';
import { Colors } from '../constants/colors';

interface OTPInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
  style?: ViewStyle;
}

export function OTPInput({
  value,
  onChangeText,
  length = 6,
  style,
}: OTPInputProps) {
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChangeText = (text: string, index: number) => {
    const newValue = value.split('');
    newValue[index] = text;
    const finalValue = newValue.join('');

    onChangeText(finalValue);

    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            ref={ref => {
              if (ref) {
                inputRefs.current[index] = ref;
              }
            }}
            style={styles.input}
            maxLength={1}
            keyboardType="number-pad"
            value={value[index] || ''}
            onChangeText={text => handleChangeText(text, index)}
            onKeyPress={e => handleKeyPress(e, index)}
            selectTextOnFocus
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    backgroundColor: Colors.light.inputBackground,
    color: Colors.light.text,
  },
}); 