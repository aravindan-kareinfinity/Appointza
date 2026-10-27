import { Alert } from 'react-native';

type NavLike = {
  navigate: (name: string, params?: object) => void;
};

export function showUpgradePrompt(
  navigation: NavLike,
  message: string,
  title = 'Upgrade to Premium'
): void {
  Alert.alert(title, message, [
    { text: 'Not now', style: 'cancel' },
    {
      text: 'Upgrade',
      onPress: () => navigation.navigate('Account', { screen: 'Upgrade' }),
    },
  ]);
}
