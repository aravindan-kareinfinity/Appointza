import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CommonActions,
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useMemo, useRef, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
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
import {OrganisationSelectReq} from '../../models/organisation.model';
import {OrganisationService} from '../../services/organisation.service';
import {
  Leavereq,
  OrganisationServiceTiming,
  OrganisationServiceTimingDeleteReq,
  OrganisationServiceTimingFinal,
  OrganisationServiceTimingSelectReq,
  Weeks,
} from '../../models/organisationservicetiming.model';
import {DatePickerComponent} from '../../components/Datetimepicker.component';
import {$} from '../../styles';
import {OrganisationServiceTimingService} from '../../services/organisationservicetiming.service';
import {environment} from '../../utils/environment';
import {AppTextInput} from '../../components/apptextinput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {AppButton} from '../../components/appbutton.component';
import {AppSwitch} from '../../components/appswitch.component';
import { BottomSheetComponent } from '../../components/bottomsheet.component';

type TimingScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'Timing'>,
  BottomTabScreenProps<HomeTabParamList>
>;

export function TimingScreen() {
  const navigation = useNavigation<TimingScreenProp['navigation']>();
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
    field: 'start_time' as 'start_time' | 'end_time'
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
  }>({localid: null, dayId: null, field: 'start_time'});

  const usercontext = useAppSelector(selectusercontext);

  // Initialize days of week
  const daysOfWeek = [
    {id: Weeks.Monday, label: 'Monday'},
    {id: Weeks.Tuesday, label: 'Tuesday'},
    {id: Weeks.Wednesday, label: 'Wednesday'},
    {id: Weeks.Thursday, label: 'Thursday'},
    {id: Weeks.Friday, label: 'Friday'},
    {id: Weeks.Saturday, label: 'Saturday'},
    {id: Weeks.Sunday, label: 'Sunday'},
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
      AppAlert({message});
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
        slot.localid === slotId ? {...slot, [field]: value} : slot,
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
    setShowPicker({localid: null, dayId: null, field: 'start_time'});
  };

  const LeaveRef = useRef<any>(null);

  
  // Handle Leave Submit
  const handleLeaveSubmit = async () => {
    try {
      if (!leaveRequest.appointmentdate) {
        Alert.alert('Error', 'Please select a date');
        return;
      }

      if (!leaveRequest.isfullday && (!leaveRequest.start_time || !leaveRequest.end_time)) {
        Alert.alert('Error', 'Please select start and end time for half day leave');
        return;
      }

      // Prepare leave request data
      const leaveReq = new Leavereq();
      Object.assign(leaveReq, leaveRequest);
      
      // Call API to save leave
      const response = await organisationservicetimingservice.BookLeave(leaveReq);
      
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
      console.error('Error booking leave:', error);
      Alert.alert('Error', 'Failed to book leave');
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
    setShowTimePickerForLeave({show: false, field: 'start_time'});
  };

  // Handle location selection for leave
  const handleLocationSelect = (item: OrganisationLocation) => {
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
    <ScrollView>
      <AppView style={[$.pt_medium, $.px_normal]}>
        <AppView style={[$.mb_medium, $.flex_1]}>
          <AppText style={[$.fs_compact, $.fw_bold, $.text_primary5]}>
            Location
          </AppText>

          <FlatList
            data={organisationlocation}
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
              <AppView style={[$.flex_row,$.py_small, $.border_bottom, $.border_tint_10]}>
                <AppView style={[ ]}>
                  <AppText
                    style={[
                      $.text_tint_2,
                      $.fw_medium,
                      $.fs_compact,
                      $.text_primary5,
                    ]}>
                    {item.name}
                  </AppText>

                  <TouchableOpacity
                    onPress={() => {
                      gettimingdata(item.id);
                      setSelectedOrganisationlocation(item);
                      setModalVisible(true);
                    }}
                    style={[$.mt_extrasmall, $.flex_row, ]}>
                    <CustomIcon size={20} color={''} name={CustomIcons.Clock} />

                    <AppText style={[$.fw_bold, $.fs_compact, $.ml_extrasmall]}>
                      Edit Business Hours
                    </AppText>
                  </TouchableOpacity>
                </AppView>
                <TouchableOpacity
                  onPress={() => handleLocationSelect(item)}>
                  <AppText>Book Leave</AppText>
                </TouchableOpacity>
              </AppView>
            )}
          />
        </AppView>

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
          }}>
          <AppView style={[$.mb_medium, $.flex_1]}>
            <AppView style={[$.mb_medium]}>
              <AppText style={[$.mb_extrasmall, $.fw_medium]}>
                Select Leave Date
              </AppText>
              <TouchableOpacity
                onPress={() => setShowDatePickerForLeave(true)}
                style={[
                  $.border_rounded,
                  $.border,
                  $.p_small,
                  $.bg_tint_11,
                  $.flex_row,
                  $.align_items_center,
                ]}>
                <CustomIcon size={20} color={''} name={CustomIcons.Account} />
                <AppText style={[$.ml_small]}>
                  {selectedLeaveDate
                    ? selectedLeaveDate.toLocaleDateString()
                    : 'Select Date'}
                </AppText>
              </TouchableOpacity>
            </AppView>

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
                  Select Time Slot
                </AppText>
                <AppView style={[$.flex_row, $.align_items_center, $.mb_small]}>
                  <TouchableOpacity
                    onPress={() => 
                      setShowTimePickerForLeave({show: true, field: 'start_time'})
                    }
                    style={[
                      $.border,
                      $.border_rounded,
                      $.p_small,
                      $.flex_1,
                      $.bg_tint_11,
                    ]}>
                    <AppText style={[$.fs_compact, $.text_center]}>
                      {leaveRequest.start_time || 'Start Time'}
                    </AppText>
                  </TouchableOpacity>

                  <AppText style={[$.mx_small]}>to</AppText>

                  <TouchableOpacity
                    onPress={() => 
                      setShowTimePickerForLeave({show: true, field: 'end_time'})
                    }
                    style={[
                      $.border,
                      $.border_rounded,
                      $.p_small,
                      $.flex_1,
                      $.bg_tint_11,
                    ]}>
                    <AppText style={[$.fs_compact, $.text_center]}>
                      {leaveRequest.end_time || 'End Time'}
                    </AppText>
                  </TouchableOpacity>
                </AppView>
              </AppView>
            )}

            <AppView style={[$.mb_medium]}>
              <AppText style={[$.mb_extrasmall, $.fw_medium]}>Location</AppText>
              <AppText style={[$.text_tint_2, $.fw_medium, $.fs_compact]}>
                {Selectedorganisationlocation?.name || 'Not selected'}
              </AppText>
            </AppView>
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
            setShow={() => setShowTimePickerForLeave({show: false, field: 'start_time'})}
            setDate={handleLeaveTimeSelect}
          />
        )}

        <AppButton
          onPress={() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: 'HomeTab',
                  },
                ],
              }),
            );
          }}
          name={'Save'}></AppButton>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <AppView style={[$.bg_tint_11, $.flex_1]}>
            {/* Header */}
            <AppView
              style={[
                $.p_normal,
                $.border_bottom,
                $.border_tint_9,
                $.flex_row,
                $.align_items_center,
              ]}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[$.mr_medium]}>
                <CustomIcon size={20} color={''} name={CustomIcons.LeftArrow} />
              </TouchableOpacity>

              <AppText style={[$.fw_regular, $.fs_large]}>
                {Selectedorganisationlocation?.name}
              </AppText>
            </AppView>

            <ScrollView style={[$.flex_1, $.p_normal]}>
              {/* Settings Section */}
              <AppView style={[$.mb_medium, $.border_rounded2, $.bg_tint_11]}>
                <AppView style={[$.mb_medium]}>
                  <AppText style={[$.mb_extrasmall, $.fw_medium]}>
                    Counters
                  </AppText>
                  <AppTextInput
                    style={[
                      $.border_rounded,
                      $.border,
                      $.p_small,
                      $.bg_tint_11,
                    ]}
                    placeholder="Number of counters"
                    value={counter.toString()}
                    onChangeText={e => setCounter(parseInt(e) || 0)}
                    keyboardtype="numeric"
                  />
                </AppView>

                <AppView>
                  <AppText style={[$.mb_extrasmall, $.fw_medium]}>
                    Booking Window (days)
                  </AppText>
                  <AppTextInput
                    style={[
                      $.border_rounded,
                      $.border,
                      $.p_small,
                      $.bg_tint_11,
                    ]}
                    placeholder="Days before appointment booking"
                    value={openbefore.toString()}
                    onChangeText={e => setopenbefore(parseInt(e) || 0)}
                    keyboardtype="numeric"
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
                  ]}>
                  <AppView
                    style={[
                      $.flex_row,
                      $.align_items_center,
                      $.justify_content_start,
                      $.mb_small,
                    ]}>
                    <AppText style={[$.flex_1, $.fw_bold]}>{day.label}</AppText>
                    <TouchableOpacity
                      onPress={() => addTimeSlot(day.id)}
                      style={[
                        $.flex_row,
                        $.align_items_center,
                        $.p_small,
                        $.border_rounded,
                        $.bg_tint_10,
                      ]}>
                      <CustomIcon
                        size={20}
                        color={''}
                        name={CustomIcons.Plus}
                      />
                      <AppText style={[$.ml_extrasmall]}>Add time</AppText>
                    </TouchableOpacity>
                  </AppView>

                  {!dayTimeSlots[day.id]?.length && (
                    <AppText style={[$.text_tint_4, $.fs_compact]}>
                      No hours set
                    </AppText>
                  )}

                  {dayTimeSlots[day.id]?.map(slot => (
                    <AppView
                      key={slot.localid}
                      style={[$.flex_row, $.align_items_center, $.mb_small]}>
                      <TouchableOpacity
                        onPress={() => {
                          setShowPicker({
                            localid: slot.localid,
                            dayId: day.id,
                            field: 'start_time',
                          });
                        }}
                        style={[
                          $.border,
                          $.border_rounded,
                          $.p_small,
                          $.flex_1,
                          $.bg_tint_11,
                        ]}>
                        <AppText style={[$.fs_compact, $.text_center]}>
                          {slot.start_time instanceof Date
                            ? slot.start_time.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Start'}
                        </AppText>
                      </TouchableOpacity>

                      <AppText style={[$.mx_small]}>to</AppText>

                      <TouchableOpacity
                        onPress={() => {
                          setShowPicker({
                            localid: slot.localid,
                            dayId: day.id,
                            field: 'end_time',
                          });
                        }}
                        style={[
                          $.border,
                          $.border_rounded,
                          $.p_small,
                          $.flex_1,
                          $.bg_tint_11,
                        ]}>
                        <AppText style={[$.fs_compact, $.text_center]}>
                          {slot.end_time instanceof Date
                            ? slot.end_time.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'End'}
                        </AppText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => removeTimeSlot(day.id, slot.localid)}
                        style={[
                          $.ml_small,
                          $.p_extrasmall,
                          $.align_items_center,
                          $.justify_content_center,
                          $.border_rounded,
                          {backgroundColor: '#f5f5f5'},
                        ]}>
                        <CustomIcon
                          size={20}
                          color={''}
                          name={CustomIcons.Minus}
                        />
                      </TouchableOpacity>
                    </AppView>
                  ))}
                </AppView>
              ))}
            </ScrollView>

            {/* Footer - Save Button */}
            <AppView
              style={[$.p_normal, $.border_top, $.border_tint_9, $.bg_tint_11]}>
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
                  {backgroundColor: '#007bff'},
                ]}>
                <AppText
                  style={{fontSize: 16, color: '#fff', fontWeight: 'bold'}}>
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
    </ScrollView>
  );
}