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
export function AppoinmentBookingScreen() {
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
  const [organisationDetails, setOrganisationDetails] = useState<Organisation | null>(null);
  const [locationDetails, setLocationDetails] = useState<OrganisationLocation | null>(null);

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

  useEffect(() => {
    fetchOrganisationDetails();
  }, []);

  const fetchOrganisationDetails = async () => {
    try {
      const orgReq = new OrganisationSelectReq();
      orgReq.id = route.params.organisationid;
      const orgRes = await new OrganisationService().select(orgReq);
      if (orgRes && orgRes.length > 0) {
        setOrganisationDetails(orgRes[0]);
      }

      const locReq = new OrganisationLocationSelectReq();
      locReq.id = route.params.organisationlocationid;
      const locRes = await new OrganisationLocationService().select(locReq);
      if (locRes && locRes.length > 0) {
        setLocationDetails(locRes[0]);
      }
    } catch (error) {
      console.error('Error fetching organization details:', error);
    }
  };

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

  const sendToApi = (date: Date) => {
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0
    ));
    
    return utcDate 
  };
  
  const save = async () => {
    try {
      var a = new AppoinmentFinal();
    
      a.appoinmentdate = sendToApi(seleteddate);

      a.userid = usercontext.value.userid;
      a.organisationlocationid = route.params.organisationlocationid;
      a.organizationid = route.params.organisationid;

      var fromtimeconverted = convertToUTCFormat(seletedTiming.fromtime);
      a.totime = seletedTiming.totime;

      a.fromtime = seletedTiming.fromtime;

      if (seletedTiming.totime == seletedTiming.fromtime) {
        Alert.alert(environment.baseurl, 'select min one service');
        return;
      }

      // a.fromtime = convertToUTCFormat(seletedTiming.fromtime)
      a.attributes.servicelist = selectedService;
      console.log('seleteddate', seleteddate);
      var res = await organisationservicetiming.Bookappoinment(a);
      console.log('Appointment saved:', res);
      setSelectedService([])
      Alert.alert(environment.baseurl, res?.toString());
      bottomSheetRef.current.close();
      gettiming();
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  return (
    <AppView style={[$.flex_1, $.bg_tint_11]}>
      {/* Organization Details Section */}
      <AppView style={[$.px_normal, $.pt_normal, $.pb_compact]}>
        <AppText style={[$.fs_normal, $.fw_bold, $.text_primary5]}>
          {organisationDetails?.name || 'Loading...'}
        </AppText>
        <AppView style={[$.flex_row, $.align_items_center, $.mt_small]}>
          <CustomIcon
            name={CustomIcons.LocationPin}
            color={$.tint_2}
            size={$.s_small}
          />
          <AppText style={[$.fs_small, $.text_tint_ash, $.ml_small, { flex: 1 }]}>
            {locationDetails ? 
              `${locationDetails.addressline1}, ${locationDetails.addressline2}, ${locationDetails.city}, ${locationDetails.state} - ${locationDetails.pincode}` 
              : 'Loading address...'}
          </AppText>
        </AppView>
        <AppView style={[$.flex_row, $.align_items_center, $.mt_small]}>
          <CustomIcon
            name={CustomIcons.ServiceList}
            color={$.tint_2}
            size={$.s_small}
          />
          <AppText style={[$.fs_small, $.text_tint_ash, $.ml_small]}>
            {organisationservices.length} Services Available
          </AppText>
        </AppView>
      </AppView>

      <AppView style={[$.border_bottom, $.border_tint_7, $.mb_normal]} />

      {/* Services Preview Section */}
      <AppView style={[$.px_normal, $.pb_compact]}>
        <AppText style={[$.fs_small, $.fw_medium, $.text_primary5, $.mb_small]}>
          Available Services
        </AppText>
        <AppView style={{ position: 'relative' }}>
          <FlatList
            data={organisationservices}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{
              paddingRight: 20
            }}
            renderItem={({item}) => (
              <AppView 
                style={[
                  $.bg_tint_10,
                  $.border_rounded,
                  $.px_small,
                  $.py_small,
                  $.mr_small,
                  { minWidth: 150 }
                ]}
              >
                <AppText 
                  style={[$.fs_small, $.text_primary5, { flexShrink: 1 }]} 
                >
                  {item.Servicename}
                </AppText>
                <AppText style={[$.fs_small, $.text_tint_2, $.mt_tiny]}>
                  ₹{item.offerprize}
                </AppText>
              </AppView>
            )}
          />
          <AppView 
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 40,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'none'
            }}
          >
            <CustomIcon
              name={CustomIcons.RightArrow}
              color={$.tint_2}
              size={$.s_small}
            />
          </AppView>
        </AppView>
      </AppView>

      <AppView style={[$.border_bottom, $.border_tint_7, $.mb_normal]} />

      {/* Date Selection Section */}
      <AppView style={[$.px_normal, $.flex_row, $.align_items_center, { justifyContent: 'space-between' }]}>
        <AppText style={[$.fs_small, $.fw_medium, $.text_primary5]}>
          Select Date
        </AppText>
        <TouchableOpacity
          onPress={() => setshowdatepicker(true)}
          style={[
            $.flex_row,
            $.align_items_center,
            $.border,
            $.border_rounded,
            $.px_compact,
            $.py_tiny,
            $.bg_tint_10,
            $.border_tint_7,
          ]}>
          <CustomIcon
            name={CustomIcons.Clock}
            color={$.tint_2}
            size={$.s_small}
          />
          <AppText style={[$.fs_small, $.fw_medium, $.text_primary5, $.ml_small]}>
            {seleteddate.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </AppText>
        </TouchableOpacity>
      </AppView>

      <AppView style={[ $.border_tint_7]} />

      {/* Time Slots Section */}
      <AppView style={[$.px_normal, { flex: 1 }]}>
        <AppText style={[$.fs_small, $.fw_medium, $.text_primary5, $.mb_small]}>
          Available Time Slots
        </AppText>
        {organisationlocationTiming && organisationlocationTiming.length > 0 ? (
          <FlatList
            data={organisationlocationTiming}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            numColumns={3}
            columnWrapperStyle={{ 
              justifyContent: 'space-between',
              paddingHorizontal: 5,
              marginBottom: 10
            }}
            contentContainerStyle={{
              paddingBottom: 60
            }}
            style={{ flex: 1 }}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[
                  $.p_small,
                  $.bg_tint_11,
                  $.border_rounded,
                  $.border,
                  $.align_items_center,
                  { 
                    width: '30%',
                    marginHorizontal: 5,
                    opacity: item.statuscode === 'Booked' ? 0.6 : 1
                  }
                ]}
                disabled={item.statuscode === 'Booked'}
                onPress={() => {
                  var a = {...item};
                  a.totime = item.fromtime;
                  setSelectedtiming(a);
                  bottomSheetRef.current?.open();
                }}>
                <AppText style={[$.fw_medium, $.text_primary5, { textAlign: 'center' }]}>
                  {item.fromtime.split(':').slice(0, 2).join(':')}
                </AppText>
              </TouchableOpacity>
            )}
          />
        ) : (
          <AppText style={[$.fs_small, $.text_tint_ash, $.text_center, $.py_normal]}>
            No time slots available for this date
          </AppText>
        )}
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
              <AppView style={[$.flex_row]}>
                <TouchableOpacity
                  onPress={() => handleServiceSelection(item)}
                  style={[$.p_small, $.flex_1]}>
                  <AppText style={[$.text_primary5, $.fs_compact, $.fw_bold]}>
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

                {isSelected && (
                  <CustomIcon
                    name={CustomIcons.SingleTick}
                    color={$.tint_2}
                    size={$.s_compact}></CustomIcon>
                )}
              </AppView>
            );
          }}
        />
      </BottomSheetComponent>

      <DatePickerComponent
        date={seleteddate}
        show={showdatepicker}
        mode="date"
        setShow={() => setshowdatepicker(false)}
        setDate={v => {
          setselectedate(v);
        }}
      />
    </AppView>
  );
}
