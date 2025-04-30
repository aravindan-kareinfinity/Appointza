import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HomeScreen} from './screens/home/home.screen';
import {$} from './styles';
import {CustomIcon, CustomIcons} from './components/customicons.component';
import {AppView} from './components/appview.component';
import {AccountScreen} from './screens/account/account.screen';
import {TouchableOpacity} from 'react-native';
import {ChatScreen} from './screens/chat/chat.screen';
import {GroupScreen} from './screens/group/group.screen';
import {ServiceAvailableScreen} from './screens/servicesavailable/service.screen';
import {ServiceScreen} from './screens/events/servicelist.screen';
import {DashboardScreen} from './screens/dashboard/dashboard.screen';
import { UserAppoinmentScreen } from './screens/userappointment/userappointment.screen';
import { useAppSelector } from './redux/hooks.redux';
import { selectiscustomer } from './redux/iscustomer.redux';
import { BussinessAppoinmentScreen } from './screens/bussinessappoinment/bussinessappoinment.screen';

export type HomeTabParamList = {
  Home: undefined;
  Chat: undefined;
  Account: undefined;
  // Group: undefined;
  Service: undefined;
  Dashboard: undefined;
  UserAppoinment:undefined;
  BussinessAppoinment:undefined
};
const HomeTab = createBottomTabNavigator<HomeTabParamList>();
function HomeTabNavigation() {
    const usercontext = useAppSelector(selectiscustomer);
  return (
    <HomeTab.Navigator
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
      initialRouteName="Service"
      screenOptions={{
        headerShown: false,
      }}>
      {/* <HomeTab.Screen
        name="Group"
        component={GroupScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} icon={CustomIcons.Account} />
          ),
        }}
      /> */}

<HomeTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} icon={CustomIcons.Diagram} />
          ),
        }}
      />
      <HomeTab.Screen
        name="Service"
        component={ServiceScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} icon={CustomIcons.Shop} />
          ),
        }}
      />

{usercontext.isCustomer  &&  <HomeTab.Screen
        name="UserAppoinment"
        component={UserAppoinmentScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} icon={CustomIcons.Clock} />
          ),
        }}
      />}

{!usercontext.isCustomer  && <HomeTab.Screen
        name="BussinessAppoinment"
        component={BussinessAppoinmentScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} icon={CustomIcons.Clock} />
          ),
        }}
      />}
      <HomeTab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} icon={CustomIcons.Account} />
          ),
        }}
      />

  
    </HomeTab.Navigator>
  );
}

const TabBarIcon = (props: {focused: boolean; icon: CustomIcons}) => {
  return (
    <AppView style={[$.align_items_center, $.justify_content_center]}>
      <CustomIcon
        name={props.icon}
        color={props.focused ? $.tint_3 : $.tint_1}
        size={$.s_big}
        stroke={3}
      />
    </AppView>
  );
};
export {HomeTabNavigation};
