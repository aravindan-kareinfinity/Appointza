import {
  DefaultTheme,
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeTabNavigation} from './hometab.navigation';
import {LaunchScreen} from './screens/launch/launch.screen';
import {$} from './styles';
import {LoginScreen} from './screens/login/login.screen';
import {HeaderTitle} from './components/headertitle.component';
import {AddedAccountsScreen} from './screens/addedaccounts/addedaccounts.screen';
import {AddedAccountsDetailsScreen} from './screens/addedaccountsdetails/addedaccountsdetails.screen';
import {LocationScreen} from './screens/addlocation/addlocation.screen';
import {OrganisationScreen} from './screens/organisation/organisation.screen';
import {ProfileScreen} from './screens/profile/profile.screen';
import {SignUpScreen} from './screens/signup/signup.screen';
import React, {createRef} from 'react';
import {NotificationScreen} from './screens/notification/notification.screen';
import {AppoinmentScreen} from './screens/appoinment/appoinment.screen';
import { useAppSelector } from './redux/hooks.redux';
import { selectTheme } from './redux/theme.redux';
import { DefaultColor } from './styles/default-color.style';

const AppStack = createNativeStackNavigator<AppStackParamList>();

export type AppStackParamList = {
  Launch: undefined;
  SignUp: undefined;
  HomeTab: undefined;
  Login: undefined;
  Organisation: undefined;
  Location: {id:number};
  CreateDesign: undefined;
  AddedAccounts: undefined;
  ProfileConfiguration: undefined;
  NewPost: undefined;
  CreateCatalogue: undefined;
  AddToCatalogue: undefined;
  AddedAccountsDetails: undefined;
  DesignList: {
    productid: number;
  };
  Sort: undefined;
  Broadcast: undefined;
  OrdersDetail: {
    orderid: number;
  };
  Settings: undefined;
  IndividualChat: undefined;
  Profile: undefined;
  InvitePeople: undefined;
  PostSelection: undefined;
 MergeDesign: {
    designid?: number;
  };
  Notification: undefined;
  DesignDetail: {
    designid: number;
  };
};
const colors = DefaultColor.instance.colors;
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.tint_11,
    primary: colors.tint_1,
  },
};
export const navigationRef =
  createRef<NavigationContainerRef<AppStackParamList>>();

export function navigate(name: any, params?: any) {
  navigationRef.current?.navigate(name, params);
}

function AppStackNavigation() {
  return (
    <NavigationContainer ref={navigationRef} theme={AppTheme}>
      <AppStack.Navigator
        initialRouteName="Launch"
        screenOptions={{
          headerStyle: {
            backgroundColor: $.tint_11,
          },
          headerTitleAlign: 'center',
          headerTitle: ({children}) => <HeaderTitle>{children}</HeaderTitle>,
        }}>
        <AppStack.Screen
          name="Launch"
          component={LaunchScreen}
          options={{
            headerShown: false,
          }}
        />
        <AppStack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />
        <AppStack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{
            headerShown: false,
          }}
        />
        <AppStack.Screen
          name="AddedAccounts"
          component={AddedAccountsScreen}
          options={{
            headerShown: false,
          }}
        />
        <AppStack.Screen
          name="AddedAccountsDetails"
          component={AddedAccountsDetailsScreen}
          options={{
            headerShown: false,
          }}
        />
        {/* <AppStack.Screen
          name="OrdersDetail"
          component={OrdersDetailScreen}
          options={{
            headerShown: false,
          }}
        /> */}
        <AppStack.Screen
          name="Organisation"
          component={OrganisationScreen}
          options={{
            headerShown: false,
          }}
        />
        <AppStack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: false,
          }}
        />
        <AppStack.Screen
          name="Location"
          component={LocationScreen}
          options={{
            headerShown: false,
          }}
        />

        <AppStack.Screen
          name="HomeTab"
          component={HomeTabNavigation}
          options={{
            headerShown: false,
          }}
        />
  
       
    
   
        <AppStack.Screen
          name="Notification"
          component={NotificationScreen}
          options={{
            headerShown: false,
          }}
        />
     
      </AppStack.Navigator>
    </NavigationContainer>
  );
}

export {AppStackNavigation};
