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
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {useAppDispatch, useAppSelector} from '../../redux/hooks.redux';
import {$} from '../../styles';
import {FlatList, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal, View, SafeAreaView} from 'react-native';
import {AppAlert} from '../../components/appalert.component';
import {FilesService} from '../../services/files.service';
import {EventService} from '../../services/event.service';
import {
  Event,
  EventSelectReq,
} from '../../models/event.model';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {DayOfWeekUtil} from '../../utils/dayofweek.util';
import { CustomHeader } from '../../components/customheader.component';
import { Colors } from '../../constants/colors';
import { OrganizationCard } from '../../components/organizationcard.component';
import { OrganisationService } from '../../services/organisation.service';
import { OrganisationSelectReq } from '../../models/organisation.model';
import { AppTextInput } from '../../components/apptextinput.component';
import {selectiscustomer} from '../../redux/iscustomer.redux';
import { BottomSheetComponent } from '../../components/bottomsheet.component';

type EventScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Events'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function EventScreen() {
  const navigation = useNavigation<EventScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const eventService = useMemo(() => new EventService(), []);
  const filesService = useMemo(() => new FilesService(), []);
  const organisationService = useMemo(() => new OrganisationService(), []);
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  
  // Bottom sheet refs for filters
  const paymentTypeSheetRef = useRef<any>(null);
  const eventTypeSheetRef = useRef<any>(null);
  
  const isLoggedIn = useAppSelector(selectiscustomer).isLoggedIn;
  const isCustomer = useAppSelector(selectiscustomer).isCustomer;
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all'); // 'all', 'userpay', 'clientpay'
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all'); // 'all', 'single', 'range', 'daily'
  
  // Filter options
  const paymentTypeOptions = [
    { id: 'all', label: 'All Payment Types' },
    { id: 'userpay', label: 'User Pay' },
    { id: 'clientpay', label: 'Client Pay' },
  ];
  
  const eventTypeOptions = [
    { id: 'all', label: 'All Event Types' },
    { id: 'single', label: 'Single Event' },
    { id: 'range', label: 'Date Range' },
    { id: 'daily', label: 'Daily Recurring' },
  ];
  
  // Get selected payment type option
  const selectedPaymentType = paymentTypeOptions.find(opt => opt.id === paymentTypeFilter) || paymentTypeOptions[0];
  
  // Get selected event type option
  const selectedEventType = eventTypeOptions.find(opt => opt.id === eventTypeFilter) || eventTypeOptions[0];

  // Fetch initial data
  const getInitialData = async () => {
    try {
      setIsloading(true);
      setIsRefreshing(true);
      const req = new EventSelectReq();
      req.id = 0;
      req.organisation_id = 0;
      req.organisation_location_id = 0;
      req.status = 'active';
      req.is_public = true;
      
      const res = await eventService.select(req);
      if (res) {
        // Filter for active, public events that are not cancelled or completed
        const activeEvents = res.filter(
          event => 
            event.isactive && 
            event.is_public && 
            event.status !== 'cancelled' && 
            event.status !== 'completed'
        );
        setEventsList(activeEvents);
        applyFilters(activeEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      AppAlert({message: 'Failed to load events'});
    } finally {
      setIsloading(false);
      setIsRefreshing(false);
    }
  };

  // Apply filters
  const applyFilters = useCallback((events: Event[]) => {
    let filtered = [...events];
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.event_name.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location?.toLowerCase().includes(term) ||
        event.event_type.toLowerCase().includes(term)
      );
    }
    
    // Apply payment type filter
    if (paymentTypeFilter !== 'all') {
      filtered = filtered.filter(event => event.payment_type === paymentTypeFilter);
    }
    
    // Apply event type filter
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(event => event.event_type === eventTypeFilter);
    }
    
    setFilteredEvents(filtered);
  }, [searchTerm, paymentTypeFilter, eventTypeFilter]);

  // Re-apply filters when selections change
  useEffect(() => {
    applyFilters(eventsList);
  }, [searchTerm, paymentTypeFilter, eventTypeFilter, eventsList, applyFilters]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setPaymentTypeFilter('all');
    setEventTypeFilter('all');
  };

  // Helper functions
  const getDayName = (dayNumber: number): string => {
    return DayOfWeekUtil.getDayNameFromNumber(dayNumber);
  };

  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hourNum = parseInt(hours, 10);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum % 12 || 12;
      return `${displayHour}:${minutes} ${period}`;
    } catch (e) {
      return timeString;
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Date not specified';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getEventImage = (event: Event): string | undefined => {
    if (event.images?.ImageIds && event.images.ImageIds.length > 0) {
      return filesService.get(event.images.ImageIds[0]);
    }
    return undefined;
  };

  const getEventLocation = async (event: Event): Promise<string> => {
    try {
      if (event.location) {
        return event.location;
      }
      // Try to get organization location details
      if (event.organisation_id && event.organisation_location_id) {
        const orgReq = new OrganisationSelectReq();
        orgReq.organisationid = event.organisation_id;
        // For now, return a placeholder
        return 'Location details available';
      }
      return 'Location not specified';
    } catch (e) {
      return 'Location not available';
    }
  };

  const handleEventPress = async (event: Event) => {
    // Always navigate to booking screen when clicked
    navigation.navigate('EventBooking', { eventId: event.id });
  };
  
  const handleBookEvent = (event: Event) => {
    // Check if user is logged in
    if (!isLoggedIn || !isCustomer) {
      AppAlert({
        message: 'Please log in to book events',
        onPress: () => {
          navigation.navigate('Login');
        },
      });
      return;
    }
    // Navigate to booking screen
    navigation.navigate('EventBooking', { eventId: event.id });
  };

  useFocusEffect(
    useCallback(() => {
      getInitialData();
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppView style={[$.bg_tint_11, $.flex_1]}>
        <CustomHeader
          title="Events"
          backgroundColor={Colors.light.background}
          titleColor={Colors.light.text}
        />

        {/* Filters Section */}
        <AppView style={[$.px_small, $.py_tiny, $.bg_tint_11]}>
          {/* Search Input */}
          <AppView style={[$.mb_tiny]}>
            <AppView style={[$.flex_row, $.align_items_center, $.border, $.border_tint_9, $.border_rounded, $.bg_tint_11, $.px_small, $.py_tiny]}>
              <CustomIcon
                name={CustomIcons.Search}
                color={$.tint_3}
                size={16}
              />
              <AppTextInput
                placeholder="Search events..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                style={[$.flex_1, $.ml_tiny]}
              />
            </AppView>
          </AppView>

          {/* Filter Buttons Row */}
          <AppView style={[$.flex_row, { gap: 6 }]}>
            {/* Payment Type Filter */}
            <TouchableOpacity
              style={[
                $.flex_1,
                $.px_small,
                $.py_tiny,
                $.border,
                $.border_tint_9,
                $.border_rounded,
                $.bg_tint_11,
                $.flex_row,
                $.align_items_center,
                $.justify_content_space_between,
              ]}
              onPress={() => paymentTypeSheetRef.current?.open()}>
              <AppView>
                <AppText style={[$.fs_tiny, $.text_tint_5, $.mb_tiny]}>
                  Payment Type
                </AppText>
                <AppText style={[$.fs_small, $.text_tint_1]}>
                  {selectedPaymentType.label}
                </AppText>
              </AppView>
              <CustomIcon
                name={CustomIcons.ChevronDown}
                color={$.tint_3}
                size={16}
              />
            </TouchableOpacity>

            {/* Event Type Filter */}
            <TouchableOpacity
              style={[
                $.flex_1,
                $.px_small,
                $.py_tiny,
                $.border,
                $.border_tint_9,
                $.border_rounded,
                $.bg_tint_11,
                $.flex_row,
                $.align_items_center,
                $.justify_content_space_between,
              ]}
              onPress={() => eventTypeSheetRef.current?.open()}>
              <AppView>
                <AppText style={[$.fs_tiny, $.text_tint_5, $.mb_tiny]}>
                  Event Type *
                </AppText>
                <AppText style={[$.fs_small, $.text_tint_1]}>
                  {selectedEventType.label}
                </AppText>
              </AppView>
              <CustomIcon
                name={CustomIcons.ChevronDown}
                color={$.tint_3}
                size={16}
              />
            </TouchableOpacity>
          </AppView>

          {/* Clear Filters Button */}
          {(paymentTypeFilter !== 'all' || eventTypeFilter !== 'all' || searchTerm.trim()) && (
            <TouchableOpacity
              style={[
                $.mt_tiny,
                $.px_small,
                $.py_tiny,
                $.bg_tint_3,
                $.border_rounded,
                $.align_items_center,
              ]}
              onPress={clearFilters}>
              <AppText style={[$.text_tint_11, $.fw_semibold, $.fs_tiny]}>
                Clear Filters
              </AppText>
            </TouchableOpacity>
          )}
        </AppView>

        {/* Loading indicator when initial data is loading */}
        {isloading && !isRefreshing ? (
          <AppView
            style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
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
            showsHorizontalScrollIndicator={false}
            refreshing={isRefreshing}
            onRefresh={getInitialData}
            keyExtractor={(item, index) => `event-${item.id}-${index}`}
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
                  name={CustomIcons.Search}
                  size={$.s_large}
                />
                <AppText style={[$.mt_medium, $.text_primary5, $.text_center]}>
                  {searchTerm || paymentTypeFilter !== 'all' || eventTypeFilter !== 'all'
                    ? 'No events found'
                    : 'No events available'}
                </AppText>
                {(searchTerm || paymentTypeFilter !== 'all' || eventTypeFilter !== 'all') && (
                  <AppText style={[$.mt_small, $.text_tint_3, $.text_center, $.fs_small]}>
                    Try adjusting your filters or search terms
                  </AppText>
                )}
              </AppView>
            }
            renderItem={({item}) => {
              const eventImage = getEventImage(item);
              return (
                <TouchableOpacity
                  style={[$.mb_normal]}
                  onPress={() => handleEventPress(item)}
                  activeOpacity={0.7}>
                  <AppView
                    style={{
                      backgroundColor: Colors.light.background,
                      borderRadius: 12,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                      overflow: 'hidden',
                    }}>
                    {eventImage && (
                      <AppView style={{ width: '100%', height: 150, overflow: 'hidden' }}>
                        <Image 
                          source={{ uri: eventImage }} 
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </AppView>
                    )}
                    <AppView style={[$.p_regular]}>
                      <AppText style={[$.fs_regular, $.fw_semibold, $.text_tint_1, $.mb_small]}>
                        {item.event_name || 'Unnamed Event'}
                      </AppText>
                      {item.location && (
                        <AppView style={[$.flex_row, $.align_items_center, $.mb_small]}>
                          <CustomIcon
                            name={CustomIcons.LocationPin}
                            color={$.tint_3}
                            size={16}
                          />
                          <AppText 
                            style={[$.fs_small, $.text_tint_3, $.ml_tiny, $.flex_1]}
                          >
                            {item.location}
                          </AppText>
                        </AppView>
                      )}
                      <AppView style={[$.flex_row, $.align_items_center, $.mb_small]}>
                        <CustomIcon
                          name={CustomIcons.AppointmentCalendar}
                          color={$.tint_3}
                          size={16}
                        />
                        <AppText style={[$.fs_small, $.text_tint_3, $.ml_tiny]}>
                          {item.event_type === 'single' && item.event_date
                            ? formatDate(item.event_date)
                            : item.event_type === 'range' && item.from_date && item.to_date
                            ? `${formatDate(item.from_date)} - ${formatDate(item.to_date)}`
                            : 'Ongoing event'}
                        </AppText>
                      </AppView>
                      {item.entry_amount > 0 && (
                        <AppText style={[$.fs_small, $.text_primary5, $.fw_medium, $.mb_small]}>
                          Entry: ₹{item.entry_amount}
                        </AppText>
                      )}
                      {/* Book Button - Only show if logged in and slots available */}
                      {isLoggedIn && isCustomer && item.remainingslot > 0 && (
                        <TouchableOpacity
                          style={[
                            $.mt_small,
                            $.p_small,
                            $.bg_tint_1,
                            $.border_rounded,
                            $.align_items_center,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleBookEvent(item);
                          }}>
                          <AppText style={[$.text_tint_11, $.fw_semibold, $.fs_small]}>
                            Book Slot
                          </AppText>
                        </TouchableOpacity>
                      )}
                      {isLoggedIn && isCustomer && (!item.remainingslot || item.remainingslot === 0) && (
                        <AppView style={[
                          $.mt_small,
                          $.p_small,
                          $.bg_tint_9,
                          $.border_rounded,
                          $.align_items_center,
                        ]}>
                          <AppText style={[$.text_tint_3, $.fw_semibold, $.fs_small]}>
                            Fully Booked
                          </AppText>
                        </AppView>
                      )}
                    </AppView>
                  </AppView>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Event Details Modal */}
        <Modal
          visible={showEventDetails}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowEventDetails(false)}>
          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}>
            <View style={{ 
              width: '90%',
              maxHeight: '80%',
              backgroundColor: 'white',
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 5
            }}>
              {/* Header */}
              <AppView style={[
                $.flex_row, 
                $.align_items_center, 
                $.p_medium, 
                { 
                  borderBottomWidth: 1, 
                  borderBottomColor: 'rgba(0,0,0,0.1)',
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  backgroundColor: 'rgba(0,0,0,0.02)'
                }
              ]}>
                <AppText style={[$.fs_medium, $.fw_semibold, $.flex_1]}>
                  Event Details
                </AppText>
                <TouchableOpacity
                  onPress={() => setShowEventDetails(false)}
                  style={[
                    $.p_tiny,
                    $.border_rounded,
                    { backgroundColor: 'rgba(0,0,0,0.05)' }
                  ]}>
                  <CustomIcon
                    name={CustomIcons.Close}
                    color={$.tint_2}
                    size={$.s_small}
                  />
                </TouchableOpacity>
              </AppView>

              {/* Content */}
              {selectedEvent && (
                <ScrollView 
                  contentContainerStyle={{padding: 16}}
                  showsVerticalScrollIndicator={false}>
                  {/* Event Name */}
                  <AppText style={[$.fs_normal, $.fw_bold, $.mb_small, $.text_primary5]}>
                    {selectedEvent.event_name || 'Event Name Not Available'}
                  </AppText>
                  
                  {/* Location Section */}
                  {selectedEvent.location && (
                    <AppView style={[$.mb_small, $.p_small, $.border_rounded, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                      <AppView style={[$.flex_row, $.align_items_center, $.mb_tiny]}>
                        <CustomIcon
                          name={CustomIcons.LocationPin}
                          color={$.tint_2}
                          size={$.s_small}
                        />
                        <AppText style={[$.ml_small, $.text_tint_ash, $.fw_medium, $.fs_small]}>
                          Location
                        </AppText>
                      </AppView>
                      <AppText style={[$.text_tint_ash, $.ml_small, $.fs_small]}>
                        {selectedEvent.location}
                      </AppText>
                    </AppView>
                  )}

                  {/* Date Section */}
                    <AppView style={[$.mb_small, $.p_small, $.border_rounded, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                      <AppView style={[$.flex_row, $.align_items_center, $.mb_tiny]}>
                        <CustomIcon
                          name={CustomIcons.AppointmentCalendar}
                          color={$.tint_2}
                          size={$.s_small}
                        />
                        <AppText style={[$.ml_small, $.text_tint_ash, $.fw_medium, $.fs_small]}>
                          Date & Time
                        </AppText>
                      </AppView>
                    <AppText style={[$.text_tint_ash, $.ml_small, $.fs_small]}>
                      {selectedEvent.event_type === 'single' && selectedEvent.event_date
                        ? formatDate(selectedEvent.event_date)
                        : selectedEvent.event_type === 'range' && selectedEvent.from_date && selectedEvent.to_date
                        ? `${formatDate(selectedEvent.from_date)} - ${formatDate(selectedEvent.to_date)}`
                        : selectedEvent.event_type === 'daily'
                        ? 'Daily Event'
                        : 'Date not specified'}
                    </AppText>
                  </AppView>

                  {/* Description */}
                  {selectedEvent.description && (
                    <AppView style={[$.mb_small, $.p_small, $.border_rounded, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                      <AppText style={[$.text_tint_ash, $.fw_medium, $.fs_small, $.mb_tiny]}>
                        Description
                      </AppText>
                      <AppText style={[$.text_tint_ash, $.fs_small]}>
                        {selectedEvent.description}
                      </AppText>
                    </AppView>
                  )}

                  {/* Entry Amount */}
                  {selectedEvent.entry_amount > 0 && (
                    <AppView style={[$.mb_small, $.p_small, $.border_rounded, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                      <AppText style={[$.text_tint_ash, $.fw_medium, $.fs_small, $.mb_tiny]}>
                        Entry Fee
                      </AppText>
                      <AppText style={[$.text_primary5, $.fw_semibold, $.fs_normal]}>
                        ₹{selectedEvent.entry_amount}
                      </AppText>
                    </AppView>
                  )}

                  {/* Slot Information */}
                  {selectedEvent.slot_limit > 0 && (
                    <AppView style={[$.mb_small, $.p_small, $.border_rounded, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                      <AppText style={[$.text_tint_ash, $.fw_medium, $.fs_small, $.mb_tiny]}>
                        Available Slots
                      </AppText>
                      <AppText style={[$.text_primary5, $.fs_small]}>
                        {selectedEvent.remainingslot} of {selectedEvent.slot_limit} slots available
                      </AppText>
                    </AppView>
                  )}

                  {/* Dress Code */}
                  {selectedEvent.dress_code && (
                    <AppView style={[$.mb_small, $.p_small, $.border_rounded, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                      <AppText style={[$.text_tint_ash, $.fw_medium, $.fs_small, $.mb_tiny]}>
                        Dress Code
                      </AppText>
                      <AppText style={[$.text_tint_ash, $.fs_small]}>
                        {selectedEvent.dress_code}
                      </AppText>
                    </AppView>
                  )}

                  {/* Book Button in Modal */}
                  {isLoggedIn && isCustomer && selectedEvent.remainingslot > 0 && (
                    <AppView style={[$.mt_medium, $.pt_medium, { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' }]}>
                      <TouchableOpacity
                        style={[
                          $.p_medium,
                          $.bg_tint_1,
                          $.border_rounded,
                          $.align_items_center,
                        ]}
                        onPress={() => {
                          setShowEventDetails(false);
                          handleBookEvent(selectedEvent);
                        }}>
                        <AppText style={[$.text_tint_11, $.fw_semibold, $.fs_medium]}>
                          Book Slot
                        </AppText>
                      </TouchableOpacity>
                    </AppView>
                  )}
                  {isLoggedIn && isCustomer && (!selectedEvent.remainingslot || selectedEvent.remainingslot === 0) && (
                    <AppView style={[$.mt_medium, $.pt_medium, { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' }]}>
                      <AppView style={[
                        $.p_medium,
                        $.bg_tint_9,
                        $.border_rounded,
                        $.align_items_center,
                      ]}>
                        <AppText style={[$.text_tint_3, $.fw_semibold, $.fs_medium]}>
                          Fully Booked
                        </AppText>
                      </AppView>
                    </AppView>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Payment Type Filter Bottom Sheet */}
        <BottomSheetComponent
          ref={paymentTypeSheetRef}
          screenname="Select Payment Type"
          Save={() => {
            paymentTypeSheetRef.current?.close();
          }}
          close={() => {
            paymentTypeSheetRef.current?.close();
          }}
          showbutton={false}>
          <ScrollView nestedScrollEnabled={true}>
            {paymentTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  $.p_small,
                  $.mb_tiny,
                  $.border_rounded,
                  {
                    backgroundColor:
                      paymentTypeFilter === option.id ? '#F0F7FF' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor:
                      paymentTypeFilter === option.id ? '#4A90E2' : '#E9ECEF',
                  },
                ]}
                onPress={() => {
                  setPaymentTypeFilter(option.id);
                  paymentTypeSheetRef.current?.close();
                }}>
                <AppText
                  style={[
                    $.fs_regular,
                    {
                      color:
                        paymentTypeFilter === option.id ? '#4A90E2' : '#333',
                      fontWeight: paymentTypeFilter === option.id ? '600' : '400',
                    },
                  ]}>
                  {option.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BottomSheetComponent>

        {/* Event Type Filter Bottom Sheet */}
        <BottomSheetComponent
          ref={eventTypeSheetRef}
          screenname="Select Event Type"
          Save={() => {
            eventTypeSheetRef.current?.close();
          }}
          close={() => {
            eventTypeSheetRef.current?.close();
          }}
          showbutton={false}>
          <ScrollView nestedScrollEnabled={true}>
            {eventTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  $.p_small,
                  $.mb_tiny,
                  $.border_rounded,
                  {
                    backgroundColor:
                      eventTypeFilter === option.id ? '#F0F7FF' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor:
                      eventTypeFilter === option.id ? '#4A90E2' : '#E9ECEF',
                  },
                ]}
                onPress={() => {
                  setEventTypeFilter(option.id);
                  eventTypeSheetRef.current?.close();
                }}>
                <AppText
                  style={[
                    $.fs_regular,
                    {
                      color:
                        eventTypeFilter === option.id ? '#4A90E2' : '#333',
                      fontWeight: eventTypeFilter === option.id ? '600' : '400',
                    },
                  ]}>
                  {option.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BottomSheetComponent>
      </AppView>
    </SafeAreaView>
  );
}

