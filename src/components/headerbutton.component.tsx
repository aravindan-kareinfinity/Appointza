import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Colors } from '../constants/colors';

interface HeaderButtonProps {
  title?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function HeaderButton({
  title,
  icon,
  onPress,
  style,
  textStyle,
}: HeaderButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {icon}
      {title && <Text style={[styles.text, textStyle]}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.primary,
  },
}); 