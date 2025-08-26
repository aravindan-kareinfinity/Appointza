import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HomeScreen} from './screens/home/home.screen';
import {$} from './styles';
import {AppView} from './components/appview.component';
import {AccountScreen} from './screens/account/account.screen';
import {TouchableOpacity} from 'react-native';
import {ChatScreen} from './screens/chat/chat.screen';
import {ServiceAvailableScreen} from './screens/servicesavailable/service.screen';
import {ServiceScreen} from './screens/events/servicelist.screen';
import {BussinessDashboardScreen} from './screens/bussinessdashboard/bussinessdashboard.screen';
import {UserAppoinmentScreen} from './screens/userappointment/userappointment.screen';
import {useAppSelector} from './redux/hooks.redux';
import {selectiscustomer} from './redux/iscustomer.redux';
import {BussinessAppoinmentScreen} from './screens/bussinessappoinment/bussinessappoinment.screen';
import { UserDashboardScreen } from './screens/userdashboard/userdashboard.screen';
import { LucideIcon, LucideIcons } from './components/LucideIcons.component';
import { DefaultColor } from './styles/default-color.style';
import { useSelector } from 'react-redux';

export type HomeTabParamList = {
  Home: undefined;
  Chat: undefined;
  Account: undefined;
  // Group: undefined;
  Service: undefined;
  UserDashboard: undefined;
  BussinessDashboard: undefined;
  UserAppoinment: undefined;
  BussinessAppoinment: undefined;
};

const HomeTab = createBottomTabNavigator<HomeTabParamList>();
const colors = DefaultColor.instance;

function HomeTabNavigation() {
  const isCustomer = useSelector(selectiscustomer).isCustomer;
  const isLoggedIn = useSelector(selectiscustomer).isLoggedIn;
  
  // Debug logging
  console.log('HomeTab Navigation Debug:', {
    isCustomer,
    isLoggedIn,
    initialRoute: isLoggedIn ? (isCustomer ? "UserDashboard" : "BussinessDashboard") : "Service"
  });
  
  return (
    <HomeTab.Navigator
      key={`${isLoggedIn}-${isCustomer}`} // Force re-render when login status changes
      tabBar={({state, descriptors, navigation}) => {
        return (
          <AppView style={[$.flex_row, {height: 50}]}>
            {state.routes.map((route, index) => {
              const {options} = descriptors[route.key];
              const label = options.title;
              const isFocused = state.index === index;
              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              return (
                <TouchableOpacity
                  key={index}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={[$.flex_1, $.p_compact]}>
                  {options.tabBarIcon &&
                    options.tabBarIcon({
                      focused: isFocused,
                      color: '',
                      size: 0,
                    })}
                </TouchableOpacity>
              );
            })}
          </AppView>
        );
      }}
      initialRouteName={isLoggedIn ? (isCustomer ? "UserDashboard" : "BussinessDashboard") : "Service"}
      screenOptions={{
        headerShown: false,
      }}>
      
      {/* Service Screen - Show for everyone EXCEPT when logged in as business */}
      {!(isLoggedIn && !isCustomer) && (
        <HomeTab.Screen
          name="Service"
          component={ServiceScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <TabBarIcon focused={focused} icon={LucideIcons.Settings} />
            ),
          }}
        />
      )}

      {/* Customer Screens - Only when logged in as customer */}
      {isLoggedIn && isCustomer && (
        <>
          <HomeTab.Screen
            name="UserDashboard"
            component={UserDashboardScreen}
            options={{
              tabBarIcon: ({focused}) => (
                <TabBarIcon focused={focused} icon={LucideIcons.BarChart2} />
              ),
            }}
          />
          <HomeTab.Screen
            name="UserAppoinment"
            component={UserAppoinmentScreen}
            options={{
              tabBarIcon: ({focused}) => (
                <TabBarIcon focused={focused} icon={LucideIcons.Calendar} />
              ),
            }}
          />
        </>
      )}

      {/* Business Screens - Only when logged in as organization */}
      {isLoggedIn && !isCustomer && (
        <>
          <HomeTab.Screen
            name="BussinessDashboard"
            component={BussinessDashboardScreen}
            options={{
              tabBarIcon: ({focused}) => (
                <TabBarIcon focused={focused} icon={LucideIcons.BarChart2} />
              ),
            }}
          />
          <HomeTab.Screen
            name="BussinessAppoinment"
            component={BussinessAppoinmentScreen}
            options={{
              tabBarIcon: ({focused}) => (
                <TabBarIcon focused={focused} icon={LucideIcons.Calendar} />
              ),
            }}
          />
        </>
      )}

      {/* Account Screen - Always visible */}
      <HomeTab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} icon={LucideIcons.User} />
          ),
        }}
      />
    </HomeTab.Navigator>
  );
}

const TabBarIcon = (props: {focused: boolean; icon: LucideIcons}) => {
  return (
    <AppView style={[$.align_items_center, $.justify_content_center]}>
      <LucideIcon
        name={props.icon}
        color={props.focused ? colors.tint_1 : colors.tint_3}
        size={24}
        stroke={2}
      />
    </AppView>
  );
};
export {HomeTabNavigation};
