import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../appstack.navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { useAppDispatch, useAppSelector } from '../../redux/hooks.redux';
import { counteractions, selectcounter } from '../../redux/counter.redux';
import { AppButton } from '../../components/appbutton.component';
import { $ } from '../../styles';
import { AppTextInput } from '../../components/apptextinput.component';
import { CustomIcon, CustomIcons } from '../../components/customicons.component';
import { AppSwitch } from '../../components/appswitch.component';
import { FlatList, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Line } from 'react-native-svg';
import { AppAlert } from '../../components/appalert.component';
import { AppSingleSelect } from '../../components/appsingleselect.component';
import { FilesService } from '../../services/files.service';
import { OrganisationService } from '../../services/organisation.service';
import { OrganisationDetail, OrganisationSelectReq } from '../../models/organisation.model';

type EventsScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Events'>,
  NativeStackScreenProps<AppStackParamList>
>;
export function EventsScreen() {
  const navigation = useNavigation<EventsScreenProp['navigation']>();
  const [categoryid, setCategoryid] = useState(0);
  const [subcategoryid, setsubcategoryid] = useState(0);
  const [productid, setproductid] = useState(0);
  const [isloading, setIsloading] = useState(false);

  const filesservice = useMemo(() => new FilesService(), []);
  const Organizationlist = useMemo(() => new OrganisationService(), []);

  const [OrganisatonDetailList, setOrganisationDetailList] = useState<OrganisationDetail[]>([]);


  const getdata = async () => {
    try {
      var req = new OrganisationSelectReq();
      var res = await Organizationlist.SelectOrganisationDetail(req);
      if (res) {
        setOrganisationDetailList(res)
      }

    } catch {

    }
  }

  useEffect(() => {
    getdata()
  }, []);

  return (
    <ScrollView>
      <AppText style={[$.fs_enormous, $.fw_bold, $.flex_1, $.px_small, $.text_tint_9]}>
        Services
      </AppText>

      <FlatList
        data={OrganisatonDetailList}
        nestedScrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <AppView style={[$.m_small, $.border, $.p_small, $.border_rounded]}>
            <TouchableOpacity onPress={() => {navigation.navigate('AppoinmentFixing',{organisationid:item.organisationid,organisationlocationid:item.organisationlocationid}) }}>
              <AppText style={[$.fw_bold, $.mb_small]}>
                {item.organisationname}
              </AppText>

              <AppText style={[$.p_tiny, $.text_tint_2]}>
                <AppText style={$.fw_medium}>Location: </AppText>
                {item.organisationlocationname}
              </AppText>

              <AppText style={[$.p_tiny, $.text_tint_2]}>
                <AppText style={$.fw_medium}>Service: </AppText>
                {item.organisationprimarytypecode} ({item.organisationsecondarytypecode})
              </AppText>

              <AppText style={[$.p_tiny, $.text_tint_2]}>
                <AppText style={$.fw_medium}>Address: </AppText>
                {item.organisationlocationaddressline1}, {item.organisationlocationcity}, {item.organisationlocationstate}, {item.organisationlocationpincode}
              </AppText>

            </TouchableOpacity>
          </AppView>
        )}
      />


    </ScrollView>
  );
}
