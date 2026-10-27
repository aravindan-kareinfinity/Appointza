import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { TOKENS } from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityHint,
  testID,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? TOKENS.color.onAccent : TOKENS.color.accent} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.labelOnAccent,
            variant !== 'primary' && styles.labelAccent,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: TOKENS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: TOKENS.space.md,
  },
  primary: { backgroundColor: TOKENS.color.accent },
  secondary: {
    backgroundColor: TOKENS.color.surface,
    borderWidth: 1.5,
    borderColor: TOKENS.color.accent,
  },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.88 },
  label: { fontSize: 15, fontWeight: '800' },
  labelOnAccent: { color: TOKENS.color.onAccent },
  labelAccent: { color: TOKENS.color.accent },
});
