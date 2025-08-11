import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import {
  CommonActions,
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../appstack.navigation';
import { useMemo, useRef, useState } from 'react';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {
  OrganisationLocation,
  OrganisationLocationSelectReq,
} from '../../models/organisationlocation.model';
import { useAppSelector } from '../../redux/hooks.redux';
import { selectusercontext } from '../../redux/usercontext.redux';
import { AppAlert } from '../../components/appalert.component';
import { OrganisationLocationService } from '../../services/organisationlocation.service';
import { useEffect } from 'react';
import React from 'react';
import { OrganisationSelectReq } from '../../models/organisation.model';
import { OrganisationService } from '../../services/organisation.service';
import {
  Leavereq,
  OrganisationServiceTiming,
  OrganisationServiceTimingDeleteReq,
  OrganisationServiceTimingFinal,
  OrganisationServiceTimingSelectReq,
  Weeks,
} from '../../models/organisationservicetiming.model';
import { DatePickerComponent } from '../../components/Datetimepicker.component';
import { $ } from '../../styles';
import { OrganisationServiceTimingService } from '../../services/organisationservicetiming.service';
import { environment } from '../../utils/environment';
import { FormInput } from '../../components/forminput.component';
import {
  LucideIcon,
  LucideIcons,
} from '../../components/LucideIcons.component';
import { AppButton } from '../../components/appbutton.component';
import { AppSwitch } from '../../components/appswitch.component';
import { BottomSheetComponent } from '../../components/bottomsheet.component';
import { CustomHeader } from '../../components/customheader.component';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/button.component';

type TimingScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'Timing'>,
  BottomTabScreenProps<HomeTabParamList>
>;

type TimingRouteParams = {
  fromService?: boolean;
};

export function TimingScreen() {
  const navigation = useNavigation<TimingScreenProp['navigation']>();
  const route = useRoute<RouteProp<{ params: TimingRouteParams }, 'params'>>();
  const [organisationlocation, setOrganisationlocation] = useState<
    OrganisationLocation[]
  >([]);
  const [Selectedorganisationlocation, setSelectedOrganisationlocation] =
    useState<OrganisationLocation>(new OrganisationLocation());
  const [modalVisible, setModalVisible] = useState(false);
  const [isloading, setIsloading] = useState(false);

  // Leave Management States
  const [selectedLeaveDate, setSelectedLeaveDate] = useState<Date | null>(null);
  const [leaveRequest, setLeaveRequest] = useState<Leavereq>(new Leavereq());
  const [showDatePickerForLeave, setShowDatePickerForLeave] = useState(false);
  const [showTimePickerForLeave, setShowTimePickerForLeave] = useState({
    show: false,
    field: 'start_time' as 'start_time' | 'end_time',
  });

  const organisationservice = useMemo(() => new OrganisationService(), []);
  const timingservice = useMemo(() => new OrganisationServiceTiming(), []);
  const organisationlocationservice = useMemo(
    () => new OrganisationLocationService(),
    [],
  );
  const organisationservicetimingservice = useMemo(
    () => new OrganisationServiceTimingService(),
    [],
  );
  const [counter, setCounter] = useState(0);
  const [openbefore, setopenbefore] = useState(0);

  const [showPicker, setShowPicker] = useState<{
    localid: number | null;
    dayId: number | null;
    field: 'start_time' | 'end_time';
  }>({ localid: null, dayId: null, field: 'start_time' });

  const usercontext = useAppSelector(selectusercontext);

  // Initialize days of week
  const daysOfWeek = [
    { id: Weeks.Monday, label: 'Monday' },
    { id: Weeks.Tuesday, label: 'Tuesday' },
    { id: Weeks.Wednesday, label: 'Wednesday' },
    { id: Weeks.Thursday, label: 'Thursday' },
    { id: Weeks.Friday, label: 'Friday' },
    { id: Weeks.Saturday, label: 'Saturday' },
    { id: Weeks.Sunday, label: 'Sunday' },
  ];

  // Convert time string to Date object
  const timeStringToDate = (timeString: string): Date => {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const now = new Date();
    now.setHours(hours, minutes, seconds, 0);
    return now;
  };

  // New state for managing time slots per day
  const [dayTimeSlots, setDayTimeSlots] = useState<
    Record<number, OrganisationServiceTiming[]>
  >(() => {
    const initialSlots: Record<number, OrganisationServiceTiming[]> = {};
    daysOfWeek.forEach(day => {
      initialSlots[day.id] = [];
    });
    return initialSlots;
  });

  // Check if coming from service screen
  const isFromService = route.params?.fromService === true;

  // Fetch data on focus
  useFocusEffect(
    React.useCallback(() => {
      getData();
    }, []),
  );

  // Get organization locations
  const getData = async () => {
    setIsloading(true);
    try {
      if (usercontext.value.userid > 0) {
        const locreq = new OrganisationLocationSelectReq();
        locreq.organisationid = usercontext.value.organisationid;
        const locresp = await organisationlocationservice.select(locreq);
        setOrganisationlocation(locresp || []);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message;
      AppAlert({ message });
    } finally {
      setIsloading(false);
    }
  };

  // Get timing data for a specific location
  const gettimingdata = async (id: number) => {
    try {
      const req = new OrganisationServiceTimingSelectReq();
      req.organisationid = usercontext.value.organisationid;
      req.organisationlocationid = id;
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

  // Add time slot to a specific day
  const addTimeSlot = (dayId: number) => {
    const newTiming = new OrganisationServiceTiming();
    newTiming.localid = Date.now(); // Use timestamp as unique ID
    newTiming.start_time = new Date();
    newTiming.end_time = new Date();
    newTiming.day_of_week = dayId;

    setDayTimeSlots(prev => ({
      ...prev,
      [dayId]: [...prev[dayId], newTiming],
    }));
  };

  // Remove time slot from a day
  const removeTimeSlot = (dayId: number, slotId: number) => {
    setDayTimeSlots(prev => ({
      ...prev,
      [dayId]: prev[dayId].filter(slot => slot.localid !== slotId),
    }));
  };

  // Update time slot
  const updateTimeSlot = (
    dayId: number,
    slotId: number,
    field: 'start_time' | 'end_time',
    value: Date,
  ) => {
    setDayTimeSlots(prev => ({
      ...prev,
      [dayId]: prev[dayId].map(slot =>
        slot.localid === slotId ? { ...slot, [field]: value } : slot,
      ),
    }));
  };

  // Save all time slots
  const save = async () => {
    try {
      // First delete existing timings
      const deletereq = new OrganisationServiceTimingDeleteReq();
      deletereq.organisationid = usercontext.value.organisationid;
      deletereq.organizationlocationid = Selectedorganisationlocation.id;

      await organisationservicetimingservice.delete(deletereq);

      // Prepare all time slots for saving
      const promises: Promise<any>[] = [];

      Object.entries(dayTimeSlots).forEach(([dayId, slots]) => {
        slots.forEach(slot => {
          if (slot.start_time && slot.end_time) {
            const req = new OrganisationServiceTimingFinal();

            req.start_time = slot.start_time.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            });

            req.end_time = slot.end_time.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            });

            req.modifiedby = usercontext.value.userid;
            req.organisationid = usercontext.value.organisationid;
            req.organisationlocationid = Selectedorganisationlocation.id;
            req.day_of_week = parseInt(dayId);
            req.counter = counter;
            req.openbefore = openbefore;
            console.log(req.organisationid, req.organisationlocationid);

            promises.push(organisationservicetimingservice.save(req));
          }
        });
      });

      await Promise.all(promises);
      Alert.alert(environment.baseurl, 'Successfully saved!');
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert(environment.baseurl, 'Failed to save. Please try again.');
    }
  };

  // Normalize date to UTC midnight for API
  const toUtcMidnight = (date: Date): Date => {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
  };

  const formatDateOnly = (date: Date): string => {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Handle time selection from picker
  const setSelectedTime = (selectedDate: Date) => {
    if (showPicker.localid && showPicker.dayId) {
      updateTimeSlot(
        showPicker.dayId,
        showPicker.localid,
        showPicker.field,
        selectedDate,
      );
    }
    setShowPicker({ localid: null, dayId: null, field: 'start_time' });
  };

  const LeaveRef = useRef<any>(null);

  // Handle Leave Submit
  const handleLeaveSubmit = async () => {
    try {
      if (!leaveRequest.appointmentdate) {
        Alert.alert('Error', 'Please select a date');
        return;
      }

      if (
        !leaveRequest.isfullday &&
        (!leaveRequest.start_time || !leaveRequest.end_time)
      ) {
        Alert.alert(
          'Error',
          'Please select start and end time for half day leave',
        );
        return;
      }

      // Validate required IDs
      if (!leaveRequest.organisationid || !leaveRequest.organisationlocationid) {
        Alert.alert('Error', 'Please choose a location to book leave');
        return;
      }

      // Build payload explicitly to control serialization
      const dateUtc = toUtcMidnight(selectedLeaveDate || new Date());
      const payload: any = {
        organisationid: leaveRequest.organisationid,
        organisationlocationid: leaveRequest.organisationlocationid,
        // Send date-only string to satisfy common ASP.NET DateOnly/DateTime model binders
        appointmentdate: formatDateOnly(dateUtc),
        isfullday: leaveRequest.isfullday === true,
        isforce: leaveRequest.isforce === true,
      };

      // Ensure time format HH:mm:ss for half-day; omit for full-day
      if (!leaveRequest.isfullday) {
        const start = (leaveRequest.start_time || '').length === 5
          ? `${leaveRequest.start_time}:00`
          : leaveRequest.start_time;
        const end = (leaveRequest.end_time || '').length === 5
          ? `${leaveRequest.end_time}:00`
          : leaveRequest.end_time;

        // Basic validation: start < end
        if (!start || !end) {
          Alert.alert('Error', 'Please provide both start and end time');
          return;
        }
        if (start >= end) {
          Alert.alert('Error', 'Start time must be before end time');
          return;
        }

        // Compose full DateTime strings (no timezone suffix) for backend DateTime binding
        const datePart = formatDateOnly(dateUtc);
        payload.start_time = `${datePart}T${start}`;
        payload.end_time = `${datePart}T${end}`;
      }

      console.log('BookLeave payload:', JSON.stringify(payload));

      // Call API to save leave
      const response = await organisationservicetimingservice.BookLeave(payload as any);

      if (response) {
        Alert.alert('Success', 'Leave booked successfully');
        LeaveRef.current?.close();
        // Reset leave form
        setLeaveRequest(new Leavereq());
        setSelectedLeaveDate(null);
      } else {
        Alert.alert('Error', 'Failed to book leave');
      }
    } catch (error) {
      // Surface backend validation errors if available (ASP.NET Core style)
      // @ts-ignore
      const data = error?.response?.data;
      // @ts-ignore
      const validation = data?.errors;
      let message = data?.message || 'Failed to book leave';
      if (validation && typeof validation === 'object') {
        const firstKey = Object.keys(validation)[0];
        if (firstKey && Array.isArray(validation[firstKey]) && validation[firstKey].length) {
          message = validation[firstKey][0];
        }
      }
      console.error('Error booking leave:', message, data);
      Alert.alert('Error', message);
    }
  };

  // Handle date selection for leave
  const handleLeaveDateSelect = (date: Date) => {
    setSelectedLeaveDate(date);
    const newLeaveRequest = new Leavereq();
    Object.assign(newLeaveRequest, leaveRequest);
    newLeaveRequest.appointmentdate = date;
    setLeaveRequest(newLeaveRequest);
    setShowDatePickerForLeave(false);
  };

  // Handle time selection for leave (half day)
  const handleLeaveTimeSelect = (date: Date) => {
    const newLeaveRequest = new Leavereq();
    Object.assign(newLeaveRequest, leaveRequest);

    if (showTimePickerForLeave.field === 'start_time') {
      newLeaveRequest.start_time = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } else {
      newLeaveRequest.end_time = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    }

    setLeaveRequest(newLeaveRequest);
    setShowTimePickerForLeave({ show: false, field: 'start_time' });
  };

  // Handle location selection for leave
  const handleLocationSelect = (item: OrganisationLocation) => {
    setSelectedOrganisationlocation(item);
    const newLeaveRequest = new Leavereq();
    Object.assign(newLeaveRequest, leaveRequest);
    newLeaveRequest.organisationid = item.organisationid;
    newLeaveRequest.organisationlocationid = item.id;
    setLeaveRequest(newLeaveRequest);
    LeaveRef.current?.open();
  };

  // Handle full day toggle
  const handleFullDayToggle = (value: boolean) => {
    const newLeaveRequest = new Leavereq();
    Object.assign(newLeaveRequest, leaveRequest);
    newLeaveRequest.isfullday = value;
    if (value) {
      newLeaveRequest.start_time = '';
      newLeaveRequest.end_time = '';
    }
    setLeaveRequest(newLeaveRequest);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppView style={[$.flex_1]}>
        <CustomHeader
          title="Business Hours"
          showBackButton
          backgroundColor={Colors.light.background}
          titleColor={Colors.light.text}
        />

        <FlatList
          data={organisationlocation}
          nestedScrollEnabled
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <AppView
              style={{
                marginBottom: 16,
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3,
                borderWidth: 1,
                borderColor: '#f0f0f0',
              }}
            >
              {/* Header with icon and location name */}
              <AppView
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <AppView
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#f8f9fa',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <LucideIcon
                    size={24}
                    color="#4a6da7"
                    name={LucideIcons.Home}
                  />
                </AppView>
                <AppText
                  style={{
                    fontWeight: '600',
                    fontSize: 18,
                    color: '#2c3e50',
                  }}
                >
                  {item.name}
                </AppText>
              </AppView>

              {/* Action buttons */}
              <AppView
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}
              >
                {/* Edit Hours Button */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    marginRight: 8,
                    backgroundColor: '#f8f9fa',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#e9ecef',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => {
                    gettimingdata(item.id);
                    console.log('Selected Location: ', item);

                    setSelectedOrganisationlocation(item);
                    setModalVisible(true);
                  }}
                >
                  <LucideIcon
                    size={18}
                    color="#4a6da7"
                    name={LucideIcons.Clock}
                  />
                  <AppText
                    style={{
                      marginLeft: 8,
                      color: '#4a6da7',
                      fontWeight: '500',
                      fontSize: 14,
                    }}
                  >
                    Edit Hours
                  </AppText>
                </TouchableOpacity>

                {/* Book Leave Button */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#4a6da7',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleLocationSelect(item)}
                >
                  <LucideIcon
                    size={18}
                    color="#fff"
                    name={LucideIcons.Calendar}
                  />
                  <AppText
                    style={{
                      marginLeft: 8,
                      color: '#fff',
                      fontWeight: '500',
                      fontSize: 14,
                    }}
                  >
                    Book Leave
                  </AppText>
                </TouchableOpacity>
              </AppView>
            </AppView>
          )}
        />

        {/* Leave Management Bottom Sheet */}
        <BottomSheetComponent
          ref={LeaveRef}
          screenname="Book Leave"
          Save={handleLeaveSubmit}
          showbutton={true}
          close={() => {
            LeaveRef.current?.close();
            setLeaveRequest(new Leavereq());
            setSelectedLeaveDate(null);
          }}
        >
          <AppView style={[$.mb_medium, $.flex_1]}>
            <TouchableOpacity onPress={() => setShowDatePickerForLeave(true)}>
              <FormInput
                label="Select Leave Date"
                placeholder="Select Date"
                value={
                  selectedLeaveDate
                    ? selectedLeaveDate.toLocaleDateString()
                    : ''
                }
                editable={false}
                onChangeText={() => {}}
              />
            </TouchableOpacity>

            <AppView style={[$.mb_medium]}>
              <AppText style={[$.mb_extrasmall, $.fw_medium]}>
                Leave Type
              </AppText>
              <AppView style={[$.flex_row, $.align_items_center]}>
                <AppText style={[$.mr_small]}>Half Day</AppText>
                <AppSwitch
                  value={leaveRequest.isfullday}
                  onValueChange={handleFullDayToggle}
                />
                <AppText style={[$.ml_small]}>Full Day</AppText>
              </AppView>
            </AppView>

            {!leaveRequest.isfullday && (
              <AppView style={[$.mb_medium]}>
                <AppText style={[$.mb_extrasmall, $.fw_medium]}>
                  Time Slot
                </AppText>
                <AppView style={[$.flex_row, $.align_items_center, $.mb_small]}>
                  <TouchableOpacity
                    style={[$.flex_1, $.mr_small]}
                    onPress={() =>
                      setShowTimePickerForLeave({
                        show: true,
                        field: 'start_time',
                      })
                    }
                  >
                    <FormInput
                      label="Start Time"
                      placeholder="Start Time"
                      value={leaveRequest.start_time || ''}
                      editable={false}
                      onChangeText={() => {}}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[$.flex_1]}
                    onPress={() =>
                      setShowTimePickerForLeave({
                        show: true,
                        field: 'end_time',
                      })
                    }
                  >
                    <FormInput
                      label="End Time"
                      placeholder="End Time"
                      value={leaveRequest.end_time || ''}
                      editable={false}
                      onChangeText={() => {}}
                    />
                  </TouchableOpacity>
                </AppView>
              </AppView>
            )}

            <FormInput
              label="Location"
              value={Selectedorganisationlocation?.name || 'Not selected'}
              editable={false}
              onChangeText={() => {}}
            />
          </AppView>
        </BottomSheetComponent>

        {/* Date Picker for Leave */}
        {showDatePickerForLeave && (
          <DatePickerComponent
            date={selectedLeaveDate || new Date()}
            show={showDatePickerForLeave}
            mode="date"
            setShow={() => setShowDatePickerForLeave(false)}
            setDate={handleLeaveDateSelect}
          />
        )}

        {/* Time Picker for Leave (Half Day) */}
        {showTimePickerForLeave.show && (
          <DatePickerComponent
            date={new Date()}
            show={showTimePickerForLeave.show}
            mode="time"
            setShow={() =>
              setShowTimePickerForLeave({ show: false, field: 'start_time' })
            }
            setDate={handleLeaveTimeSelect}
          />
        )}

        {isFromService && (
          <Button
            title={'Save'}
            style={[$.m_small]}
            variant="save"
            onPress={() => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'HomeTab' }],
                }),
              );
            }}
          />
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <AppView style={[$.bg_tint_11, $.flex_1]}>
            <CustomHeader
              title={Selectedorganisationlocation?.name || 'Business Hours'}
              showBackButton
              onBackPress={() => setModalVisible(false)}
              backgroundColor={Colors.light.background}
              titleColor={Colors.light.text}
            />

            <ScrollView style={[$.flex_1, $.p_normal]}>
              {/* Settings Section */}
              <AppView style={[$.mb_medium, $.border_rounded2, $.bg_tint_11]}>
                <AppView style={[$.mb_medium]}>
                  <FormInput
                    label="Counters"
                    placeholder="Number of counters"
                    value={counter.toString()}
                    onChangeText={e => setCounter(parseInt(e) || 0)}
                    keyboardType="numeric"
                  />
                </AppView>

                <AppView>
                  <FormInput
                    label="Booking Window (days)"
                    placeholder="Days before appointment booking"
                    value={openbefore.toString()}
                    onChangeText={e => setopenbefore(parseInt(e) || 0)}
                    keyboardType="numeric"
                  />
                </AppView>
              </AppView>

              {/* Days with Time Slots */}
              {daysOfWeek.map(day => (
                <AppView
                  key={day.id}
                  style={[
                    $.mb_medium,
                    $.pb_medium,
                    $.border_bottom,
                    $.border_tint_10,
                  ]}
                >
                  <AppView
                    style={[
                      $.flex_row,
                      $.align_items_center,
                      $.justify_content_start,
                      $.mb_small,
                    ]}
                  >
                    <AppText style={[$.flex_1, $.fw_bold]}>{day.label}</AppText>
                    <Button
                      title="Add"
                      variant="outline"
                      style={[]}
                      onPress={() => addTimeSlot(day.id)}
                    />
                  </AppView>

                  {!dayTimeSlots[day.id]?.length && (
                    <AppText style={[$.text_tint_4, $.fs_compact]}>
                      No hours set
                    </AppText>
                  )}

                  {dayTimeSlots[day.id]?.map(slot => (
                    <AppView
                      key={slot.localid}
                      style={[$.flex_row, $.align_items_center, $.mb_small]}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          setShowPicker({
                            localid: slot.localid,
                            dayId: day.id,
                            field: 'start_time',
                          });
                        }}
                        style={[$.flex_1, $.mr_small]}
                      >
                        <FormInput
                          label=""
                          placeholder="Start Time"
                          value={
                            slot.start_time instanceof Date
                              ? slot.start_time.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Start'
                          }
                          editable={false}
                          onChangeText={() => {}}
                        />
                      </TouchableOpacity>

                      <AppText
                        style={[$.mx_small, { color: Colors.light.text }]}
                      >
                        to
                      </AppText>

                      <TouchableOpacity
                        onPress={() => {
                          setShowPicker({
                            localid: slot.localid,
                            dayId: day.id,
                            field: 'end_time',
                          });
                        }}
                        style={[$.flex_1]}
                      >
                        <FormInput
                          label=""
                          placeholder="End Time"
                          value={
                            slot.end_time instanceof Date
                              ? slot.end_time.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'End'
                          }
                          editable={false}
                          onChangeText={() => {}}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => removeTimeSlot(day.id, slot.localid)}
                        style={[
                          $.ml_small,
                          $.p_extrasmall,
                          $.align_items_center,
                          $.justify_content_center,
                          $.border_rounded,
                          { backgroundColor: Colors.light.background },
                        ]}
                      >
                        <LucideIcon
                          size={20}
                          color={Colors.light.text}
                          name={LucideIcons.X}
                        />
                      </TouchableOpacity>
                    </AppView>
                  ))}
                </AppView>
              ))}
            </ScrollView>

            {/* Footer - Save Button */}
            <AppView style={[$.p_normal, $.bg_tint_11]}>
              <TouchableOpacity
                onPress={() => {
                  save();
                  setModalVisible(false);
                }}
                style={[
                  $.p_normal,
                  $.align_items_center,
                  $.border_rounded,
                  $.flex_row,
                  $.justify_content_center,
                  { backgroundColor: '#007bff' },
                ]}
              >
                <AppText
                  style={{ fontSize: 16, color: '#fff', fontWeight: 'bold' }}
                >
                  Save Business Hours
                </AppText>
              </TouchableOpacity>
            </AppView>

            {/* DateTime Picker */}
            {showPicker.localid !== null && (
              <DatePickerComponent
                date={
                  dayTimeSlots[showPicker.dayId!]?.find(
                    t => t.localid === showPicker.localid,
                  )?.[showPicker.field] || new Date()
                }
                show={showPicker.localid !== null}
                mode="time"
                setShow={() =>
                  setShowPicker({
                    localid: null,
                    dayId: null,
                    field: 'start_time',
                  })
                }
                setDate={setSelectedTime}
              />
            )}
          </AppView>
        </Modal>
      </AppView>
    </SafeAreaView>
  );
}
