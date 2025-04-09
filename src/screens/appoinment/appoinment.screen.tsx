import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {FlatList, Image, ScrollView, TouchableOpacity} from 'react-native';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {FilesService} from '../../services/files.service';
import {AppAlert} from '../../components/appalert.component';
import React from 'react';
import {UsersAddColourSetToCartReq} from '../../models/users.model';
import {UsersService} from '../../services/users.service';
import {AppoinmentService} from '../../services/appoinment.service';
import {Appoinment, AppoinmentSelectReq} from '../../models/appoinment.model';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
import {AppSwitch} from '../../components/appswitch.component';
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {
  OrganisationLocationStaffReq,
  OrganisationLocationStaffRes,
} from '../../models/organisationlocation.model';
import { AppSingleSelect } from '../../components/appsingleselect.component';

type AppoinmentScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList>,
  BottomTabScreenProps<HomeTabParamList, 'Appoinment'>
>;

export function AppoinmentScreen() {
  const navigation = useNavigation<AppoinmentScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(false);
  const [isorganisation, setisorganisation] = useState(false);

  const fileservice = useMemo(() => new FilesService(), []);
  const userservice = useMemo(() => new UsersService(), []);
  const usercontext = useAppSelector(selectusercontext);
  const appoinmentservices = useMemo(() => new AppoinmentService(), []);
  const organisationLocationService = useMemo(
    () => new OrganisationLocationService(),
    [],
  );

  const [OrganisationApponmentlist, setOrganisationAppoinmentList] = useState<Appoinment[]>([]);
  const [locationlist, Setlocationlist] = useState<OrganisationLocationStaffRes[]>([]);
  const [selectlocation, Setselectlocation] = useState<OrganisationLocationStaffRes | null>(null);
  const [UserApponmentlist, setUserAppoinmentList] = useState<Appoinment[]>([]);

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  // Load organization appointments when location changes
  useEffect(() => {
    if (selectlocation && isorganisation) {
      getorganisationappoinment(
        selectlocation.organisationid,
        selectlocation.organisationlocationid
      );
    }
  }, [selectlocation, isorganisation]);

  const loadInitialData = async () => {
    setIsloading(true);
    try {
      await getstafflocation();
      if (usercontext.value.userid > 0) {
        await getuserappoinment();
      }
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const getstafflocation = async () => {
    try {
      const req = new OrganisationLocationStaffReq();
      req.userid = usercontext.value.userid;
      const res = await organisationLocationService.Selectlocation(req);
      
      if (res && res.length > 0) {
        Setlocationlist(res);
        Setselectlocation(res[0]);
      }
    } catch (error: any) {
      handleError(error);
    }
  };

  const getuserappoinment = async () => {
    try {
      const req = new AppoinmentSelectReq();
      req.userid = usercontext.value.userid;
      const res = await appoinmentservices.select(req);
      setUserAppoinmentList(res || []);
    } catch (error: any) {
      handleError(error);
    }
  };

  const getorganisationappoinment = async (orgid: number, locid: number) => {
    try {
      const req = new AppoinmentSelectReq();
      req.organisationlocationid = locid;
      req.organisationid = orgid;
      const res = await appoinmentservices.select(req);
      setOrganisationAppoinmentList(res || []);
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleError = (error: any) => {
    const message = error?.response?.data?.message || 'An error occurred';
    AppAlert({message});
  };

  const handleToggleView = () => {
    setisorganisation(!isorganisation);
    // No need to fetch data here - useEffect will handle it
  };

  const handleLocationChange = (item: OrganisationLocationStaffRes) => {
    Setselectlocation(item);
    // No need to fetch data here - useEffect will handle it
  };

  function convertToIST(utcTimestamp: string | number | Date) {
    const utcDate = new Date(utcTimestamp);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(utcDate.getTime() + istOffset);
    return istDate.toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'});
  }

  const renderAppointmentItem = ({item}: {item: Appoinment}) => (
    <TouchableOpacity
      style={[
        $.mx_small,
        $.mb_small,
        $.border,
        $.border_tint_3,
        $.border_rounded2,
        $.bg_tint_11,
        $.p_small,
        $.pt_regular,
        {borderLeftWidth: 8},
      ]}
      onPress={() => {}}>
      <AppText style={[$.fw_bold, $.fs_medium, $.mb_small, $.text_primary5]}>
        {new Date(item.appoinmentdate).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </AppText>

      <AppView style={[$.flex_row, $.align_items_center, $.mb_small]}>
        <AppText style={[$.fw_medium, $.fs_small, $.text_primary5, $.mr_tiny]}>
          ⏰ From: {item.fromtime.toString()}
        </AppText>
        <AppText style={[$.fw_medium, $.fs_small, $.text_primary5, $.ml_tiny]}>
          To: {item.totime.toString()}
        </AppText>
      </AppView>

      {item.attributes?.servicelist?.length > 0 && (
        <AppView style={[$.mt_small, $.p_small]}>
          <AppView style={[$.flex_1, $.flex_row, $.align_items_center, {justifyContent: 'space-between'}]}>
            <AppText style={[$.fw_semibold, $.fs_small, $.mb_small, $.text_primary5]}>
              Services
            </AppText>
            <AppText style={[$.fw_medium, $.fs_small, $.mb_small, $.text_tint_11, $.bg_danger, $.border_rounded]}>
              Total: ₹
              {item.attributes.servicelist
                .reduce((total, service) => total + (Number(service.serviceprice) || 0), 0)
                .toString()}
            </AppText>
          </AppView>
          {item.attributes.servicelist.map((service, index) => (
            <AppView key={index} style={[$.flex_row, $.align_items_center, {flexWrap: 'wrap'}]}>
              <AppView style={[{flex: 1}, $.ml_tiny]}>
                <AppText style={[$.fw_bold, $.fs_small, $.mb_small, $.text_tint_ash, {flexShrink: 1, maxWidth: '80%'}]}>
                  {service.servicename}
                </AppText>
              </AppView>
              <AppView style={[{flexShrink: 0}]}>
                <AppText style={[$.fw_bold, $.fs_small, $.mb_small, $.text_success]}>
                  ₹{service.serviceprice}
                </AppText>
              </AppView>
            </AppView>
          ))}
        </AppView>
      )}
    </TouchableOpacity>
  );

  return (
    <AppView style={[$.flex_1]}>
      <AppView style={[$.pr_medium, $.flex_row, $.align_items_center, $.mb_tiny, {justifyContent: 'space-between'}]}>
        <AppText style={[$.fs_medium, $.fw_regular, $.p_medium, $.mx_small, $.text_primary5]}>
          {isorganisation ? 'Organization' : 'User'} Appointments
        </AppText>

        {selectlocation && selectlocation.organisationlocationid > 0 && (
          <AppSwitch
            onValueChange={handleToggleView}
            value={isorganisation}
          />
        )}
      </AppView>

      {locationlist.length > 1 && (
        <AppSingleSelect
          data={locationlist}
          keyExtractor={e => e.organisationlocationid.toString()}
          searchKeyExtractor={e => e.name}
          renderItemLabel={item => (
            <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>
              {item.name}
            </AppText>
          )}
          selecteditemid={selectlocation?.organisationlocationid.toString() || ''}
          onSelect={handleLocationChange}
          title="Select Location"
          style={[$.mb_normal]}
        />
      )}

      <FlatList
        data={isorganisation ? OrganisationApponmentlist : UserApponmentlist}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        keyExtractor={item => item.id.toString()}
        renderItem={renderAppointmentItem}
        ListEmptyComponent={
          <AppView style={[$.p_medium, $.align_items_center]}>
            <AppText style={[$.text_tint_3, $.fw_medium]}>
              No appointments found
            </AppText>
          </AppView>
        }
      />
    </AppView>
  );
}