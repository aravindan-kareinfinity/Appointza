import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HomeScreen} from './screens/home/home.screen';
import {$} from './styles';
import {CustomIcon, CustomIcons} from './components/customicons.component';
import {AppView} from './components/appview.component';
import {AccountScreen} from './screens/account/account.screen';
import {TouchableOpacity} from 'react-native';
import {ChatScreen} from './screens/chat/chat.screen';
import {GroupScreen} from './screens/group/group.screen';
import {EventsScreen} from './screens/events/events.screen';
import {AppoinmentScreen} from './screens/appoinment/appoinment.screen';

export type HomeTabParamList = {
  Home: undefined;
  Chat: undefined;
  Account: undefined;
  Group: undefined;
  Events: undefined;
  Appoinment: undefined;
};
const HomeTab = createBottomTabNavigator<HomeTabParamList>();
function HomeTabNavigation() {
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
      initialRouteName="Group"
      screenOptions={{
        headerShown: false,
      }}>
      <HomeTab.Screen
        name="Group"
        component={GroupScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} icon={CustomIcons.Group} />
          ),
        }}
      />
      <HomeTab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} icon={CustomIcons.Events} />
          ),
        }}
      />
      <HomeTab.Screen
        name="Appoinment"
        component={AppoinmentScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} icon={CustomIcons.Chat} />
          ),
        }}
      />
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
        color={props.focused ? $.tint_1 : $.tint_7}
        size={$.s_big}
        stroke={3}
      />
    </AppView>
  );
};
export {HomeTabNavigation};
