import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/track/HomeScreen';
import AlarmScreen from '../screens/track/AlarmScreen';
import type { TrackStackParamList } from '../types/navigation';
import { ROUTES } from '../constants/routes';
import { COLORS } from '../theme';

const Stack = createNativeStackNavigator<TrackStackParamList>();

export default function TrackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      } as any}
    >
      <Stack.Screen name={ROUTES.track.home} component={HomeScreen} />
      <Stack.Screen
        name={ROUTES.track.alarm}
        component={AlarmScreen}
        options={{ contentStyle: { backgroundColor: COLORS.alarm } }}
      />
    </Stack.Navigator>
  );
}
