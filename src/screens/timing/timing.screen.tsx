import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useMemo, useState} from 'react';
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

type TimingScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'Timing'>,
  BottomTabScreenProps<HomeTabParamList>
>;

export function TimingScreen() {
  const navigation = useNavigation<TimingScreenProp['navigation']>();
  const [organisationlocation, setOrganisationlocation] = useState<OrganisationLocation[]>([]);
  const [Selectedorganisationlocation, setSelectedOrganisationlocation] = 
    useState<OrganisationLocation>(new OrganisationLocation());
  const [modalVisible, setModalVisible] = useState(false);
  const [isloading, setIsloading] = useState(false);
  const organisationservice = useMemo(() => new OrganisationService(), []);
  const timingservice = useMemo(() => new OrganisationServiceTiming(), []);
  const organisationlocationservice = useMemo(() => new OrganisationLocationService(), []);
  const organisationservicetimingservice = useMemo(() => new OrganisationServiceTimingService(), []);

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
    const [dayTimeSlots, setDayTimeSlots] = useState<Record<number, OrganisationServiceTiming[]>>(() => {
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
      [dayId]: [...prev[dayId], newTiming]
    }));
  };

  // Remove time slot from a day
  const removeTimeSlot = (dayId: number, slotId: number) => {
    setDayTimeSlots(prev => ({
      ...prev,
      [dayId]: prev[dayId].filter(slot => slot.localid !== slotId)
    }));
  };

  // Update time slot
  const updateTimeSlot = (dayId: number, slotId: number, field: 'start_time' | 'end_time', value: Date) => {
    setDayTimeSlots(prev => ({
      ...prev,
      [dayId]: prev[dayId].map(slot => 
        slot.localid === slotId ? {...slot, [field]: value} : slot
      )
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
        selectedDate
      );
    }
    setShowPicker({localid: null, dayId: null, field: 'start_time'});
  };

  return (
    <ScrollView>
      <AppView style={[$.px_normal, $.mb_medium, $.pt_medium]}>
        <AppText style={[$.fs_compact, $.fw_bold, $.flex_1, $.px_small, $.text_primary5]}>
          Location
        </AppText>
        <FlatList
          data={organisationlocation}
          nestedScrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item, index}) => {
            return (
              <AppView>
                <AppView>
                  <AppText style={[$.p_small, $.text_tint_2, $.fw_medium, $.fs_compact, $.text_primary5]}>
                    {item.name} - {item.city}
                  </AppText>

                  <TouchableOpacity 
                    onPress={() => {
                      gettimingdata(item.id);
                      setSelectedOrganisationlocation(item);
                      setModalVisible(true);
                    }}
                    style={[$.mb_small]}>
                    <AppText style={[$.fw_bold, $.fs_compact]}>
                      Edit Business Hours
                    </AppText>
                  </TouchableOpacity>
                </AppView>
              </AppView>
            );
          }}
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <AppView style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            paddingHorizontal: 20,
          }}>
            <AppView style={[
              $.bg_tint_11,
              {
                width: '95%',
                height: '90%',
                borderRadius: 20,
                elevation: 5,
                padding: 20,
              },
            ]}>
              <AppTextInput
                style={[$.border_bottom, $.border_tint_11, $.bg_tint_11]}
                placeholder="Counters"
                value={counter.toString()}
                onChangeText={e => setCounter(parseInt(e) || 0)}
                keyboardtype="numeric"
              />

              <AppTextInput
                style={[$.border_bottom, $.border_tint_11, $.bg_tint_11]}
                placeholder="How many days before can we book an appointment?"
                value={openbefore.toString()}
                onChangeText={e => setopenbefore(parseInt(e) || 0)}
                keyboardtype="numeric"
              />

              {/* Days with Time Slots */}
              <ScrollView style={{flex: 1}}>
                {daysOfWeek.map(day => (
                  <AppView key={day.id} style={[$.mb_medium]}>
                    <AppView style={[$.flex_row, $.align_items_center, $.mb_small]}>
                      <AppText style={[$.flex_1, $.fw_bold]}>{day.label}</AppText>
                      <TouchableOpacity
                        onPress={() => addTimeSlot(day.id)}
                        style={[
                          $.border,
                          $.border_rounded,
                          $.p_small,
                          {
                            borderColor: $.tint_5,
                            backgroundColor: $.tint_11,
                          },
                        ]}>
                        <AppText style={{color: $.tint_5}}>+ Add time</AppText>
                      </TouchableOpacity>
                    </AppView>

                    {dayTimeSlots[day.id]?.map((slot) => (
                      <AppView key={slot.localid} style={[$.flex_row, $.align_items_center, $.mb_small, {gap: 8}]}>
                        <TouchableOpacity
                          onPress={() => {
                            setShowPicker({
                              localid: slot.localid,
                              dayId: day.id,
                              field: 'start_time'
                            });
                          }}
                          style={[
                            $.border,
                            $.border_rounded,
                            $.p_small,
                            {
                              flex: 1,
                              height: 40,
                              borderColor: $.tint_7,
                              backgroundColor: $.tint_10,
                            },
                          ]}>
                          <AppText>
                            {slot.start_time instanceof Date 
                              ? slot.start_time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                              : 'Start time'}
                          </AppText>
                        </TouchableOpacity>

                        <AppText>to</AppText>

                        <TouchableOpacity
                          onPress={() => {
                            setShowPicker({
                              localid: slot.localid,
                              dayId: day.id,
                              field: 'end_time'
                            });
                          }}
                          style={[
                            $.border,
                            $.border_rounded,
                            $.p_small,
                            {
                              flex: 1,
                              height: 40,
                              borderColor: $.tint_7,
                              backgroundColor: $.tint_10,
                            },
                          ]}>
                          <AppText>
                            {slot.end_time instanceof Date 
                              ? slot.end_time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                              : 'End time'}
                          </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => removeTimeSlot(day.id, slot.localid)}
                          style={[
                            {
                              width: 30,
                              height: 30,
                              alignItems: 'center',
                              justifyContent: 'center',
                            },
                          ]}>
                          <AppText style={[$.text_tint_4, {fontSize: 20}]}>×</AppText>
                        </TouchableOpacity>
                      </AppView>
                    ))}
                  </AppView>
                ))}
              </ScrollView>

              {/* DateTime Picker */}
              {showPicker.localid !== null && (
                <DatePickerComponent
                  date={
                    dayTimeSlots[showPicker.dayId!]?.find(t => t.localid === showPicker.localid)?.[
                      showPicker.field
                    ] || new Date()
                  }
                  show={showPicker.localid !== null}
                  mode="time"
                  setShow={() => setShowPicker({localid: null, dayId: null, field: 'start_time'})}
                  setDate={setSelectedTime}
                />
              )}

              <AppView style={[$.flex_row, $.mt_medium]}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[
                    $.flex_1,
                    $.m_tiny,
                    $.align_items_center,
                    {
                      paddingVertical: 12,
                      borderRadius: 10,
                      backgroundColor: '#ddd',
                    },
                  ]}>
                  <AppText style={{fontSize: 16, color: '#333', fontWeight: 'bold'}}>
                    Close
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    save();
                    setModalVisible(false);
                  }}
                  style={[
                    $.flex_1,
                    $.m_tiny,
                    $.align_items_center,
                    $.bg_tint_10,
                    {
                      paddingVertical: 12,
                      borderRadius: 10,
                    },
                  ]}>
                  <AppText style={{fontSize: 16, color: '#333', fontWeight: 'bold'}}>
                    Save
                  </AppText>
                </TouchableOpacity>
              </AppView>
            </AppView>
          </AppView>
        </Modal>
      </AppView>
    </ScrollView>
  );
}