import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GoogleAuthScreen from '../screens/auth/GoogleAuthScreen';
import MainTabNavigator from './MainTabNavigator';
import { MainLocationShell } from './MainLocationShell';
import type { RootStackParamList } from '../types/navigation';
import { ROUTES } from '../constants/routes';
import { COLORS } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainAppScreen() {
  return (
    <MainLocationShell>
      <MainTabNavigator />
    </MainLocationShell>
  );
}

type Props = {
  initialRouteName: keyof RootStackParamList;
};

export default function RootNavigator({ initialRouteName }: Props) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      } as any}
    >
      <Stack.Screen name={ROUTES.root.googleAuth} component={GoogleAuthScreen} />
      <Stack.Screen name={ROUTES.root.main} component={MainAppScreen} />
    </Stack.Navigator>
  );
}
