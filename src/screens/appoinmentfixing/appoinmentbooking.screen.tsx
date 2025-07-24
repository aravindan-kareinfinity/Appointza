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
import {Alert, FlatList, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView} from 'react-native';

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
  OrganisationServiceTiming,
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
import {Button} from '../../components/button.component';
import {FormInput} from '../../components/forminput.component';

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
  const [organisationDetails, setOrganisationDetails] =
    useState<Organisation | null>(null);
  const [locationDetails, setLocationDetails] =
    useState<OrganisationLocation | null>(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const handleServiceSelection = (req: OrganisationServices) => {
    const item = new SelectedSerivice();
    item.id = req.id;
    item.servicename = req.Servicename;
    item.serviceprice = req.offerprize;
    item.servicetimetaken = req.timetaken;
    item.iscombo = req.Iscombo;

    setSelectedService(prevSelected => {
      const isSelected = prevSelected.some(service => service.id === item.id);
      const newSelectedServices = isSelected
        ? prevSelected.filter(service => service.id !== item.id)
        : [...prevSelected, item];

      // Calculate total duration of selected services
      const totalDuration = newSelectedServices.reduce(
        (sum, service) => sum + service.servicetimetaken,
        0
      );

      // Update the end time based on the new total duration
      if (seletedTiming.fromtime) {
        const baseTime = new Date(`1970-01-01T${seletedTiming.fromtime}`);
        const endTime = new Date(baseTime.getTime() + totalDuration * 60000); // Convert minutes to milliseconds

        // Check if the end time exceeds the business hours
        const businessEndTime = new Date(`1970-01-01T${organisationlocationTiming[organisationlocationTiming.length - 1]?.fromtime}`);
        if (endTime > businessEndTime) {
          Alert.alert(
            'Time Slot Unavailable',
            'The selected services cannot be completed within business hours. Please select a different time slot or fewer services.'
          );
          return prevSelected; // Keep the previous selection
        }

        setSelectedtiming(prev => ({
          ...prev,
          totime: endTime.toTimeString().split(' ')[0]
        }));
      }

      return newSelectedServices;
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


  useEffect(() => {
    gettimingdata()
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
      });
      const dayNumber = Weeks[dayName as keyof typeof Weeks];
      organizariontimereq.day_of_week = dayNumber;
      organizariontimereq.appointmentdate = seleteddate;

      var organisationtimingres =
        await organisationservicetiming.selecttimingslot(organizariontimereq);

      if (organisationtimingres) {
        setOrganisationlocationTiming(organisationtimingres);
      }
    } catch {
      Alert.alert(environment.baseurl, 'error jnk');
    }
  };
  const organisationservicetimingservice = useMemo(
    () => new OrganisationServiceTimingService(),
    [],
  );
  const daysOfWeek = [
    {id: Weeks.Monday, label: 'Monday'},
    {id: Weeks.Tuesday, label: 'Tuesday'},
    {id: Weeks.Wednesday, label: 'Wednesday'},
    {id: Weeks.Thursday, label: 'Thursday'},
    {id: Weeks.Friday, label: 'Friday'},
    {id: Weeks.Saturday, label: 'Saturday'},
    {id: Weeks.Sunday, label: 'Sunday'},
  ];
  const timeStringToDate = (timeString: string): Date => {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const now = new Date();
    now.setHours(hours, minutes, seconds, 0);
    return now;
  };
  const [dayTimeSlots, setDayTimeSlots] = useState<
  Record<number, OrganisationServiceTiming[]>
>(() => {
  const initialSlots: Record<number, OrganisationServiceTiming[]> = {};
  daysOfWeek.forEach(day => {
    initialSlots[day.id] = [];
  });
  return initialSlots;
});
const [counter, setCounter] = useState(0);
const [openbefore, setopenbefore] = useState(0);

  const gettimingdata = async () => {
    try {
      const req = new OrganisationServiceTimingSelectReq();
      req.organisationid = route.params.organisationid;
      req.organisationlocationid = route.params.organisationlocationid;
      const res = await organisationservicetimingservice.select(req);

      if (res && res.length > 0) {
        const newDayTimeSlots: Record<number, OrganisationServiceTiming[]> = {};

        // Initialize all days with empty arrays
        daysOfWeek.forEach(day => {
          newDayTimeSlots[day.id] = [];
        });

        // Populate time slots for each day
        res.forEach(v => {
          const slot = new OrganisationServiceTiming();
          slot.id = v.id;
          slot.localid = v.id || Date.now(); // Use existing ID or generate new one
          slot.start_time = timeStringToDate(v.start_time);
          slot.end_time = timeStringToDate(v.end_time);
          slot.day_of_week = v.day_of_week;

          if (newDayTimeSlots[v.day_of_week]) {
            newDayTimeSlots[v.day_of_week].push(slot);
          }
        });

        setDayTimeSlots(newDayTimeSlots);
        setopenbefore(res[0].openbefore);
        setCounter(res[0].counter);
      }
    } catch (error) {
      console.error('Error fetching timing data:', error);
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

  function convertToUTCFormat(dateInput: string | Date): Date {
    return new Date(dateInput);
  }

  const sendToApi = (date: Date) => {
    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
    );

    return utcDate;
  };

  const save = async () => {
       if (usercontext.value.userid <= 0) {
        Alert.alert(
          environment.baseurl,"Please log in before booking an appointment",
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('Login');
              },
            },
          ],
        );
        return;
      }

    try {
      if (selectedService.length === 0) {
        Alert.alert(
          'No Services Selected',
          'Please select at least one service before booking',
        );
        return;
      }

      var a = new AppoinmentFinal();
      a.appoinmentdate = sendToApi(seleteddate);
      a.userid = usercontext.value.userid;
      a.organisationlocationid = route.params.organisationlocationid;
      a.organizationid = route.params.organisationid;
      a.totime = seletedTiming.totime;
      a.fromtime = seletedTiming.fromtime;

      if (seletedTiming.totime == seletedTiming.fromtime) {
        Alert.alert(environment.baseurl, 'Please select at least one service');
        return;
      }

      a.attributes.servicelist = selectedService;
      var res = await organisationservicetiming.Bookappoinment(a);

      Alert.alert(
        'Appointment Booked',
        'Your appointment has been successfully booked!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset states
              setSelectedService([]);
              setSelectedtiming(new AppoinmentFinal());
              // Navigate back
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error saving appointment:', error);
      Alert.alert(
        'Error',
        'There was an error booking your appointment. Please try again.',
      );
    }
  };

  const isTimeSlotSelected = (timeSlot: AppoinmentFinal) => {
    return seletedTiming.fromtime === timeSlot.fromtime;
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  };

  // Update time slot selection to handle service duration
  const handleTimeSlotSelection = (timeSlot: AppoinmentFinal) => {
    if (selectedService.length > 0) {
      // Calculate total duration of selected services
      const totalDuration = selectedService.reduce(
        (sum, service) => sum + service.servicetimetaken,
        0
      );

      // Calculate end time
      const baseTime = new Date(`1970-01-01T${timeSlot.fromtime}`);
      const endTime = new Date(baseTime.getTime() + totalDuration * 60000);

      // Check if the end time exceeds the business hours
      const businessEndTime = new Date(`1970-01-01T${organisationlocationTiming[organisationlocationTiming.length - 1]?.fromtime}`);
      if (endTime > businessEndTime) {
        Alert.alert(
          'Time Slot Unavailable',
          'The selected services cannot be completed within business hours. Please select a different time slot or remove some services.'
        );
        return;
      }

      setSelectedtiming({
        ...timeSlot,
        totime: endTime.toTimeString().split(' ')[0]
      });
    } else {
      setSelectedtiming({
        ...timeSlot,
        totime: timeSlot.fromtime
      });
    }
  };

  const PaymentBottomSheet = () => (
    <BottomSheetComponent
      ref={bottomSheetRef}
      screenname="Payment Details"
      Save={() => {
        // Handle payment submission
        setShowPaymentSheet(false);
        setPaymentMethod('');
      }}
      showbutton={true}
      close={() => {
        setShowPaymentSheet(false);
        setPaymentMethod('');
      }}>
      <AppView style={[$.p_medium, $.flex_1]}>
        <AppText style={[$.fw_semibold, $.fs_large, $.mb_medium]}>
          Select Payment Method
        </AppText>

        <AppView style={[$.mb_medium]}>
          <FormInput
            label="Payment Method"
            value={paymentMethod}
            onChangeText={setPaymentMethod}
            placeholder="Select payment method"
            editable={false}
            containerStyle={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 3,
            }}
          />
        </AppView>

        <AppView style={[$.flex_row, {justifyContent: 'space-between'}, $.mb_medium]}>
          <TouchableOpacity
            style={{
              flex: 1,
              marginRight: 8,
              backgroundColor: '#F8F9FA',
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: paymentMethod === 'Cash' ? '#4A90E2' : '#E9ECEF',
              alignItems: 'center',
            }}
            onPress={() => setPaymentMethod('Cash')}>
            <CustomIcon
              name={CustomIcons.CashPayment}
              size={24}
              color={paymentMethod === 'Cash' ? '#4A90E2' : '#6C757D'}
            />
            <AppText
              style={{
                marginTop: 8,
                color: paymentMethod === 'Cash' ? '#4A90E2' : '#6C757D',
                fontWeight: '500',
              }}>
              Cash
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              marginLeft: 8,
              backgroundColor: '#F8F9FA',
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: paymentMethod === 'Card' ? '#4A90E2' : '#E9ECEF',
              alignItems: 'center',
            }}
            onPress={() => setPaymentMethod('Card')}>
            <CustomIcon
              name={CustomIcons.OnlinePayment}
              size={24}
              color={paymentMethod === 'Card' ? '#4A90E2' : '#6C757D'}
            />
            <AppText
              style={{
                marginTop: 8,
                color: paymentMethod === 'Card' ? '#4A90E2' : '#6C757D',
                fontWeight: '500',
              }}>
              Card
            </AppText>
          </TouchableOpacity>
        </AppView>

        <AppView style={[$.mb_medium]}>
          <FormInput
            label="Total Amount"
            value={`₹${selectedService.reduce((sum, service) => sum + service.serviceprice, 0)}`}
            onChangeText={() => {}}
            editable={false}
            containerStyle={{
              backgroundColor: '#F8F9FA',
              borderRadius: 12,
              padding: 16,
            }}
          />
        </AppView>
      </AppView>
    </BottomSheetComponent>
  );

  const CancelAppointmentBottomSheet = () => (
    <BottomSheetComponent
      ref={bottomSheetRef}
      screenname="Cancel Appointment"
      Save={() => {
        // Handle cancellation
        setShowCancelSheet(false);
        setCancelReason('');
      }}
      showbutton={true}
      close={() => {
        setShowCancelSheet(false);
        setCancelReason('');
      }}>
      <AppView style={[$.p_medium, $.flex_1]}>
        <AppText style={[$.fw_semibold, $.fs_large, $.mb_medium]}>
          Cancel Appointment
        </AppText>

        <AppView style={[$.mb_medium]}>
          <FormInput
            label="Reason for Cancellation"
            value={cancelReason}
            onChangeText={setCancelReason}
            placeholder="Please provide a reason for cancellation"
            multiline={true}
            numberOfLines={4}
            containerStyle={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 3,
            }}
          />
        </AppView>

        <AppView style={[$.mb_medium]}>
          <AppText style={[$.fw_medium, $.mb_small]}>Cancellation Policy</AppText>
          <AppView
            style={{
              backgroundColor: '#F8F9FA',
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E9ECEF',
            }}>
            <AppText style={{ color: '#6C757D', lineHeight: 20 }}>
              • Cancellations made 24 hours before the appointment are fully refundable{'\n'}
              • Cancellations made within 24 hours may be subject to a cancellation fee{'\n'}
              • No-shows will be charged the full appointment fee
            </AppText>
          </AppView>
        </AppView>
      </AppView>
    </BottomSheetComponent>
  );

 
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppView style={[$.flex_1, $.bg_tint_11]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}>
        {/* Organization Details Section */}
        <AppView style={styles.orgDetailsContainer}>
          <AppText style={styles.orgName}>
            {organisationDetails?.name || 'Loading...'}
          </AppText>

          <AppView style={styles.detailRow}>
            <CustomIcon
              name={CustomIcons.LocationPin}
              color={$.tint_2}
              size={$.s_small}
            />
            <AppText style={styles.detailText}>
              {locationDetails
                ? `${locationDetails.addressline1}, ${locationDetails.addressline2}, ${locationDetails.city}, ${locationDetails.state} - ${locationDetails.pincode}`
                : 'Loading address...'}
            </AppText>
            <AppText style={styles.detailText}> {locationDetails?.country}</AppText>
          </AppView>

          <AppView style={styles.detailRow}>
            <CustomIcon
              name={CustomIcons.ServiceList}
              color={$.tint_2}
              size={$.s_small}
            />
            <AppText style={styles.detailText}>
              {organisationservices.length} Services Available
            </AppText>
          </AppView>
        </AppView>

        <AppView style={styles.divider} />

        {/* Date Selection Section */}
        <AppView style={styles.dateSelectionContainer}>
          <AppText style={styles.sectionTitle}>Select Date</AppText>
          <TouchableOpacity
            onPress={() => setshowdatepicker(true)}
            style={styles.datePickerButton}>
            <AppView style={styles.datePickerContent}>
              <CustomIcon
                name={CustomIcons.Account}
                color={$.tint_2}
                size={$.s_small}
              />
              <AppText style={styles.dateText}>
                {seleteddate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </AppText>
            </AppView>
          </TouchableOpacity>
        </AppView>

        <AppView style={styles.divider} />

        {/* Time Slots Section */}
        <AppView style={styles.timeSlotsContainer}>
          <AppText style={styles.sectionTitle}>Available Time Slots</AppText>

          {organisationlocationTiming &&
          organisationlocationTiming.length > 0 ? (
            <FlatList
              data={organisationlocationTiming}
              scrollEnabled={false}
              nestedScrollEnabled
              keyExtractor={item => item.fromtime}
              numColumns={3}
              columnWrapperStyle={styles.timeSlotsGrid}
              contentContainerStyle={styles.timeSlotsContent}
              renderItem={({item}) => {
                const isSelected = isTimeSlotSelected(item);
                const isBooked = item.statuscode === 'Booked';

                return (
                  <TouchableOpacity
                    style={[
                      styles.timeSlotButton,
                      isSelected && styles.selectedTimeSlot,
                      isBooked && styles.bookedTimeSlot,
                    ]}
                    disabled={isBooked}
                    onPress={() => handleTimeSlotSelection(item)}>
                    <AppText
                      style={[
                        styles.timeSlotText,
                        isSelected && styles.selectedTimeSlotText,
                        isBooked && styles.bookedTimeSlotText,
                      ]}>
                      {formatTime(item.fromtime)}
                    </AppText>
                    {isBooked && (
                      <AppText style={styles.bookedText}>Booked</AppText>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            <AppView style={styles.noSlotsContainer}>
              <CustomIcon
                name={CustomIcons.Clock}
                color={$.tint_7}
                size={$.s_large}
              />
              <AppText style={styles.noSlotsText}>
                No time slots available for this date
              </AppText>
            </AppView>
          )}
        </AppView>

        <AppView style={styles.divider} />

        {/* Selected Services Preview */}
        {selectedService.length > 0 && (
          <AppView style={styles.selectedServicesContainer}>
            <AppText style={styles.sectionTitle}>Selected Services</AppText>
            <FlatList
              data={selectedService}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({item}) => (
                <AppView style={styles.selectedServicePill}>
                  <AppText style={styles.selectedServiceText}>
                    {item.servicename}
                  </AppText>
                </AppView>
              )}
              contentContainerStyle={styles.selectedServicesList}
            />
            <AppView style={styles.timeSelection}>
              <AppText style={styles.timeSelectionText}>
                {formatTime(seletedTiming.fromtime)} -{' '}
                {formatTime(seletedTiming.totime)}
              </AppText>
            </AppView>
          </AppView>
        )}

        {/* Services List Section */}
        {seletedTiming.appoinmentdate && (
          <AppView style={styles.servicesContainer}>
            <AppText style={styles.sectionTitle}>Available Services</AppText>

            <FlatList
  data={organisationservices}
  scrollEnabled={false}
  nestedScrollEnabled={true}
  renderItem={({item}) => {
    const isSelected = selectedService.some(service => service.id === item.id);
    
    return (
      <TouchableOpacity
        onPress={() => handleServiceSelection(item)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 16,
          paddingHorizontal: 20,
          marginBottom: 8,
          backgroundColor: isSelected ? '#F0F7FF' : '#FFFFFF',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isSelected ? '#4A90E2' : '#EDEDED',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2
        }}>
        
        {/* Service Information */}
        <AppView style={{ flex: 1 ,   backgroundColor: isSelected ? '#F0F7FF' : '#FFFFFF',}}>
          {/* Service Name */}
          <AppText style={{
            fontSize: 16,
            fontWeight: '600',
         
            marginBottom: 4
          }}>
            {item.Servicename}
          </AppText>
          
          {/* Duration */}
          <AppText style={{
            fontSize: 13,
            color: '#718096',
            marginBottom: 8
          }}>
            {item.timetaken} min session
          </AppText>
          
          {/* Pricing */}
          <AppView style={{ flexDirection: 'row', alignItems: 'center',   backgroundColor: isSelected ? '#F0F7FF' : '#FFFFFF', }}>
            <AppText style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#4A90E2',
              marginRight: 8
            }}>
              ₹{item.offerprize}
            </AppText>
            <AppText style={{
              fontSize: 13,
              color: '#A0AEC0',
              textDecorationLine: 'line-through'
            }}>
              ₹{item.prize}
            </AppText>
          </AppView>
        </AppView>
        
        {/* Selection Indicator */}
        {isSelected && (
          <AppView style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#4A90E2',
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 12
          }}>
            <CustomIcon
              name={CustomIcons.SingleTick}
              color="#FFFFFF"
              size={16}
            />
          </AppView>
        )}
      </TouchableOpacity>
    );
  }}
/>
          </AppView>
        )}

        {/* Book Appointment Button */}
        <Button
          title="Book Appointment"
          onPress={save}
          disabled={selectedService.length === 0 || !seletedTiming.fromtime}
          style={styles.bookButton}
        />
      </ScrollView>

      <DatePickerComponent
        date={seleteddate}
        show={showdatepicker}
        mode="date"
        setShow={() => setshowdatepicker(false)}
        setDate={v => {
          setselectedate(v);
        }}
        daysBefore={openbefore}
        disablePrevious={true}
      />

      {showPaymentSheet && <PaymentBottomSheet />}
      {showCancelSheet && <CancelAppointmentBottomSheet />}
    </AppView>
       </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  orgDetailsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  orgName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  selectedServicesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  selectedServicesList: {
    paddingVertical: 8,
  },
  selectedServicePill: {
    backgroundColor: '#f0f7ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedServiceText: {
    color: '#1a73e8',
    fontSize: 12,
  },
  timeSelection: {
    marginTop: 8,
    backgroundColor: '#e8f0fe',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeSelectionText: {
    color: '#1a73e8',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  servicesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedServiceItem: {
    backgroundColor: '#f5f5f5',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  dateSelectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  timeSlotsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  timeSlotsGrid: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeSlotsContent: {
    paddingBottom: 8,
  },
  timeSlotButton: {
    width: '30%',
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedTimeSlot: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  bookedTimeSlot: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  bookedTimeSlotText: {
    color: '#999',
  },
  bookedText: {
    fontSize: 10,
    color: '#ff4444',
    marginTop: 4,
  },
  noSlotsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
  bookButton: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
  },
});
