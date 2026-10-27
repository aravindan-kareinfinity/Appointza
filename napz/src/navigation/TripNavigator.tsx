import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TripPlannerScreen from '../screens/trip/TripPlannerScreen';
import TripItineraryScreen from '../screens/trip/TripItineraryScreen';
import MyTripsScreen from '../screens/trip/MyTripsScreen';
import { TripSessionProvider } from '../screens/trip/TripSession';
import type { TripStackParamList } from '../types/navigation';
import { ROUTES } from '../constants/routes';

const Stack = createNativeStackNavigator<TripStackParamList>();

export default function TripNavigator() {
  return (
    <TripSessionProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={ROUTES.trip.planner} component={TripPlannerScreen} />
        <Stack.Screen name={ROUTES.trip.itinerary} component={TripItineraryScreen} />
        <Stack.Screen name={ROUTES.trip.mine} component={MyTripsScreen} />
      </Stack.Navigator>
    </TripSessionProvider>
  );
}
