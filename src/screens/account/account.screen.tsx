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
  Image,
  Platform,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import {useAppDispatch, useAppSelector} from '../../redux/hooks.redux';
import {
  selectusercontext,
  usercontextactions,
} from '../../redux/usercontext.redux';
import {useEffect, useState} from 'react';
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

  return (
    <AppView style={[$.pt_medium, $.bg_tint_11, $.flex_1]}>
      {/* {usercontext && usercontext.value.userid > 0 && 
      <AppView style={[ $.flex_row,$.border_rounded ,$.bg_tint_11 ,$.m_small,$.mb_big,
        Platform.OS === 'android' ? $.elevation_5 : {shadowOpacity:0.4, },
      ]}>

        <Image
          style={{ borderRadius: 40, width: 80, height: 80 }}
          source={{
            uri: 'https://s3-alpha-sig.figma.com/img/6a98/e81b/28b333039b432776eb354412dfc36db6?Expires=1736121600&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=RM4xqC9wBX~AFmwoHy9bjm4RGSkMyAwhum3dWECBjW83kdSUAcFWix1EBG8iPS4CByrsDBs9z3Z0mo8stq-4d0SR4ifUZxsk4jL2dbTlwzzzD2ZVe1XEN1p05yGxz~LJj6ogrwtH36B1DN6ZsSCxCxxPmaQ-DhKfDnceXQhweJEM3s8vt6hzpOC9dXx5cwp5DJmAdEK~tTVXxUQuYbqZX9SnQoqx27RVftTc9c~WtCA4rxHoRPtAZuINO2-ptdRUhGLpt1fjc~vWmoWrUFiUQx2SEPm4y2WLM1lCQYfTguig6nomt0DwcgIG6q8gVAdEnboMTbyh5tlDRXMv3s46VA__',
          }}></Image>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <AppView
            style={[
              $.bg_tint_5,
              $.p_tiny,
              $.align_items_center,
              $.justify_content_center,
              { position: 'absolute', bottom: 0, right: 0, borderRadius: 25 },
            ]}>
            <CustomIcon
              color={$.tint_11}
              name={CustomIcons.Camera2}
              size={$.s_regular}
            />
          </AppView>
        </TouchableOpacity>
        <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
          <AppText
            style={[$.fs_small, $.fw_semibold, $.text_tint_2, $.mb_extrasmall]}>
         {usercontext.value.username }
          </AppText>
          <AppText style={[$.fs_small, $.fw_regular, $.text_tint_3]}>
            {usercontext.value.organisationname }
          </AppText>
        </AppView>
      </AppView>
      } */}

      <AppView style={[$.px_normal, $.justify_content_center]}>
        <AppText
          style={[$.fs_big, $.fw_semibold, $.text_primary5, $.mb_extrasmall]}>
          {usercontext.value.username}
        </AppText>
        {usercontext.value.organisationname.length > 0 && (
          <AppText style={[$.fs_compact, $.fw_regular, $.text_primary5]}>
            {usercontext.value.organisationname}
          </AppText>
        )}
      </AppView>

      {usercontext && usercontext.value.organisationid > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('ServiceAvailable')}
          style={[
            $.flex_row,
            $.align_items_center,
            $.justify_content_center,
            $.align_items_center,
            $.p_medium,
          ]}>
          <CustomIcon
            color={$.tint_primary_5}
            name={CustomIcons.Shop}
            size={$.s_normal}
          />

          <AppText
            style={[
              $.fs_compact,
              $.flex_1,
              $.fw_light,
              $.text_primary5,
              $.px_normal,
              $.justify_content_center,
              $.flex_1,
            ]}>
            services
          </AppText>

          <AppView style={[$.justify_content_center]}>
            <CustomIcon
              color={$.tint_primary_5}
              name={CustomIcons.RightChevron}
              size={$.s_small}
            />
          </AppView>
        </TouchableOpacity>
      )}
      {usercontext && usercontext.value.organisationid > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Organisation')}
          style={[
            $.flex_row,
            $.align_items_center,

            ,
            $.justify_content_center,
            $.align_items_center,
            $.p_medium,
          ]}>
          <CustomIcon
            color={$.tint_primary_5}
            name={CustomIcons.Shop}
            size={$.s_normal}
          />

          <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
            <AppText style={[$.fs_compact, $.fw_light, $.text_primary5]}>
              Organisation
            </AppText>
          </AppView>
          <AppView style={[$.justify_content_center]}>
            <CustomIcon
              color={$.tint_primary_5}
              name={CustomIcons.RightChevron}
              size={$.s_small}
            />
          </AppView>
        </TouchableOpacity>
      )}
      {usercontext && usercontext.value.userid > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={[
            $.flex_row,
            $.align_items_center,

            ,
            $.justify_content_center,
            $.align_items_center,
            $.p_medium,
          ]}>
          <CustomIcon
            color={$.tint_primary_5}
            name={CustomIcons.Account}
            size={$.s_normal}
          />
          <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
            <AppText style={[$.fs_compact, $.fw_light, $.text_primary5]}>
              Profile
            </AppText>
          </AppView>
          <AppView style={[$.justify_content_center]}>
            <CustomIcon
              color={$.tint_primary_5}
              name={CustomIcons.RightChevron}
              size={$.s_small}
            />
          </AppView>
        </TouchableOpacity>
      )}

      {usercontext && usercontext.value.organisationid > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Timing')}
          style={[
            $.flex_row,
            $.align_items_center,

            ,
            $.justify_content_center,
            $.align_items_center,
            $.p_medium,
          ]}>
          <CustomIcon
            color={$.tint_primary_5}
            name={CustomIcons.Shop}
            size={$.s_normal}
          />
          <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
            <AppText style={[$.fs_compact, $.fw_light, $.text_primary5]}>
              services timing
            </AppText>
          </AppView>
          <AppView style={[$.justify_content_center]}>
            <CustomIcon
              color={$.tint_primary_5}
              name={CustomIcons.RightChevron}
              size={$.s_small}
            />
          </AppView>
        </TouchableOpacity>
      )}

      {usercontext && usercontext.value.organisationid > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('AddedAccounts')}
          style={[
            $.flex_row,
            $.align_items_center,

            ,
            $.justify_content_center,
            $.align_items_center,
            $.p_medium,
          ]}>
          <CustomIcon
            color={$.tint_primary_5}
            name={CustomIcons.AddAccount}
            size={$.s_normal}
          />
          <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
            <AppText style={[$.fs_compact, $.fw_light, $.text_primary5]}>
              Add staff
            </AppText>
          </AppView>
          <AppView style={[$.justify_content_center]}>
            <CustomIcon
              color={$.tint_primary_5}
              name={CustomIcons.RightChevron}
              size={$.s_tiny}
            />
          </AppView>
        </TouchableOpacity>
      )}

      {usercontext && usercontext.value.userid == 0 && (
        <TouchableOpacity
          onPress={() => gotoSignUp(false)}
          style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_large]}>
          <CustomIcon
            color={$.tint_primary_5}
            name={CustomIcons.AddAccount}
            size={$.s_normal}
          />
          <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
            <AppText style={[$.fs_compact, $.fw_light, $.text_primary5]}>
              Signup as user
            </AppText>
          </AppView>
          <AppView style={[$.justify_content_center]}>
            <CustomIcon
              color={$.tint_primary_5}
              name={CustomIcons.RightChevron}
              size={$.s_small}
            />
          </AppView>
        </TouchableOpacity>
      )}

      {usercontext && usercontext.value.userid == 0 && (
        <TouchableOpacity
          onPress={() => gotoSignUp(true)}
          style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_large]}>
          <CustomIcon
            color={$.tint_primary_5}
            name={CustomIcons.Shop}
            size={$.s_normal}
          />
          <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
            <AppText style={[$.fs_compact, $.fw_light, $.text_primary5]}>
              Signup as Business
            </AppText>
          </AppView>
          <AppView style={[$.justify_content_center]}>
            <CustomIcon
              color={$.tint_primary_5}
              name={CustomIcons.RightChevron}
              size={$.s_small}
            />
          </AppView>
        </TouchableOpacity>
      )}

      {usercontext && usercontext.value.userid == 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_large]}>
          <CustomIcon
            color={$.tint_primary_5}
            name={CustomIcons.Shop}
            size={$.s_normal}
          />
          <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
            <AppText style={[$.fs_compact, $.fw_light, $.text_primary5]}>
              Login
            </AppText>
          </AppView>
          <AppView style={[$.justify_content_center]}>
            <CustomIcon
              color={$.tint_primary_5}
              name={CustomIcons.RightChevron}
              size={$.s_small}
            />
          </AppView>
        </TouchableOpacity>
      )}

      {usercontext && usercontext.value.userid > 0 && (
        <TouchableOpacity
          onPress={() => {
            logout();
          }}
          style={[
            $.flex_row,
            $.align_items_center,

            ,
            $.justify_content_center,
            $.align_items_center,
            $.p_medium,
          ]}>
          <CustomIcon
            color={$.tint_primary_5}
            name={CustomIcons.Logout}
            size={$.s_normal}
          />
          <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
            <AppText style={[$.fs_compact, $.fw_regular, $.text_tint_2]}>
              Logout
            </AppText>
          </AppView>
        </TouchableOpacity>
      )}
    </AppView>
  );
}
