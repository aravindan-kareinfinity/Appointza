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

  const fileservice = useMemo(() => new FilesService(), []);
  const userservice = useMemo(() => new UsersService(), []);
  const usercontext = useAppSelector(selectusercontext);
  const appoinmentservices = useMemo(() => new AppoinmentService(), []);
  const organisationLocationService = useMemo(
    () => new OrganisationLocationService(),
    [],
  );

  const [OrganisationApponmentlist, setOrganisationAppoinmentList] = useState<
    Appoinment[]
  >([]);
  const [locationlist, Setlocationlist] = useState<
    OrganisationLocationStaffRes[]
  >([]);
  const [selectlocation, Setselectlocation] = useState<
  OrganisationLocationStaffRes
>(new   OrganisationLocationStaffRes );
  const [UserApponmentlist, setUserAppoinmentList] = useState<Appoinment[]>([]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getuserappoinment();
    });
    getstafflocation()
    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      getstafflocation() 
    }, []),
  );

  const getstafflocation = async () => {
    setIsloading(true);
    try {
      var req = new OrganisationLocationStaffReq();
      req.userid = usercontext.value.userid;
      var res = await organisationLocationService.Selectlocation(req);
      if (res) {
        Setlocationlist(res);
        Setselectlocation(res[0])
      }
      if (usercontext.value.userid > 0) {
        getuserappoinment();
      }
      if (res && res[0].organisationlocationid > 0 ) {
        getorganisationappoinment(res[0].organisationid,res[0].organisationlocationid);
      }
     
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };

  const getuserappoinment = async () => {
    setIsloading(true);
    try {
      var req = new AppoinmentSelectReq();
      req.userid = usercontext.value.userid;
      var res = await appoinmentservices.select(req);
      if (res) {
        setUserAppoinmentList(res);
      }
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };
  const getorganisationappoinment = async (orgid:number,locid:number) => {
    setIsloading(true);
    try {
      var req = new AppoinmentSelectReq();
      req.organisationlocationid = locid;
      req.organisationid = orgid;
      var res = await appoinmentservices.select(req);
      if (res) {
        setOrganisationAppoinmentList(res);
      }
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };

  // const getlocation

  function convertToIST(utcTimestamp: string | number | Date) {
    const utcDate = new Date(utcTimestamp);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(utcDate.getTime() + istOffset);

    return istDate.toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'});
  }

  const [isorganisation, setisorganisation] = useState(false);

  return (
    <AppView style={[$.flex_1]}>
      <AppView
        style={[
          $.pr_medium,
          $.flex_row,
          $.align_items_center,
          $.mb_tiny,
          {justifyContent: 'space-between'},
        ]}>
        <AppText
          style={[
            $.fs_medium,
            $.fw_regular,
            $.p_medium,
            $.mx_small,
            $.text_primary5,
          ]}>
          Appointment 
        </AppText>

  { selectlocation && selectlocation.organisationlocationid > 0 &&      <AppSwitch
          onValueChange={() => {
            setisorganisation(!isorganisation);
          }}
          value={isorganisation}
        />}
      </AppView>

     {locationlist.length > 1 && <AppSingleSelect
        data={locationlist}
        keyExtractor={e => e.organisationlocationid.toString()}
        searchKeyExtractor={e => e.name}
        renderItemLabel={item => {
          return (
            <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>
              {item.name}
            </AppText>
          );
        }}
        selecteditemid={selectlocation.organisationlocationid.toFixed()}
        onSelect={item => {
          Setselectlocation(item)
        }}
        title="Select Location"
        style={[$.mb_normal]}
      />}

      <FlatList
        data={isorganisation ? OrganisationApponmentlist : UserApponmentlist}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
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
            {/* Appointment Date */}
            <AppText
              style={[$.fw_bold, $.fs_medium, $.mb_small, $.text_primary5]}>
              {new Date(item.appoinmentdate).toLocaleDateString('en-US', {
                weekday: 'short', // Full day name (e.g., Monday)
                month: 'short', // Full month name (e.g., March)
                day: 'numeric', // Date (e.g., 18)
              })}
            </AppText>

            {/* Appointment Timing */}
            <AppView style={[$.flex_row, $.align_items_center, $.mb_small]}>
              <AppText
                style={[$.fw_medium, $.fs_small, $.text_primary5, $.mr_tiny]}>
                {/* <CustomIcon name={CustomIcons.Clock} size={20} color={''} /> */}
                ⏰ From: {item.fromtime.toString()}
              </AppText>
              <AppText
                style={[$.fw_medium, $.fs_small, $.text_primary5, $.ml_tiny]}>
                To: {item.totime.toString()}
              </AppText>
            </AppView>

            {/* Service List */}
            {item.attributes?.servicelist?.length > 0 && (
              <AppView style={[$.mt_small, $.p_small]}>
                <AppView
                  style={[
                    $.flex_1,
                    $.flex_row,
                    $.align_items_center,
                    {justifyContent: 'space-between'},
                  ]}>
                  <AppText
                    style={[
                      $.fw_semibold,
                      $.fs_small,
                      $.mb_small,
                      $.text_primary5,
                    ]}>
                    {' '}
                    Services
                  </AppText>
                  <AppText
                    style={[
                      $.fw_medium,
                      $.fs_small,
                      $.mb_small,
                      $.text_tint_11,
                      $.bg_danger,
                      $.border_rounded,
                    ]}>
                    {' '}
                    Total: ₹
                    {item.attributes.servicelist
                      .reduce(
                        (total, service) =>
                          total + (Number(service.serviceprice) || 0),
                        0,
                      )
                      .toString()}{' '}
                  </AppText>
                </AppView>
                {item.attributes.servicelist.map((service, index) => (
                  <AppView
                    key={index}
                    style={[
                      $.flex_row,
                      $.align_items_center,
                      {flexWrap: 'wrap'},
                    ]}>
                    {/* Service Name */}
                    <AppView style={[{flex: 1}, $.ml_tiny]}>
                      <AppText
                        style={[
                          $.fw_bold,
                          $.fs_small,
                          $.mb_small,
                          $.text_tint_ash,
                          {flexShrink: 1, maxWidth: '80%'},
                        ]}>
                        {service.servicename}
                      </AppText>
                    </AppView>

                    {/* Price */}
                    <AppView style={[{flexShrink: 0}]}>
                      <AppText
                        style={[
                          $.fw_bold,
                          $.fs_small,
                          $.mb_small,
                          $.text_success,
                        ]}>
                        ₹{service.serviceprice}
                      </AppText>
                    </AppView>
                  </AppView>
                ))}
              </AppView>
            )}
          </TouchableOpacity>
        )}
      />
    </AppView>
  );
}
