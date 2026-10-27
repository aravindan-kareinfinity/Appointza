import Icon from 'react-native-vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SavedPlacesScreen from '../screens/saved/SavedPlacesScreen';
import TripNavigator from './TripNavigator';
import RideEstimateScreen from '../screens/ride/RideEstimateScreen';
import TrackNavigator from './TrackNavigator';
import AccountNavigator from './AccountNavigator';
import type { MainTabParamList } from '../types/navigation';
import { ROUTES } from '../constants/routes';
import { COLORS } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          if (route.name === ROUTES.tabs.tracking) {
            iconName = focused ? 'navigate' : 'navigate-outline';
          } else if (route.name === ROUTES.tabs.rideEstimate) {
            iconName = focused ? 'bus' : 'bus-outline';
          } else if (route.name === ROUTES.tabs.trip) {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === ROUTES.tabs.saved) {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === ROUTES.tabs.account) {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 5 + insets.bottom,
          paddingTop: 5,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 0,
        },
      })}
    >
      <Tab.Screen
        name={ROUTES.tabs.tracking}
        component={TrackNavigator}
        options={{ tabBarLabel: 'Track' }}
      />
      <Tab.Screen
        name={ROUTES.tabs.rideEstimate}
        component={RideEstimateScreen}
        options={{ tabBarLabel: 'Rides' }}
      />
      <Tab.Screen
        name={ROUTES.tabs.trip}
        component={TripNavigator}
        options={{ tabBarLabel: 'Trip' }}
      />
      <Tab.Screen
        name={ROUTES.tabs.saved}
        component={SavedPlacesScreen}
        options={{ tabBarLabel: 'Saved' }}
      />
      <Tab.Screen
        name={ROUTES.tabs.account}
        component={AccountNavigator}
        options={{ tabBarLabel: 'Account' }}
      />
    </Tab.Navigator>
  );
}
