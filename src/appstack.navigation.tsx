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
import {AppoinmentScreen} from './screens/appoinment/appoinment.screen';
import { useAppSelector } from './redux/hooks.redux';
import { selectTheme } from './redux/theme.redux';
import { DefaultColor } from './styles/default-color.style';
import { ServiceAvailableScreen } from './screens/servicesavailable/service.screen';
import { TimingScreen } from './screens/timing/timing.screen';
import { AppoinmentFixingScreen } from './screens/appoinmentfixing/appoinmentfixing.screen';

const AppStack = createNativeStackNavigator<AppStackParamList>();

export type AppStackParamList = {
  Launch: undefined;
  SignUp: {isorganization:boolean};
  HomeTab: undefined;
  Login: undefined;
  Organisation: undefined;
  Location: {id:number};
  AddedAccounts: undefined;
  ProfileConfiguration: undefined;

  AddedAccountsDetails: undefined;
  Sort: undefined;
 
  Settings: undefined;
  Profile: undefined;

  ServiceAvailable:undefined
  Timing:undefined
  AppoinmentFixing:{organisationid:number,organisationlocationid:number}
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
          name="HomeTab"
          component={HomeTabNavigation}
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
          name="ServiceAvailable"
          component={ServiceAvailableScreen}
          options={{
            headerShown: false,
          }}
        />
         <AppStack.Screen
          name="Timing"
          component={TimingScreen}
          options={{
            headerShown: false,
          }}
        />
        <AppStack.Screen
          name="AppoinmentFixing"
          component={AppoinmentFixingScreen}
          options={{
            headerShown: false,
          }}
        />

    
  
       
  
      </AppStack.Navigator>
    </NavigationContainer>
  );
}

export {AppStackNavigation};
