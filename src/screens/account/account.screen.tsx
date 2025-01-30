import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import { CompositeScreenProps, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../appstack.navigation';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { $ } from '../../styles';
import { CustomIcon, CustomIcons } from '../../components/customicons.component';
import { Button, FlatList, Image, TouchableOpacity, useColorScheme } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../redux/hooks.redux';
import { selectusercontext } from '../../redux/usercontext.redux';
import { useEffect, useState } from 'react';
import { DefaultColor, ThemeType } from '../../styles/default-color.style';
import { themeActions } from '../../redux/theme.redux';

type AccountScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Account'>,
  NativeStackScreenProps<AppStackParamList>
>;
export function AccountScreen() {
  const navigation = useNavigation<AccountScreenProp['navigation']>();

  const colors = DefaultColor.instance.colors;
  const usercontext = useAppSelector(selectusercontext);

  const gotoSignUp = (value: boolean) => {
    navigation.navigate('SignUp', { isorganization: value });
  };

  return (
    <AppView style={[$.pt_medium, $.flex_1]}>



      {usercontext && usercontext.value.userid > 0 && <AppView style={[$.px_normal, $.mb_normal, $.flex_row]}>

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
            Route 16 men's wear
          </AppText>
          <AppText style={[$.fs_small, $.fw_regular, $.text_tint_3]}>
            Manager name
          </AppText>
        </AppView>
      </AppView>}
      <AppView style={[$.px_normal, $.mb_normal, $.flex_row]}>
        <AppText style={[$.fs_enormous, $.fw_bold, $.text_tint_9, $.flex_1]}>
          Settings
        </AppText>
      </AppView>
      {usercontext && usercontext.value.organisationid > 0 && <TouchableOpacity
        onPress={() =>   navigation.navigate('ServiceAvailable')}
        style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_normal]}>
        <AppView style={[$.p_compact, $.bg_tint_10, { borderRadius: 30 }]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.Shop}
            size={$.s_normal}
          />
        </AppView>
        <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
          <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_2]}>
            services
          </AppText>
        </AppView>
        <AppView style={[$.justify_content_center]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.RightChevron}
            size={$.s_small}
          />
        </AppView>
      </TouchableOpacity>}
      {usercontext && usercontext.value.organisationid > 0 && <TouchableOpacity
        onPress={() => navigation.navigate('Organisation')}
        style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_normal]}>
        <AppView style={[$.p_compact, $.bg_tint_10, { borderRadius: 30 }]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.Shop}
            size={$.s_normal}
          />
        </AppView>
        <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
          <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_2]}>
            Organisation
          </AppText>
        </AppView>
        <AppView style={[$.justify_content_center]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.RightChevron}
            size={$.s_small}
          />
        </AppView>
      </TouchableOpacity>}
      {usercontext && usercontext.value.userid > 0 && <TouchableOpacity
        onPress={() => navigation.navigate('Profile')}
        style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_normal]}>
        <AppView style={[$.p_compact, $.bg_tint_10, { borderRadius: 30 }]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.Account}
            size={$.s_normal}
          />
        </AppView>
        <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
          <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_2]}>
            Profile
          </AppText>
        </AppView>
        <AppView style={[$.justify_content_center]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.RightChevron}
            size={$.s_small}
          />
        </AppView>
      </TouchableOpacity>}
      {usercontext && usercontext.value.organisationid > 0 && <TouchableOpacity
        onPress={() => navigation.navigate('AddedAccounts')}
        style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_large]}>
        <AppView style={[$.p_compact, $.bg_tint_10, { borderRadius: 30 }]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.AddAccount}
            size={$.s_normal}
          />
        </AppView>
        <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
          <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_2]}>
            Add staff
          </AppText>
        </AppView>
        <AppView style={[$.justify_content_center]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.RightChevron}
            size={$.s_small}
          />
        </AppView>
      </TouchableOpacity>}

      {usercontext && usercontext.value.organisationid == 0 && <TouchableOpacity
        onPress={() => gotoSignUp(true)}
        style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_large]}>
        <AppView style={[$.p_compact, $.bg_tint_10, { borderRadius: 30 }]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.AddAccount}
            size={$.s_normal}
          />
        </AppView>
        <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
          <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_2]}>
            Signup as user
          </AppText>
        </AppView>
        <AppView style={[$.justify_content_center]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.RightChevron}
            size={$.s_small}
          />
        </AppView>
      </TouchableOpacity>}

      {usercontext && usercontext.value.organisationid == 0 && <TouchableOpacity
        onPress={() => gotoSignUp(true)}
        style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_large]}>
        <AppView style={[$.p_compact, $.bg_tint_10, { borderRadius: 30 }]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.Shop}
            size={$.s_normal}
          />
        </AppView>
        <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
          <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_2]}>
            Signup as Business
          </AppText>
        </AppView>
        <AppView style={[$.justify_content_center]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.RightChevron}
            size={$.s_small}
          />
        </AppView>
      </TouchableOpacity>}

      {usercontext && usercontext.value.organisationid == 0 && <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_large]}>
        <AppView style={[$.p_compact, $.bg_tint_10, { borderRadius: 30 }]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.Shop}
            size={$.s_normal}
          />
        </AppView>
        <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
          <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_2]}>
            Login
          </AppText>
        </AppView>
        <AppView style={[$.justify_content_center]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.RightChevron}
            size={$.s_small}
          />
        </AppView>
      </TouchableOpacity>
      }

      {usercontext && usercontext.value.userid > 0 && <TouchableOpacity
        onPress={() => {

        }}
        style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_normal]}>
        <AppView style={[$.p_compact, $.bg_tint_10, { borderRadius: 30 }]}>
          <CustomIcon
            color={$.tint_6}
            name={CustomIcons.Logout}
            size={$.s_normal}
          />
        </AppView>
        <AppView style={[$.px_normal, $.justify_content_center, $.flex_1]}>
          <AppText style={[$.fs_compact, $.fw_regular, $.text_tint_2]}>
            Logout
          </AppText>
        </AppView>
      </TouchableOpacity>}
    </AppView>
  );
}
