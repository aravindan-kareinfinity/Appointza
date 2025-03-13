import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import { CompositeScreenProps, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../appstack.navigation';
import { AppView } from '../../components/appview.component';
import { $ } from '../../styles';
import { Alert, FlatList, Image, Modal, Platform, ScrollView, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { AppText } from '../../components/apptext.component';
import { CustomIcon, CustomIcons } from '../../components/customicons.component';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppTextInput } from '../../components/apptextinput.component';
import { AppButton } from '../../components/appbutton.component';
import { UsersService } from '../../services/users.service';
import { Users, UsersContext, UsersLoginReq, UsersSelectReq } from '../../models/users.model';
import { OrganisationLocation, OrganisationLocationSelectReq } from '../../models/organisationlocation.model';
import { OrganisationLocationService } from '../../services/organisationlocation.service';
import { AppSingleSelect } from '../../components/appsingleselect.component';
import { useAppSelector } from '../../redux/hooks.redux';
import { selectusercontext } from '../../redux/usercontext.redux';
import { StaffService } from '../../services/staff.service';
import { Staff, StaffSelectReq, StaffUser } from '../../models/staff.model';
import { AppSwitch } from '../../components/appswitch.component';
import { environment } from '../../utils/environment';

type AddedAccountsScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'AddedAccounts'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function AddedAccountsScreen() {
  const navigation = useNavigation<AddedAccountsScreenProp['navigation']>();
  const usercontext = useAppSelector(selectusercontext);
  const [stafflist, SetStafflist] = useState<StaffUser[]>([])

  const staffservice = useMemo(() => new StaffService(), [],);

  const getdata = async () => {
    var req = new StaffSelectReq()
    var res = await staffservice.SelectStaffDetail(req)
    if (res) {
      SetStafflist(res)
    }

  }

  useFocusEffect(
    useCallback(() => {
      getdata()
    }, [])
  );
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

        <FlatList
          data={stafflist}
          style={[$.pt_compact]}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                style={[$.p_compact]}
                onPress={() => {
                  
                }}>
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
                        {item.name}
                      </AppText>
                    </AppView>
                    <AppView style={[$.flex_row, $.align_items_center]}>
                      <AppText style={[$.fs_extrasmall, $.fw_regular, $.text_tint_6]}>
                        {item.city}
                      </AppText>
                      <CustomIcon
                        name={CustomIcons.Dot}
                        size={$.s_big}
                        color={$.tint_8}
                      />
                      <AppText style={[$.fs_extrasmall, $.fw_regular, $.text_tint_6]}>
                        {item.country}
                      </AppText>
                    </AppView>
                  </AppView>
                </AppView>
              </TouchableOpacity>
            );
          }}
        />

      </AppView>
    </ScrollView>
  );
}
