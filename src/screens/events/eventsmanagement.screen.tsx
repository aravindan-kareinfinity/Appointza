import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useNavigation} from '@react-navigation/native';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {useAppSelector} from '../../redux/hooks.redux';
import {$} from '../../styles';
import {
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {AppAlert} from '../../components/appalert.component';
import {EventService} from '../../services/event.service';
import {Event, EventSelectReq, EventDeleteReq} from '../../models/event.model';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {CustomHeader} from '../../components/customheader.component';
import {Colors} from '../../constants/colors';
import {selectusercontext} from '../../redux/usercontext.redux';
import {useFocusEffect} from '@react-navigation/native';
import {BottomSheetComponent} from '../../components/bottomsheet.component';
import {AppTextInput} from '../../components/apptextinput.component';
import {AppButton} from '../../components/appbutton.component';
import {Button} from '../../components/button.component';
import {FormInput} from '../../components/forminput.component';
import {AppSingleSelect} from '../../components/appsingleselect.component';
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {OrganisationLocationSelectReq} from '../../models/organisationlocation.model';
import {FilesService} from '../../services/files.service';

type EventsManagementScreenProp = NativeStackScreenProps<
  AppStackParamList,
  'EventsManagement'
>;

export function EventsManagementScreen() {
  const navigation = useNavigation<EventsManagementScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const usercontext = useAppSelector(selectusercontext);
  const eventService = useMemo(() => new EventService(), []);
  const locationService = useMemo(() => new OrganisationLocationService(), []);
  const filesService = useMemo(() => new FilesService(), []);
  const bottomSheetRef = useRef<any>(null);

  // State management
  const [event, setEvent] = useState<Event>(new Event());
  const [eventList, setEventList] = useState<Event[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Event type options
  const eventTypeOptions = [
    {id: 'single', label: 'Single Event'},
    {id: 'range', label: 'Date Range'},
    {id: 'daily', label: 'Daily Recurring'},
  ];

  // Payment type options
  const paymentTypeOptions = [
    {id: 'userpay', label: 'User Pay'},
    {id: 'clientpay', label: 'Client Pay'},
  ];

  // Status options
  const statusOptions = [
    {id: 'active', label: 'Active'},
    {id: 'completed', label: 'Completed'},
    {id: 'cancelled', label: 'Cancelled'},
  ];

  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
      fetchLocations();
    }, []),
  );

  const fetchLocations = async () => {
    try {
      const req = new OrganisationLocationSelectReq();
      req.organisationid = usercontext.value.organisationid;
      const res = await locationService.select(req);
      setLocations(res || []);
      if (res && res.length > 0) {
        setSelectedLocationId(res[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchEvents = async () => {
    setIsloading(true);
    try {
      const req = new EventSelectReq();
      req.organisation_id = usercontext.value.organisationid;
      req.id = 0;
      req.organisation_location_id = 0;
      req.status = '';
      req.is_public = true;
      const res = await eventService.select(req);
      setEventList(res || []);
    } catch (error: any) {
      handleError(error, 'Failed to fetch events');
    } finally {
      setIsloading(false);
    }
  };

  const handleError = (error: any, defaultMessage: string) => {
    const message = error?.response?.data?.message || defaultMessage;
    AppAlert({message});
  };

  const openEventForm = (item?: Event) => {
    if (item) {
      setEvent({...item});
      setIsEditing(true);
    } else {
      const newEvent = new Event();
      newEvent.organisation_id = usercontext.value.organisationid;
      newEvent.organisation_location_id = selectedLocationId;
      newEvent.event_type = 'single';
      newEvent.payment_type = 'userpay';
      newEvent.is_public = true;
      newEvent.status = 'active'; // Default status
      newEvent.isactive = true;
      setEvent(newEvent);
      setIsEditing(false);
    }
    bottomSheetRef.current?.open();
  };

  const handleSaveEvent = async () => {
    if (!validateEvent()) return;

    try {
      setIsSaving(true);
      const eventToSave = {...event};
      eventToSave.organisation_id = usercontext.value.organisationid;
      eventToSave.organisation_location_id = selectedLocationId;
      eventToSave.created_by = usercontext.value.userid;

      if (isEditing) {
        await eventService.update(eventToSave);
        AppAlert({message: 'Event updated successfully'});
      } else {
        await eventService.insert(eventToSave);
        AppAlert({message: 'Event created successfully'});
      }

      bottomSheetRef.current?.close();
      setEvent(new Event());
      setIsEditing(false);
      fetchEvents();
    } catch (error: any) {
      handleError(error, 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  const validateEvent = (): boolean => {
    if (!event.event_name.trim()) {
      AppAlert({message: 'Please enter an event name'});
      return false;
    }

    if (!event.event_type) {
      AppAlert({message: 'Please select an event type'});
      return false;
    }

    if (event.event_type === 'single' && !event.event_date) {
      AppAlert({message: 'Please select an event date for single events'});
      return false;
    }

    if (
      event.event_type === 'range' &&
      (!event.from_date || !event.to_date)
    ) {
      AppAlert({
        message: 'Please select both from and to dates for range events',
      });
      return false;
    }

    if (event.entry_amount < 0) {
      AppAlert({message: 'Entry amount cannot be negative'});
      return false;
    }

    return true;
  };

  const handleDeleteEvent = (id: number) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsloading(true);
              const req = new EventDeleteReq();
              req.id = id;
              await eventService.delete(req);
              AppAlert({message: 'Event deleted successfully'});
              fetchEvents();
            } catch (error: any) {
              handleError(error, 'Failed to delete event');
            } finally {
              setIsloading(false);
            }
          },
        },
      ],
    );
  };

  const filteredEvents = eventList.filter(
    eventItem =>
      eventItem.event_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      eventItem.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eventItem.location?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const renderEventItem = ({item}: {item: Event}) => {
    const eventImageUrl =
      item.images?.ImageIds && item.images.ImageIds.length > 0
        ? filesService.get(item.images.ImageIds[0])
        : null;

    return (
      <TouchableOpacity
        style={[
          $.mb_small,
          $.p_regular,
          $.border_rounded,
          {
            backgroundColor: Colors.light.background,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          },
        ]}
        onPress={() => openEventForm(item)}>
        <AppView style={[$.flex_row, {justifyContent: 'space-between'}]}>
          <AppView style={[$.flex_1]}>
            <AppText style={[$.fs_medium, $.fw_semibold, $.mb_tiny, $.text_tint_1]}>
              {item.event_name}
            </AppText>
            {item.location && (
              <AppView style={[$.flex_row, $.align_items_center, $.mb_tiny]}>
                <CustomIcon
                  name={CustomIcons.LocationPin}
                  color={$.tint_3}
                  size={14}
                />
                <AppText style={[$.ml_tiny, $.fs_small, $.text_tint_3]}>
                  {item.location}
                </AppText>
              </AppView>
            )}
            <AppView style={[$.flex_row, $.align_items_center, $.mb_tiny]}>
              <CustomIcon
                name={CustomIcons.AppointmentCalendar}
                color={$.tint_3}
                size={14}
              />
              <AppText style={[$.ml_tiny, $.fs_small, $.text_tint_3]}>
                {item.event_type === 'single' && item.event_date
                  ? new Date(item.event_date).toLocaleDateString()
                  : item.event_type === 'range' && item.from_date && item.to_date
                  ? `${new Date(item.from_date).toLocaleDateString()} - ${new Date(item.to_date).toLocaleDateString()}`
                  : 'Daily Recurring'}
              </AppText>
            </AppView>
            {item.entry_amount > 0 && (
              <AppText style={[$.fs_small, $.text_primary5, $.fw_medium]}>
                Entry: ₹{item.entry_amount}
              </AppText>
            )}
            <AppView style={[$.flex_row, $.align_items_center, $.mt_tiny]}>
              <AppView
                style={[
                  $.px_tiny,
                  $.py_tiny,
                  $.border_rounded,
                  {
                    backgroundColor:
                      item.status === 'active'
                        ? '#4CAF50'
                        : item.status === 'completed'
                        ? '#2196F3'
                        : '#F44336',
                  },
                ]}>
                <AppText style={[$.fs_tiny, $.text_tint_11, {textTransform: 'uppercase'}]}>
                  {item.status}
                </AppText>
              </AppView>
            </AppView>
          </AppView>
          {eventImageUrl && (
            <AppView style={[$.ml_small, {width: 80, height: 80, borderRadius: 8, overflow: 'hidden'}]}>
              <Image
                source={{uri: eventImageUrl}}
                style={{width: '100%', height: '100%'}}
                resizeMode="cover"
              />
            </AppView>
          )}
        </AppView>
        <AppView style={[$.flex_row, $.justify_content_end, $.mt_small, {gap: 8}]}>
          <TouchableOpacity
            style={[$.p_small, $.border_rounded, {backgroundColor: $.tint_9}]}
            onPress={() => openEventForm(item)}>
            <CustomIcon name={CustomIcons.Edit} color={$.tint_1} size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[$.p_small, $.border_rounded, {backgroundColor: '#F44336'}]}
            onPress={() => handleDeleteEvent(item.id)}>
            <CustomIcon name={CustomIcons.Delete} color={$.tint_11} size={16} />
          </TouchableOpacity>
        </AppView>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <AppView style={[$.bg_tint_11, $.flex_1]}>
        <CustomHeader
          title="Events Management"
          backgroundColor={Colors.light.background}
          titleColor={Colors.light.text}
        />

        {/* Search and Add Button */}
        <AppView style={[$.px_small, $.py_small, $.flex_row, $.align_items_center, {gap: 8}]}>
          <AppView style={[$.flex_1, {marginBottom: 0}]}>
            <FormInput
              label=""
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search events..."
              containerStyle={{marginBottom: 0}}
            />
          </AppView>
          <TouchableOpacity
            style={[
              {
                width: 48,
                height: 48,
                backgroundColor: Colors.light.primary || $.tint_1,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 0,
              },
            ]}
            onPress={() => openEventForm()}>
            <CustomIcon name={CustomIcons.Plus} color={$.tint_11} size={20} />
          </TouchableOpacity>
        </AppView>

        {/* Events List */}
        {isloading ? (
          <AppView style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
            <ActivityIndicator size="large" color={$.tint_3} />
            <AppText style={[$.mt_medium, $.text_primary5]}>
              Loading events...
            </AppText>
          </AppView>
        ) : (
          <FlatList
            data={filteredEvents}
            nestedScrollEnabled={true}
            contentContainerStyle={[$.p_small]}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) => `event-${item.id}-${index}`}
            renderItem={renderEventItem}
            ListEmptyComponent={
              <AppView
                style={[
                  $.flex_1,
                  $.justify_content_center,
                  $.align_items_center,
                  $.p_large,
                ]}>
                <CustomIcon
                  color={$.tint_5}
                  name={CustomIcons.AppointmentCalendar}
                  size={48}
                />
                <AppText style={[$.mt_medium, $.text_primary5, $.text_center]}>
                  {searchTerm
                    ? 'No events found'
                    : 'No events available. Create your first event!'}
                </AppText>
              </AppView>
            }
          />
        )}

        {/* Add/Edit Event Bottom Sheet */}
        <BottomSheetComponent
          ref={bottomSheetRef}
          screenname={isEditing ? 'Edit Event' : 'Add New Event'}
          Save={handleSaveEvent}
          close={() => {
            bottomSheetRef.current?.close();
            setEvent(new Event());
            setIsEditing(false);
          }}
          showbutton={true}>
          <ScrollView nestedScrollEnabled={true} style={[$.flex_1]}>
            <FormInput
              label="Event Name *"
              value={event.event_name}
              onChangeText={text => setEvent({...event, event_name: text})}
              placeholder="Enter event name"
            />

            <AppView style={[$.mb_small]}>
              <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                Event Type *
              </AppText>
              <AppSingleSelect
                data={eventTypeOptions}
                selecteditem={eventTypeOptions.find(
                  opt => opt.id === event.event_type,
                )}
                onSelect={item => setEvent({...event, event_type: item.id})}
                renderItemLabel={item => item.label}
                keyExtractor={item => item.id}
                searchKeyExtractor={item => item.label}
                title=""
              />
            </AppView>

            {event.event_type === 'single' && (
              <TouchableOpacity
                onPress={() => {
                  // TODO: Add date picker
                  AppAlert({message: 'Date picker coming soon'});
                }}>
                <FormInput
                  label="Event Date *"
                  value={
                    event.event_date
                      ? new Date(event.event_date).toLocaleDateString()
                      : ''
                  }
                  onChangeText={() => {}}
                  placeholder="Select event date"
                  editable={false}
                />
              </TouchableOpacity>
            )}

            {event.event_type === 'range' && (
              <>
                <TouchableOpacity
                  onPress={() => {
                    // TODO: Add date picker
                    AppAlert({message: 'Date picker coming soon'});
                  }}>
                  <FormInput
                    label="From Date *"
                    value={
                      event.from_date
                        ? new Date(event.from_date).toLocaleDateString()
                        : ''
                    }
                    onChangeText={() => {}}
                    placeholder="Select from date"
                    editable={false}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    // TODO: Add date picker
                    AppAlert({message: 'Date picker coming soon'});
                  }}>
                  <FormInput
                    label="To Date *"
                    value={
                      event.to_date
                        ? new Date(event.to_date).toLocaleDateString()
                        : ''
                    }
                    onChangeText={() => {}}
                    placeholder="Select to date"
                    editable={false}
                  />
                </TouchableOpacity>
              </>
            )}

            <FormInput
              label="Location"
              value={event.location}
              onChangeText={text => setEvent({...event, location: text})}
              placeholder="Enter event location"
            />

            <FormInput
              label="Description"
              value={event.description}
              onChangeText={text => setEvent({...event, description: text})}
              placeholder="Enter event description"
              multiline={true}
              numberOfLines={4}
            />

            <FormInput
              label="Entry Amount (₹)"
              value={event.entry_amount.toString()}
              onChangeText={text =>
                setEvent({...event, entry_amount: parseFloat(text) || 0})
              }
              placeholder="Enter entry amount"
              keyboardType="numeric"
            />

            <FormInput
              label="Slot Limit"
              value={event.slot_limit.toString()}
              onChangeText={text =>
                setEvent({...event, slot_limit: parseInt(text) || 0})
              }
              placeholder="Enter slot limit"
              keyboardType="numeric"
            />

            <AppView style={[$.mb_small]}>
              <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                Payment Type
              </AppText>
              <AppSingleSelect
                data={paymentTypeOptions}
                selecteditem={paymentTypeOptions.find(
                  opt => opt.id === event.payment_type,
                )}
                onSelect={item => setEvent({...event, payment_type: item.id})}
                renderItemLabel={item => item.label}
                keyExtractor={item => item.id}
                searchKeyExtractor={item => item.label}
                title=""
              />
            </AppView>

            <FormInput
              label="Dress Code"
              value={event.dress_code}
              onChangeText={text => setEvent({...event, dress_code: text})}
              placeholder="Enter dress code (optional)"
            />

            <AppView style={[$.mb_small]}>
              <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                Status *
              </AppText>
              <AppSingleSelect
                data={statusOptions}
                selecteditem={statusOptions.find(opt => opt.id === event.status)}
                onSelect={item => setEvent({...event, status: item.id})}
                renderItemLabel={item => item.label}
                keyExtractor={item => item.id}
                searchKeyExtractor={item => item.label}
                title=""
              />
            </AppView>
          </ScrollView>
        </BottomSheetComponent>
      </AppView>
    </SafeAreaView>
  );
}

