import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GoogleAuthScreen from '../screens/auth/GoogleAuthScreen';
import type { RootStackParamList } from '../types/navigation';
import { ROUTES } from '../constants/routes';
import { COLORS } from '../theme';

const Stack = createNativeStackNavigator<Pick<RootStackParamList, 'GoogleAuth'>>();

/** Auth stack (extensible if more auth screens are added). */
export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      } as any}
    >
      <Stack.Screen name={ROUTES.root.googleAuth} component={GoogleAuthScreen} />
    </Stack.Navigator>
  );
}
