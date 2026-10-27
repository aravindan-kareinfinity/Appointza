import { View, Text, Image, StyleSheet, type ViewStyle } from 'react-native';
import { BRAND_NAVY } from '../../constants/branding';

const LOGO = require('../../assets/images/napz.png');

type Props = {
  /** Logo image max width/height (square, contain). */
  logoSize?: number;
  wordmarkSize?: 'large' | 'medium' | 'small';
  layout?: 'row' | 'column';
  /** If false, only the image (use when artwork already includes the wordmark). */
  showWordmark?: boolean;
  style?: ViewStyle;
};

export function AppWordmark({ size = 'large' }: { size?: 'large' | 'medium' | 'small' }) {
  const fontSize = size === 'large' ? 26 : size === 'medium' ? 20 : 16;
  return (
    <Text style={[styles.wordmarkBase, { fontSize, color: BRAND_NAVY }]}>
      napz
    </Text>
  );
}

export function AppLogoImage({
  width,
  height,
}: {
  width: number;
  height?: number;
}) {
  return (
    <Image
      accessibilityLabel="napz"
      source={LOGO}
      style={{ width, height: height ?? width, resizeMode: 'contain' }}
    />
  );
}

/** napz logo (PNG) and optional wordmark. */
export function AppBranding({
  logoSize = 88,
  wordmarkSize = 'large',
  layout = 'column',
  showWordmark = true,
  style,
}: Props) {
  const inner = (
    <>
      <Image accessibilityLabel="napz" source={LOGO} style={{ width: logoSize, height: logoSize, resizeMode: 'contain' }} />
      {showWordmark ? <AppWordmark size={wordmarkSize} /> : null}
    </>
  );

  if (layout === 'row') {
    return <View style={[styles.row, style]}>{inner}</View>;
  }
  return <View style={[styles.column, style]}>{inner}</View>;
}

const styles = StyleSheet.create({
  column: { alignItems: 'center', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordmarkBase: { textAlign: 'center', fontWeight: '800' },
});
