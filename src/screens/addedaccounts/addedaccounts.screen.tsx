import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {CompositeScreenProps, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {AppView} from '../../components/appview.component';
import {$} from '../../styles';
import {Image, ScrollView, TouchableOpacity} from 'react-native';
import {AppText} from '../../components/apptext.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';

type AddedAccountsScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'AddedAccounts'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function AddedAccountsScreen() {
  const navigation = useNavigation<AddedAccountsScreenProp['navigation']>();
  return (
    <ScrollView>
      <AppView style={[$.pt_medium]}>
        <AppView
          style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_medium]}>
          <AppView style={[$.flex_row, $.flex_1, $.align_items_center]}>
            <TouchableOpacity
              onPress={() => {
                navigation.goBack();
              }}>
              <CustomIcon
                name={CustomIcons.LeftArrow}
                size={$.s_regular}
                color={$.tint_2}
              />
            </TouchableOpacity>
            <AppText
              style={[$.ml_compact, $.p_small, $.text_tint_2, $.fw_medium]}>
              Added Accounts
            </AppText>
          </AppView>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddedAccountsDetails')}>
            <CustomIcon
              name={CustomIcons.AddSquareRounded}
              color={$.tint_2}
              size={$.s_huge}></CustomIcon>
          </TouchableOpacity>
        </AppView>
        <AppView
          style={[$.px_normal, $.mb_normal, $.flex_row, $.align_items_center]}>
          <Image
            source={{
              uri: 'https://doodleipsum.com/700x700/avatar-2&n=1',
              width: 50,
              height: 50,
            }}></Image>
          <AppView style={[$.ml_normal]}>
            <AppView style={[$.flex_row]}>
              <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_2]}>
                Kamlesh
              </AppText>
            </AppView>
            <AppView style={[$.flex_row, $.align_items_center]}>
              <AppText style={[$.fs_extrasmall, $.fw_regular, $.text_tint_6]}>
                shared designs
              </AppText>
              <CustomIcon
                name={CustomIcons.Dot}
                size={$.s_big}
                color={$.tint_8}
              />
              <AppText style={[$.fs_extrasmall, $.fw_regular, $.text_tint_6]}>
                shared designs
              </AppText>
            </AppView>
          </AppView>
        </AppView>
        <AppView style={[$.px_normal, $.mb_normal, $.flex_row]}>
          <Image
            source={{
              uri: 'https://doodleipsum.com/700x700/avatar-2&n=2',
              width: 50,
              height: 50,
            }}></Image>
          <AppView style={[$.ml_normal, $.justify_content_center]}>
            <AppView style={[$.flex_row]}>
              <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_2]}>
                Route 16 men’s wear
              </AppText>
            </AppView>
            <AppView style={[$.flex_row, $.align_items_center]}>
              <AppText style={[$.fs_extrasmall, $.fw_regular, $.text_tint_6]}>
                shared designs
              </AppText>
              <CustomIcon
                name={CustomIcons.Dot}
                size={$.s_big}
                color={$.tint_8}
              />
              <AppText style={[$.fs_extrasmall, $.fw_regular, $.text_tint_6]}>
                shared designs
              </AppText>
            </AppView>
          </AppView>
        </AppView>
      </AppView>
    </ScrollView>
  );
}
