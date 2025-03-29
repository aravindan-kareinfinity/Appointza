import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {useAppDispatch, useAppSelector} from '../../redux/hooks.redux';
import {counteractions, selectcounter} from '../../redux/counter.redux';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {AppTextInput} from '../../components/apptextinput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {AppSwitch} from '../../components/appswitch.component';
import {FlatList, Image, ScrollView, TouchableOpacity} from 'react-native';
import {Line} from 'react-native-svg';
import {AppAlert} from '../../components/appalert.component';
import {AppSingleSelect} from '../../components/appsingleselect.component';
import {FilesService} from '../../services/files.service';
import {OrganisationService} from '../../services/organisation.service';
import {
  OrganisationDetail,
  OrganisationSelectReq,
} from '../../models/organisation.model';
import {selectusercontext} from '../../redux/usercontext.redux';

type ServiceScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Service'>,
  NativeStackScreenProps<AppStackParamList>
>;
export function ServiceScreen() {
  const navigation = useNavigation<ServiceScreenProp['navigation']>();
  const [categoryid, setCategoryid] = useState(0);
  const [subcategoryid, setsubcategoryid] = useState(0);
  const [productid, setproductid] = useState(0);
  const [isloading, setIsloading] = useState(false);

  const filesservice = useMemo(() => new FilesService(), []);
  const Organizationlist = useMemo(() => new OrganisationService(), []);

  const [OrganisatonDetailList, setOrganisationDetailList] = useState<
    OrganisationDetail[]
  >([]);
  const usercontext = useAppSelector(selectusercontext);

  const getdata = async () => {
    try {
      var req = new OrganisationSelectReq();

      var res = await Organizationlist.SelectOrganisationDetail(req);
      if (res) {
        setOrganisationDetailList(res);
      }
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      getdata();
    }, []),
  );

  return (
<AppView style={[$.bg_tint_11]}>

<AppText
        style={[$.fs_medium, $.fw_regular,  $.p_medium, $.mx_small, $.text_primary5, ]}>
        Services
      </AppText>



      <FlatList
        data={OrganisatonDetailList}
        nestedScrollEnabled={true}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => (
          <AppView style={[$.m_small,$.elevation_4, $.p_medium, $.border_rounded]}>
            
              <AppText style={[$.fw_medium, $.fs_big, $.text_primary5]}>
                {item.organisationname}
              </AppText>

              
              <AppText style={[$.text_tint_ash, $.fs_small, $.align_items_center, $.mb_small, $.flex_1, $.text_primary5]}>
                {/* <AppText style={$.fw_medium}>Location: </AppText> */}
                {/* <CustomIcon name={CustomIcons.Location} size={20} color={''} /> */}
                {item.organisationlocationname},{' '}
                {item.organisationlocationaddressline1},{' '}
                {item.organisationlocationcity},{' '}
                {item.organisationlocationstate},{' '}
                {item.organisationlocationpincode}
              </AppText>

              <AppView style={[$.flex_1, $.flex_row, $.align_items_center, $.flex_wrap_wrap, $.m_tiny]}>
                

                <AppView style={[ $.border_rounded2, $.bg_tint_9, $.p_tiny, $.px_small, $.m_tiny]}>
                  <AppText style={[$.fw_regular,$.fs_small, $.text_tint_5, $.p_tiny]}>{item.organisationprimarytypecode} </AppText>
                </AppView>

                <AppView style={[ $.border_rounded2, $.bg_tint_10, $.p_tiny, $.px_small, $.m_tiny]}>
                  <AppText style={[$.fw_regular, $.fs_small, $.text_tint_1, $.p_tiny]}>
                    {item.organisationsecondarytypecode} </AppText>
                </AppView>

                {/* <AppText style={[$.p_tiny, $.text_tint_2]}>
                  {item.organisationprimarytypecode} (
                  {item.organisationsecondarytypecode})
                </AppText> */}
              </AppView>
              

              <AppButton style={[$.bg_tint_3, $.border_rounded2, $.mt_small]} textstyle={[$.text_tint_11, $.fs_small]} name={'Schedule Appointment'} onPress={() => {
                navigation.navigate('AppoinmentFixing', {
                  organisationid: item.organisationid,
                  organisationlocationid: item.organisationlocationid,
                });
              }}>
                
              </AppButton>
          </AppView>
        )}
      />

    
  
</AppView>

  );
}
