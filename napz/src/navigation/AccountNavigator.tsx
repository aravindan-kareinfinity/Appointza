import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AccountScreen from '../screens/account/AccountScreen';
import AboutScreen from '../screens/account/AboutScreen';
import SubscriptionScreen from '../screens/account/SubscriptionScreen';
import SoundsScreen from '../screens/account/SoundsScreen';
import PrivacyPolicyScreen from '../screens/account/PrivacyPolicyScreen';
import UpgradeScreen from '../screens/account/UpgradeScreen';
import type { AccountStackParamList } from '../types/navigation';
import { ROUTES } from '../constants/routes';
import { COLORS } from '../theme';

const Stack = createNativeStackNavigator<AccountStackParamList>();

export default function AccountNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      } as any}
    >
      <Stack.Screen name={ROUTES.account.home} component={AccountScreen} />
      <Stack.Screen name={ROUTES.account.about} component={AboutScreen} />
      <Stack.Screen name={ROUTES.account.subscription} component={SubscriptionScreen} />
      <Stack.Screen name={ROUTES.account.sounds} component={SoundsScreen} />
      <Stack.Screen name={ROUTES.account.privacyPolicy} component={PrivacyPolicyScreen} />
      <Stack.Screen name={ROUTES.account.upgrade} component={UpgradeScreen} />
    </Stack.Navigator>
  );
}
