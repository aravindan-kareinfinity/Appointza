import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {CompositeScreenProps, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {
  Button,
  FlatList,
  GestureResponderEvent,
  Image,
  Platform,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import {useAppDispatch, useAppSelector} from '../../redux/hooks.redux';
import {
  selectusercontext,
  usercontextactions,
} from '../../redux/usercontext.redux';
import {JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useState} from 'react';
import {DefaultColor, ThemeType} from '../../styles/default-color.style';
import {themeActions} from '../../redux/theme.redux';
import {store} from '../../redux/store.redux';

type AccountScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Account'>,
  NativeStackScreenProps<AppStackParamList>
>;
export function AccountScreen() {
  const navigation = useNavigation<AccountScreenProp['navigation']>();

  const colors = DefaultColor.instance.colors;
  const usercontext = useAppSelector(selectusercontext);

  const gotoSignUp = (value: boolean) => {
    navigation.navigate('SignUp', {isorganization: value});
  };

  const logout = () => {
    store.dispatch(usercontextactions.clear());
  };

  const isLoggedIn = usercontext && usercontext.value.userid > 0;
  const hasBusiness = usercontext && usercontext.value.organisationid > 0;
  
  type MenuItem = {
    icon: CustomIcons;
    label: string;
    onPress: () => void;
    showChevron: boolean;
    isHighlighted?: boolean;
  };

  const menuItems: MenuItem[] = [
    // Business items
    ...(hasBusiness ? [
      {
        icon: CustomIcons.Shop,
        label: 'Services',
        onPress: () => navigation.navigate('ServiceAvailable'),
        showChevron: true,
      },
      {
        icon: CustomIcons.Supplier,
        label: 'Location',
        onPress: () => navigation.navigate('Organisation'),
        showChevron: true,
      },
      {
        icon: CustomIcons.Clock,
        label: 'Services Timing',
        onPress: () => navigation.navigate('Timing'),
        showChevron: true,
      },
      {
        icon: CustomIcons.AddAccount,
        label: 'Add Staff',
        onPress: () => navigation.navigate('AddedAccounts'),
        showChevron: true,
      },
    ] : []),
    
    // User items
    ...(isLoggedIn ? [
      {
        icon: CustomIcons.Account,
        label: 'Profile',
        onPress: () => navigation.navigate('Profile'),
        showChevron: true,
      },
      {
        icon: CustomIcons.Logout,
        label: 'Logout',
        onPress: () => logout(),
        showChevron: false,
        isHighlighted: true,
      },
    ] : [
      {
        icon: CustomIcons.AddAccount,
        label: 'Sign up as User',
        onPress: () => gotoSignUp(false),
        showChevron: true,
      },
      {
        icon: CustomIcons.Shop,
        label: 'Sign up as Business',
        onPress: () => gotoSignUp(true),
        showChevron: true,
      },
      {
        icon: CustomIcons.Account,
        label: 'Login',
        onPress: () => navigation.navigate('Login'),
        showChevron: true,
      },
    ]),
  ];

  const renderMenuItem = (item: any, index: any) => (
    <TouchableOpacity
      key={index}
      onPress={item.onPress}
      style={[
        $.flex_row,
        $.align_items_center,
        $.p_medium,
        $.border_bottom,
        $.border_tint_10,
        index === 0 && $.border_top,
      ]}>
      <CustomIcon
        color={$.tint_primary_5}
        name={item.icon}
        size={$.s_normal}
      />
      <AppText 
        style={[
          $.fs_compact, 
          $.px_normal, 
          $.flex_1,
          item.isHighlighted ? $.text_tint_2 : $.text_primary5,
          item.isHighlighted ? $.fw_regular : $.fw_light,
        ]}>
        {item.label}
      </AppText>
      {item.showChevron && (
        <CustomIcon
          color={$.tint_primary_5}
          name={CustomIcons.RightChevron}
          size={$.s_small}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[$.flex_1, $.bg_tint_11]}>
      {/* Profile Header */}
      <AppView style={[$.pt_medium, $.px_normal, $.pb_medium]}>
        {isLoggedIn && (
          <AppView style={[$.flex_row, $.align_items_center, $.mb_medium]}>
            <AppView style={[$.mr_medium]}>
              <Image
                style={{ 
                  borderRadius: 30, 
                  width: 60, 
                  height: 60,
                  borderWidth: 2,
                  borderColor: $.tint_10 
                }}
                source={{
                  uri: 'https://s3-alpha-sig.figma.com/img/6a98/e81b/28b333039b432776eb354412dfc36db6?Expires=1736121600&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=RM4xqC9wBX~AFmwoHy9bjm4RGSkMyAwhum3dWECBjW83kdSUAcFWix1EBG8iPS4CByrsDBs9z3Z0mo8stq-4d0SR4ifUZxsk4jL2dbTlwzzzD2ZVe1XEN1p05yGxz~LJj6ogrwtH36B1DN6ZsSCxCxxPmaQ-DhKfDnceXQhweJEM3s8vt6hzpOC9dXx5cwp5DJmAdEK~tTVXxUQuYbqZX9SnQoqx27RVftTc9c~WtCA4rxHoRPtAZuINO2-ptdRUhGLpt1fjc~vWmoWrUFiUQx2SEPm4y2WLM1lCQYfTguig6nomt0DwcgIG6q8gVAdEnboMTbyh5tlDRXMv3s46VA__',
                }}
              />
              <TouchableOpacity 
                onPress={() => navigation.navigate('Profile')}
                style={[
                  $.bg_tint_5,
                  $.p_tiny,
                  $.align_items_center,
                  $.justify_content_center,
                  { 
                    position: 'absolute', 
                    bottom: 0, 
                    right: 0, 
                    borderRadius: 15,
                    width: 24,
                    height: 24
                  },
                ]}>
                <CustomIcon
                  color={$.tint_11}
                  name={CustomIcons.Camera2}
                  size={14}
                />
              </TouchableOpacity>
            </AppView>
            
            <AppView style={[$.flex_1]}>
              <AppText style={[$.fs_big, $.fw_bold, $.text_primary5]}>
                {usercontext.value.username}
              </AppText>
              {usercontext.value.organisationname.length > 0 && (
                <AppText style={[$.fs_compact, $.text_primary5, $.mt_tiny, $.fw_regular]}>
                  {usercontext.value.organisationname}
                </AppText>
              )}
            </AppView>
          </AppView>
        )}
        
        {!isLoggedIn && (
          <AppView style={[$.py_large, $.align_items_center]}>
            <CustomIcon
              color={$.tint_primary_5}
              name={CustomIcons.Account}
              size={60}
            />
            <AppText style={[$.fs_big, $.fw_bold, $.text_primary5, $.mt_medium]}>
              Welcome
            </AppText>
            <AppText style={[$.fs_compact, $.text_tint_2, $.mt_tiny]}>
              Sign up or log in to continue
            </AppText>
          </AppView>
        )}
      </AppView>
      
      {/* Menu Section */}
      <AppView style={[$.bg_tint_11, $.mx_normal, $.border_rounded2, $.mb_large]}>
        {menuItems.map(renderMenuItem)}
      </AppView>
      
      {/* App Version */}
      <AppView style={[$.align_items_center, $.mb_large]}>
        <AppText style={[$.fs_extrasmall, $.text_tint_4]}>
          App Version 1.0.0
        </AppText>
      </AppView>
    </ScrollView>
  );
}
