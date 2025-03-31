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
import {useMemo, useRef, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {AppTextInput} from '../../components/apptextinput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {Alert, FlatList, TouchableOpacity} from 'react-native';

import {
  OrganisationLocation,
  OrganisationLocationSelectReq,
} from '../../models/organisationlocation.model';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
import {AppAlert} from '../../components/appalert.component';
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {useEffect} from 'react';
import React from 'react';
import {
  Organisation,
  OrganisationSelectReq,
} from '../../models/organisation.model';
import {OrganisationService} from '../../services/organisation.service';
import {OrganisationServiceTimingService} from '../../services/organisationservicetiming.service';
import {environment} from '../../utils/environment';
import {
  OrganisationServiceTimingFinal,
  OrganisationServiceTimingSelectReq,
  Weeks,
} from '../../models/organisationservicetiming.model';
import {OrganisationServicesService} from '../../services/organisationservices.service';
import {
  OrganisationServices,
  OrganisationServicesSelectReq,
} from '../../models/organisationservices.model';
import {DatePickerComponent} from '../../components/Datetimepicker.component';
import {
  Appoinment,
  AppoinmentFinal,
  SelectedSerivice,
} from '../../models/appoinment.model';
import {BottomSheetComponent} from '../../components/bottomsheet.component';
import {AppoinmentService} from '../../services/appoinment.service';
type AppoinmentFixingScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'AppoinmentFixing'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function AppoinmentFixingScreen() {
  const navigation = useNavigation<AppoinmentFixingScreenProp['navigation']>();
  const [organisationservices, setOrganisationservices] = useState<
    OrganisationServices[]
  >([]);
  const [organisationlocationTiming, setOrganisationlocationTiming] = useState<
    AppoinmentFinal[]
  >([]);
  const [seletedTiming, setSelectedtiming] = useState(new AppoinmentFinal());
  const [showdatepicker, setshowdatepicker] = useState(false);
  const [isloading, setIsloading] = useState(false);
  const servicesAvailableservice = useMemo(
    () => new OrganisationServicesService(),
    [],
  );
  const organisationservicetiming = useMemo(
    () => new OrganisationServiceTimingService(),
    [],
  );
  const appoinmentservices = useMemo(() => new AppoinmentService(), []);
  const usercontext = useAppSelector(selectusercontext);
  const route = useRoute<AppoinmentFixingScreenProp['route']>();
  const [seleteddate, setselectedate] = useState(new Date());
  const bottomSheetRef = useRef<any>(null);
  const [selectedService, setSelectedService] = useState<SelectedSerivice[]>(
    [],
  );

  const handleServiceSelection = (req: OrganisationServices) => {
    const item = new SelectedSerivice();
    item.id = req.id;
    item.servicename = req.Servicename;
    item.serviceprice = req.offerprize;
    item.servicetimetaken = req.timetaken;
    item.iscombo = req.Iscombo;

    setSelectedService(prevSelected => {
      const isSelected = prevSelected.some(service => service.id === item.id);

      setSelectedtiming(prev => {
        // Convert `totime` from string to Date object
        const baseTime = prev?.totime
          ? new Date(`1970-01-01T${prev.totime}`)
          : new Date(`1970-01-01T${seletedTiming.fromtime}`);

        // Add or subtract time based on selection
        if (isSelected) {
          baseTime.setMinutes(baseTime.getMinutes() - req.timetaken);
        } else {
          baseTime.setMinutes(baseTime.getMinutes() + req.timetaken);
        }

        // Convert the updated time back to "hh:mm:ss" string format
        const updatedTotime = baseTime.toTimeString().split(' ')[0];

        return {
          ...prev,
          totime: updatedTotime, // Store as string
        };
      });

      return isSelected
        ? prevSelected.filter(service => service.id !== item.id)
        : [...prevSelected, item];
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      getdata();
    }, []),
  );

  useEffect(() => {
    gettiming();
  }, [seleteddate]);

  useEffect(() => {}, [organisationlocationTiming]);

  const gettiming = async () => {
    try {
      var organizariontimereq = new OrganisationServiceTimingSelectReq();
      organizariontimereq.organisationid = route.params.organisationid;
      organizariontimereq.organisationlocationid =
        route.params.organisationlocationid;

      const dayName = seleteddate.toLocaleDateString('en-US', {
        weekday: 'long',
      }); // "Friday"

      const dayNumber = Weeks[dayName as keyof typeof Weeks]; // Convert string to number

      organizariontimereq.day_of_week = dayNumber;
      organizariontimereq.appointmentdate = seleteddate;
      console.log('organizariontimereq', organizariontimereq);
      console.log('timing', organizariontimereq);

      var organisationtimingres =
        await organisationservicetiming.selecttimingslot(organizariontimereq);

      if (organisationtimingres) {
        setOrganisationlocationTiming(organisationtimingres);
      }
    } catch {
      Alert.alert(environment.baseurl, 'error jnk');
    }
  };

  const getdata = async () => {
    try {
      var organisationservicereq = new OrganisationServicesSelectReq();
      organisationservicereq.organisationid = route.params.organisationid;
      var organisationserviceres = await servicesAvailableservice.select(
        organisationservicereq,
      );
      if (organisationserviceres) {
        setOrganisationservices(organisationserviceres);
      }
    } catch {
      Alert.alert(environment.baseurl, 'Error in get timing');
    }
  };

  const openBottomSheet = () => {
    bottomSheetRef.current?.open();
  };
  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };
  // function convertToUTCFormat(dateInput: string | Date): string {
  //     // Ensure the input is a Date object
  //     const date = new Date(dateInput);

  //     // Convert to ISO format with milliseconds and 'Z' (UTC)
  //     return date.toISOString();
  // }

  function convertToUTCFormat(dateInput: string | Date): Date {
    return new Date(dateInput); // Returns a Date object
  }

  const save = async () => {
    try {
      var a = new AppoinmentFinal();
      a.appoinmentdate = seleteddate;

      a.userid = usercontext.value.userid;
      a.organisationlocationid = route.params.organisationlocationid;
      a.organizationid = route.params.organisationid;

      var fromtimeconverted = convertToUTCFormat(seletedTiming.fromtime);
      a.totime = seletedTiming.totime;

      a.fromtime = seletedTiming.fromtime;

      // a.fromtime = convertToUTCFormat(seletedTiming.fromtime)
      a.attributes.servicelist = selectedService;
      console.log('seletedTiming', a);
      var res = await organisationservicetiming.Bookappoinment(a);
      console.log('Appointment saved:', res);
      Alert.alert(environment.baseurl, res?.toString());
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  return (
    <AppView style={[$.pt_normal, $.flex_1]}>
      <AppView style={[$.flex_row, $.align_items_center]}>
        <AppText
          style={[$.fs_compact, $.fw_bold, $.flex_1, $.px_small, $.text_primary5]}>
          Appoinment{' '}
        </AppText>
        <TouchableOpacity
          onPress={() => setshowdatepicker(true)}
          style={[
            $.border,
            $.border_rounded,
            $.mr_small,
            $.align_items_center,
            $.justify_content_center,
            $.bg_tint_10,
            $.border_tint_7,
          ]}>
          <AppText style={{fontSize: 14, fontWeight: 'bold', color: '#333'}}>
            {seleteddate.toDateString()}
          </AppText>
        </TouchableOpacity>
      </AppView>

      <BottomSheetComponent
        ref={bottomSheetRef}
        screenname="Available Service"
        Save={save}
        close={closeBottomSheet}>
        <AppView>
          <AppText>
            {seletedTiming.fromtime} -{seletedTiming.totime}
          </AppText>
        </AppView>

        <FlatList
          data={organisationservices}
          nestedScrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => {
            const isSelected = selectedService.some(
              service => service.id === item.id,
            );

            return (
                <AppView
                  style={[ 
                    $.flex_row,
                  ]}>
                  <TouchableOpacity
                    onPress={() => handleServiceSelection(item)}
                    style={[$.p_small, $.flex_1]}>
                    <AppText
                      style={[
                        $.text_primary5,
                        $.fs_compact,
                        $.fw_bold,
                      ]}>
                      {item.Servicename}
                    </AppText>
                    <AppText style={[$.fs_small, $.text_tint_ash]}>
                      {item.timetaken} min session
                    </AppText>
                    <AppText style={[$.fs_small, $.flex_1, $.text_tint_ash]}>
                      <AppText
                        style={[
                          $.flex_1,
                          {textDecorationLine: 'line-through', color: 'gray'},
                        ]}>
                        ₹{item.prize}
                      </AppText>
                      <AppText>₹{item.offerprize}</AppText>
                    </AppText>
                  </TouchableOpacity>
               
                {   isSelected &&   <CustomIcon
                      name={CustomIcons.SingleTick}
                      color={$.tint_2}
                      size={$.s_compact}></CustomIcon>}
               
                </AppView>
            );
          }}
        />
      </BottomSheetComponent>

      {organisationlocationTiming && organisationlocationTiming.length > 0 && (
        <AppView style={[$.py_compact]}>
          <FlatList
            data={organisationlocationTiming}
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[
                  $.flex_1,
                  $.p_small,
                  $.bg_tint_11,
                  $.border_rounded,

                  $.flex_row,
                  $.align_items_center,
                ]}
                onPress={() => {
                  setSelectedtiming(item);
                  console.log('item', item);

                  bottomSheetRef.current?.open();
                }}>
                {/* Time Display */}
                <AppText style={[$.fw_medium, $.mr_big,$.text_primary5]}>
                  {item.fromtime} - {item.totime}
                </AppText>
             
                {/* Status Display */}
                <AppText style={[$.text_tint_2, $.text_right, item.statuscode === 'Booked' ? $.text_primary5 : $.text_tint_6]}>
                  {item?.statuscode
                    ? `${item.statuscode}`
                    : 'N/A'}
                </AppText>
             
              </TouchableOpacity>
            )}
          />
        </AppView>
      )}

      <DatePickerComponent
        date={seleteddate}
        show={showdatepicker}
        mode="date"
        setShow={() => setshowdatepicker(false)}
        setDate={v => {
          console.log('jsnfls', v);
          setselectedate(v);
        }}
      />
    </AppView>
  );
}
