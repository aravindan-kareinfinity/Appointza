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
  const [organisationlocation, setOrganisationlocation] = useState<
    OrganisationLocation[]
  >([]);
  const [Selectedorganisationlocation, setSelectedOrganisationlocation] =
    useState<OrganisationLocation>(new OrganisationLocation());
  const [modalVisible, setModalVisible] = useState(false);
  const [isloading, setIsloading] = useState(false);
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

  const [timingList, setTimingList] = useState<OrganisationServiceTiming[]>([]);
  const [showPicker, setShowPicker] = useState<{
    localid: number | null;
    field: 'start_time' | 'end_time';
  }>({localid: null, field: 'start_time'});

  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => {
    if (timingList.length === 0) {
      var timedefault = new OrganisationServiceTiming();
      timedefault.localid = 1;
      setTimingList([timedefault]);
    }
  }, [timingList]);

  const toggleDaySelection = (dayId: number) => {
    setSelectedDays(
      prev =>
        prev.includes(dayId)
          ? prev.filter(id => id !== dayId) // Deselect if already selected
          : [...prev, dayId], // Select if not selected
    );
  };

  const save = async () => {
    try {
      var deletereq = new OrganisationServiceTimingDeleteReq();
      deletereq.organisationid = usercontext.value.organisationid;
      deletereq.organizationlocationid = Selectedorganisationlocation.id;
      var deleteres = await organisationservicetimingservice.delete(deletereq);

      const promises: Promise<any>[] = []; // Declare promises array

      selectedDays.forEach(w => {
        timingList.forEach(v => {
          const req = new OrganisationServiceTimingFinal();

          const startTime = new Date(v.start_time);
          const endTime = new Date(v.end_time);

          req.start_time = startTime.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          });

          req.end_time = endTime.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          });

          req.modifiedby = usercontext.value.userid;
          req.organisationid = usercontext.value.organisationid;
          req.organisationlocationid = Selectedorganisationlocation.id;
          req.day_of_week = w;
          req.counter = counter;
          req.openbefore=openbefore;

          console.log('Saving timing:', req);

          // Push API call to the promises array
          promises.push(organisationservicetimingservice.save(req));
        });
      });

      // Wait for all API calls to complete
      await Promise.all(promises);

      // Show success message
      Alert.alert(environment.baseurl, 'Successfully saved!');
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert(environment.baseurl, 'Failed to save. Please try again.');
    }
  };
  const timeStringToDate = (timeString: string): Date => {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const now = new Date(); // Use current date
    now.setHours(hours, minutes, seconds, 0); // Set time
    return now;
  };

  const gettimingdata = async (id: number) => {
    try {
      var req = new OrganisationServiceTimingSelectReq();
      req.organisationid = usercontext.value.organisationid;
      req.organisationlocationid = id;
      var res = await organisationservicetimingservice.select(req);
      if (res) {
        console.log('res', res);
        const resmodify: OrganisationServiceTiming[] = [];
        const weeksres: Set<number> = new Set();
        const uniqueMap: Map<string, OrganisationServiceTiming> = new Map(); // Map to ensure unique start & end times

        let i = 0;
        res.forEach(v => {
          const startTime = timeStringToDate(v.start_time);
          const endTime = timeStringToDate(v.end_time);
          const uniqueKey = `${startTime.getTime()}-${endTime.getTime()}`; // Unique key based on start & end time

          if (!uniqueMap.has(uniqueKey)) {
            // Ensuring uniqueness based on start & end time
            const req = new OrganisationServiceTiming();
            req.id = v.id;
            req.attributes = v.attributes;
            req.createdby = v.createdby;
            req.start_time = startTime;
            req.end_time = endTime;
            req.modifiedby = v.modifiedby;
            req.day_of_week = v.day_of_week;
            req.organisationlocationid = v.organisationlocationid;
            req.localid = i;
            i += 1;

            uniqueMap.set(uniqueKey, req);
          }
          weeksres.add(v.day_of_week);
        });

        setopenbefore(res[0].openbefore)
        setCounter(res[0].counter)
        setSelectedDays(Array.from(weeksres)); // Convert Set to Array
        setTimingList(Array.from(uniqueMap.values())); // Convert Map values to Array
      }
    } catch {}
  };

  // Function to add new timing
  const addTiming = () => {
    const newTiming: OrganisationServiceTiming =
      new OrganisationServiceTiming();
    newTiming.localid = timingList.length + 1;
    newTiming.start_time = new Date();
    newTiming.end_time = new Date();

    setTimingList([...timingList, newTiming]);
  };

  // Function to delete a timing
  const deleteTiming = (localid: number) => {
    setTimingList(prevList =>
      prevList.filter(timing => timing.localid !== localid),
    );
  };

  const openPicker = (localid: number, field: 'start_time' | 'end_time') => {
    setShowPicker({localid, field});
  };

  const setSelectedTime = (selectedDate: Date) => {
    if (showPicker.localid !== null) {
      setTimingList(prevList =>
        prevList.map(item =>
          item.localid === showPicker.localid
            ? {...item, [showPicker.field]: new Date(selectedDate)}
            : item,
        ),
      );
    }
    setShowPicker({localid: null, field: 'start_time'}); // Close picker
  };

  const usercontext = useAppSelector(selectusercontext);
  useFocusEffect(
    React.useCallback(() => {
      getData();
    }, []),
  );

  const getData = async () => {
    setIsloading(true);
    try {
      if (usercontext.value.userid > 0) {
        var locreq: OrganisationLocationSelectReq =
          new OrganisationLocationSelectReq();
        locreq.organisationid = usercontext.value.organisationid;
        let locresp = await organisationlocationservice.select(locreq);
        setOrganisationlocation(locresp || []);
      }
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message});
    } finally {
      setIsloading(false);
    }
  };

  const daysOfWeek = [
    {id: Weeks.Monday, label: 'Monday'},
    {id: Weeks.Tuesday, label: 'Tuesday'},
    {id: Weeks.Wednesday, label: 'Wednesday'},
    {id: Weeks.Thursday, label: 'Thursday'},
    {id: Weeks.Friday, label: 'Friday'},
    {id: Weeks.Saturday, label: 'Saturday'},
    {id: Weeks.Sunday, label: 'Sunday'},
  ];

  // Default selected days: Monday, Wednesday, and Friday
  const defaultSelectedDays = [Weeks.Monday, Weeks.Wednesday, Weeks.Friday];
  return (
    <ScrollView>
      <AppView style={[$.px_normal, $.mb_medium, $.pt_medium]}>
        <AppText style={[$.fs_enormous, $.fw_bold, $.flex_1, $.text_tint_9]}>
          Location {usercontext.value.organisationid}
        </AppText>
        <FlatList
          data={organisationlocation}
          nestedScrollEnabled={true}
          // refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item, index}) => {
            return (
              <AppView>
                <TouchableOpacity
                  onPress={() => {
                    gettimingdata(item.id);
                    setSelectedOrganisationlocation(item);
                    setModalVisible(true);
                  }}>
                  <AppText style={[$.p_small, $.text_tint_2, $.fw_medium]}>
                    {item.name} - {item.city}
                  </AppText>
                </TouchableOpacity>
              </AppView>
            );
          }}
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <AppView
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              paddingHorizontal: 20,
            }}>
            <AppView
              style={[
                $.bg_tint_11,
                {
                  width: '95%',
                  height: '90%', // Fixed to half the screen height
                  borderRadius: 20,

                  elevation: 5,
                  padding: 20,
                },
              ]}>
              <AppTextInput
                style={[$.border_bottom, $.border_tint_11, $.bg_tint_11]}
                placeholder="Counters "
                value={counter.toString()}
                onChangeText={e => {
                  setCounter(parseInt(e));
                }}
              />

              <AppTextInput
                style={[$.border_bottom, $.border_tint_11, $.bg_tint_11]}
                placeholder="How many days before can we book an appointment? "
                value={openbefore.toString()}
                onChangeText={e => {
                    setopenbefore(parseInt(e));
                }}
              />
              {/* Days of the Week Selection */}
              <AppView
                style={[
                  $.flex_row,
                  $.flex_wrap_wrap,
                  $.justify_content_start,
                  {gap: 4},
                ]}>
                {daysOfWeek.map(day => (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      $.border_rounded,
                      $.border,
                      $.align_items_center,
                      $.justify_content_center,
                      {
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        borderColor: selectedDays.includes(day.id)
                          ? $.tint_5
                          : $.tint_8,
                        backgroundColor: selectedDays.includes(day.id)
                          ? $.tint_5
                          : $.tint_11,
                      },
                    ]}
                    onPress={() => toggleDaySelection(day.id)}>
                    <AppText
                      style={{
                        fontSize: 16,
                        color: selectedDays.includes(day.id) ? '#fff' : '#333',
                        fontWeight: 'bold',
                      }}>
                      {day.label.charAt(0)}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </AppView>
              {/* Scrollable Content */}
              <ScrollView contentContainerStyle={{flexGrow: 1}}>
                {/* Timing List */}
                <FlatList
                  data={timingList}
                  keyExtractor={item => item.localid.toString()}
                  contentContainerStyle={{marginVertical: 15, gap: 10}}
                  renderItem={({item}) => (
                    <AppView
                      style={[$.flex_row, $.p_tiny, $.align_items_center]}>
                      <AppView style={[$.flex_row]}>
                        {/* Start Time Picker */}
                        <TouchableOpacity
                          onPress={() => openPicker(item.localid, 'start_time')}
                          style={[
                            $.border,
                            $.border_rounded,
                            $.p_small,
                            $.mr_small,
                            $.align_items_center,
                            $.justify_content_center,
                            $.bg_tint_10,
                            $.border_tint_7,
                            {
                              width: 100,
                              height: 40,
                              borderRadius: 20,
                            },
                          ]}>
                          <AppText
                            style={{
                              fontSize: 14,
                              fontWeight: 'bold',
                              color: '#333',
                            }}>
                            {item.start_time instanceof Date
                              ? item.start_time.toLocaleTimeString()
                              : 'Select Time'}
                          </AppText>
                        </TouchableOpacity>

                        {/* End Time Picker */}
                        <TouchableOpacity
                          onPress={() => openPicker(item.localid, 'end_time')}
                          style={[
                            $.border,
                            $.border_rounded,
                            $.p_small,
                            $.mr_small,
                            $.align_items_center,
                            $.justify_content_center,
                            $.bg_tint_10,
                            $.border_tint_7,
                            {
                              width: 100,
                              height: 40,
                              borderRadius: 20,
                            },
                          ]}>
                          <AppText
                            style={{
                              fontSize: 14,
                              fontWeight: 'bold',
                              color: '#333',
                            }}>
                            {item.end_time instanceof Date
                              ? item.end_time.toLocaleTimeString()
                              : 'Select Time'}
                          </AppText>
                        </TouchableOpacity>
                      </AppView>

                      {/* Delete Button */}
                      <TouchableOpacity
                        onPress={() => deleteTiming(item.localid)}>
                        <AppText
                          style={[
                            $.text_tint_4,
                            {fontSize: 15, fontWeight: 'bold'},
                          ]}>
                          ×
                        </AppText>
                      </TouchableOpacity>
                    </AppView>
                  )}
                />
                {/* Show DateTimePicker when needed */}
                {showPicker.localid !== null && showPicker.field !== null && (
                  <DatePickerComponent
                    date={
                      timingList.find(t => t.localid === showPicker.localid)?.[
                        showPicker.field
                      ] || new Date()
                    }
                    show={showPicker.localid !== null}
                    mode="time"
                    setShow={() =>
                      setShowPicker({localid: null, field: 'start_time'})
                    }
                    setDate={setSelectedTime}
                  />
                )}
              </ScrollView>

              {/* Add Hours Button */}
              <TouchableOpacity onPress={addTiming} style={[]}>
                <AppText style={[]}>+ Add Hours</AppText>
              </TouchableOpacity>

              <AppView style={[$.flex_row]}>
                {/* Close Button */}
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[
                    $.flex_1,
                    $.m_tiny,
                    $.align_items_center,
                    {
                      marginTop: 10,
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: '#ddd',
                    },
                  ]}>
                  <AppText
                    style={{fontSize: 14, color: '#333', fontWeight: 'bold'}}>
                    Close
                  </AppText>
                </TouchableOpacity>

                {/* Close Button */}
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
                      marginTop: 10,
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderRadius: 10,
                    },
                  ]}>
                  <AppText
                    style={{fontSize: 14, color: '#333', fontWeight: 'bold'}}>
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
