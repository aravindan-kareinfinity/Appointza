import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {AppAlert} from '../../components/appalert.component';
import {BottomSheetComponent} from '../../components/bottomsheet.component';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
import {EventBookingService} from '../../services/eventbooking.service';
import {EventBooking, EventBookingSelectReq} from '../../models/eventbooking.model';
import {EventService} from '../../services/event.service';
import {Event, EventSelectReq} from '../../models/event.model';
import {AppSingleSelect} from '../../components/appsingleselect.component';
import {FormInput} from '../../components/forminput.component';
import {CustomHeader} from '../../components/customheader.component';
import {Colors} from '../../constants/colors';

type BusinessEventBookingsScreenProp = NativeStackScreenProps<
  AppStackParamList,
  'BusinessEventBookings'
>;

export function BusinessEventBookingsScreen() {
  const navigation = useNavigation<BusinessEventBookingsScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Refs for bottom sheets
  const updateStatusSheetRef = useRef<any>(null);
  const eventFilterSheetRef = useRef<any>(null);
  const paymentFilterSheetRef = useRef<any>(null);
  const checkInFilterSheetRef = useRef<any>(null);
  const confirmationFilterSheetRef = useRef<any>(null);

  // Data states
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsMap, setEventsMap] = useState<Map<number, Event>>(new Map());
  const [selectedBooking, setSelectedBooking] = useState<EventBooking | null>(null);

  // Filter states
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [checkInStatusFilter, setCheckInStatusFilter] = useState<string>('all');
  const [confirmationStatusFilter, setConfirmationStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Update form states
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [checkInStatus, setCheckInStatus] = useState<string>('');
  const [confirmationStatus, setConfirmationStatus] = useState<string>('');

  // Services
  const usercontext = useAppSelector(selectusercontext);
  const eventBookingService = useMemo(() => new EventBookingService(), []);
  const eventService = useMemo(() => new EventService(), []);

  // Filter options
  const eventFilterOptions = [
    {id: 'all', label: 'All Events'},
    ...events.map(event => ({id: event.id.toString(), label: event.event_name})),
  ];

  const paymentStatusOptions = [
    {id: 'all', label: 'All Statuses'},
    {id: 'pending', label: 'Pending'},
    {id: 'paid', label: 'Paid'},
    {id: 'failed', label: 'Failed'},
    {id: 'refunded', label: 'Refunded'},
  ];

  const checkInStatusOptions = [
    {id: 'all', label: 'All Statuses'},
    {id: 'not_checked_in', label: 'Not Checked In'},
    {id: 'checked_in', label: 'Checked In'},
    {id: 'cancelled', label: 'Cancelled'},
  ];

  const confirmationStatusOptions = [
    {id: 'all', label: 'All Statuses'},
    {id: 'pending', label: 'Pending'},
    {id: 'approved', label: 'Approved'},
    {id: 'rejected', label: 'Rejected'},
  ];

  const paymentStatusUpdateOptions = [
    {id: 'pending', label: 'Pending'},
    {id: 'paid', label: 'Paid'},
    {id: 'failed', label: 'Failed'},
    {id: 'refunded', label: 'Refunded'},
  ];

  const checkInStatusUpdateOptions = [
    {id: 'not_checked_in', label: 'Not Checked In'},
    {id: 'checked_in', label: 'Checked In'},
    {id: 'cancelled', label: 'Cancelled'},
  ];

  const confirmationStatusUpdateOptions = [
    {id: 'pending', label: 'Pending'},
    {id: 'approved', label: 'Approved'},
    {id: 'rejected', label: 'Rejected'},
  ];

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const fetchData = async () => {
    if (!usercontext.value.organisationid) return;

    try {
      setIsloading(true);
      
      // Fetch organization events
      const eventReq = new EventSelectReq();
      eventReq.id = 0;
      eventReq.organisation_id = usercontext.value.organisationid;
      eventReq.organisation_location_id = usercontext.value.organisationlocationid || 0;
      eventReq.status = '';
      eventReq.is_public = true;

      const eventsData = await eventService.select(eventReq);
      setEvents(eventsData || []);

      // Create events map
      const map = new Map<number, Event>();
      (eventsData || []).forEach(event => {
        map.set(event.id, event);
      });
      setEventsMap(map);

      // Fetch all bookings for these events
      if (eventsData && eventsData.length > 0) {
        const allBookings: EventBooking[] = [];

        for (const event of eventsData) {
          try {
            const bookingReq = new EventBookingSelectReq();
            bookingReq.id = 0;
            bookingReq.event_id = event.id;
            bookingReq.user_id = 0;
            bookingReq.payment_status = '';
            bookingReq.check_in_status = '';
            bookingReq.confirmation_status = '';

            const bookingsData = await eventBookingService.select(bookingReq);
            if (bookingsData) {
              allBookings.push(...bookingsData);
            }
          } catch (error) {
            console.error(`Error fetching bookings for event ${event.id}:`, error);
          }
        }

        setBookings(allBookings);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      AppAlert({message: 'Failed to load event bookings'});
      setBookings([]);
      setEvents([]);
    } finally {
      setIsloading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      handleError(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleError = (error: any) => {
    const message = error?.response?.data?.message || 'An error occurred';
    AppAlert({message});
  };

  const handleUpdateClick = (booking: EventBooking) => {
    setSelectedBooking(booking);
    setPaymentStatus(booking.payment_status);
    setCheckInStatus(booking.check_in_status);
    setConfirmationStatus(booking.confirmation_status || 'pending');
    updateStatusSheetRef.current?.open();
  };

  const handleUpdate = async () => {
    if (!selectedBooking) return;

    try {
      setIsUpdating(true);

      const updatedBooking = {...selectedBooking};
      updatedBooking.payment_status = paymentStatus;
      updatedBooking.check_in_status = checkInStatus;
      updatedBooking.confirmation_status = confirmationStatus;

      await eventBookingService.update(updatedBooking);

      // Update local state
      setBookings(bookings.map(b =>
        b.id === selectedBooking.id ? updatedBooking : b,
      ));

      updateStatusSheetRef.current?.close();
      setSelectedBooking(null);
      AppAlert({message: 'Booking status updated successfully'});
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'failed':
      case 'refunded':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getCheckInStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'checked_in':
        return '#4CAF50';
      case 'not_checked_in':
        return '#9E9E9E';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getConfirmationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'pending':
        return '#FFC107';
      default:
        return '#FFC107';
    }
  };

  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatEventDate = (event: Event): string => {
    if (event.event_type === 'single' && event.event_date) {
      return formatDate(event.event_date);
    } else if (event.event_type === 'range' && event.from_date && event.to_date) {
      return `${formatDate(event.from_date)} - ${formatDate(event.to_date)}`;
    } else if (event.event_type === 'daily') {
      return 'Daily Recurring';
    }
    return 'N/A';
  };

  // Filter bookings
  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    // Event filter
    if (eventFilter !== 'all') {
      const eventId = parseInt(eventFilter);
      filtered = filtered.filter(b => b.event_id === eventId);
    }

    // Payment status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(b => b.payment_status === paymentStatusFilter);
    }

    // Check-in status filter
    if (checkInStatusFilter !== 'all') {
      filtered = filtered.filter(b => b.check_in_status === checkInStatusFilter);
    }

    // Confirmation status filter
    if (confirmationStatusFilter !== 'all') {
      filtered = filtered.filter(
        b => (b.confirmation_status || 'pending') === confirmationStatusFilter,
      );
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        b =>
          b.user_name?.toLowerCase().includes(term) ||
          b.user_mobile?.toLowerCase().includes(term) ||
          eventsMap.get(b.event_id)?.event_name.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [
    bookings,
    eventFilter,
    paymentStatusFilter,
    checkInStatusFilter,
    confirmationStatusFilter,
    searchTerm,
    eventsMap,
  ]);

  const renderBookingItem = ({item}: {item: EventBooking}) => {
    const event = eventsMap.get(item.event_id);

    return (
      <TouchableOpacity
        style={{
          marginHorizontal: 8,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#e0e0e0',
          borderRadius: 8,
          backgroundColor: '#f8f9fa',
          padding: 16,
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.1,
          shadowRadius: 4,
          borderLeftWidth: 4,
          borderLeftColor: getConfirmationStatusColor(item.confirmation_status || 'pending'),
        }}
        activeOpacity={0.9}
        onPress={() => handleUpdateClick(item)}>
        {/* Event Info */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
          <View
            style={{
              backgroundColor: '#e9ecef',
              padding: 8,
              borderRadius: 4,
              justifyContent: 'center',
              alignItems: 'center',
              width: 40,
              height: 40,
            }}>
            <CustomIcon size={24} color="#4a6da7" name={CustomIcons.Calendar} />
          </View>

          <View style={{marginLeft: 16, flex: 1}}>
            <AppText style={{fontWeight: '600', fontSize: 16, color: '#333'}}>
              {event?.event_name || 'Event'}
            </AppText>
            <AppText style={{fontWeight: '400', fontSize: 12, color: '#6c757d'}}>
              {event ? formatEventDate(event) : 'N/A'}
            </AppText>
          </View>
        </View>

        {/* User Info */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
          <View
            style={{
              backgroundColor: '#e9ecef',
              padding: 8,
              borderRadius: 4,
              justifyContent: 'center',
              alignItems: 'center',
              width: 40,
              height: 40,
            }}>
            <CustomIcon size={24} color="#4a6da7" name={CustomIcons.Account} />
          </View>

          <View style={{marginLeft: 16, flex: 1}}>
            <AppText style={{fontWeight: '600', fontSize: 16, color: '#333'}}>
              {item.user_name || `User #${item.user_id}`}
            </AppText>
            {item.user_mobile && (
              <AppText style={{fontWeight: '400', fontSize: 12, color: '#6c757d'}}>
                {item.user_mobile}
              </AppText>
            )}
          </View>
        </View>

        {/* Booking Details */}
        <View style={{flexDirection: 'row', marginBottom: 16, gap: 8, flexWrap: 'wrap'}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#e9ecef',
              padding: 4,
              borderRadius: 4,
              paddingHorizontal: 8,
            }}>
            <CustomIcon size={14} color="#4a6da7" name={CustomIcons.Account} />
            <AppText
              style={{
                marginLeft: 4,
                fontWeight: '500',
                fontSize: 12,
                color: '#495057',
              }}>
              {item.number_of_people}{' '}
              {item.number_of_people === 1 ? 'Person' : 'People'}
            </AppText>
          </View>

          {item.total_amount && item.total_amount > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#e9ecef',
                padding: 4,
                borderRadius: 4,
                paddingHorizontal: 8,
              }}>
              <CustomIcon size={14} color="#4a6da7" name={CustomIcons.Cart} />
              <AppText
                style={{
                  marginLeft: 4,
                  fontWeight: '500',
                  fontSize: 12,
                  color: '#495057',
                }}>
                ₹{item.total_amount.toLocaleString('en-IN')}
              </AppText>
            </View>
          )}
        </View>

        {/* Status Badges */}
        <View style={{flexDirection: 'row', marginBottom: 16, gap: 8, flexWrap: 'wrap'}}>
          {/* Confirmation Status */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#e9ecef',
              padding: 4,
              borderRadius: 4,
              paddingHorizontal: 8,
            }}>
            <CustomIcon
              name={
                item.confirmation_status === 'approved'
                  ? CustomIcons.StatusIndicator
                  : item.confirmation_status === 'rejected'
                  ? CustomIcons.Delete
                  : CustomIcons.TimeCard
              }
              size={14}
              color={getConfirmationStatusColor(item.confirmation_status || 'pending')}
            />
            <AppText
              style={{
                marginLeft: 4,
                fontWeight: '500',
                fontSize: 12,
                color: '#495057',
                textTransform: 'capitalize',
              }}>
              {item.confirmation_status || 'Pending'}
            </AppText>
          </View>

          {/* Payment Status */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#e9ecef',
              padding: 4,
              borderRadius: 4,
              paddingHorizontal: 8,
            }}>
            <CustomIcon
              name={
                item.payment_status === 'paid'
                  ? CustomIcons.OnlinePayment
                  : CustomIcons.CashPayment
              }
              size={14}
              color={getPaymentStatusColor(item.payment_status)}
            />
            <AppText
              style={{
                marginLeft: 4,
                fontWeight: '500',
                fontSize: 12,
                color: '#495057',
                textTransform: 'capitalize',
              }}>
              {item.payment_status}
            </AppText>
          </View>

          {/* Check-In Status */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#e9ecef',
              padding: 4,
              borderRadius: 4,
              paddingHorizontal: 8,
            }}>
            <CustomIcon
              name={
                item.check_in_status === 'checked_in'
                  ? CustomIcons.StatusIndicator
                  : item.check_in_status === 'cancelled'
                  ? CustomIcons.Delete
                  : CustomIcons.TimeCard
              }
              size={14}
              color={getCheckInStatusColor(item.check_in_status)}
            />
            <AppText
              style={{
                marginLeft: 4,
                fontWeight: '500',
                fontSize: 12,
                color: '#495057',
                textTransform: 'capitalize',
              }}>
              {item.check_in_status.replace('_', ' ')}
            </AppText>
          </View>
        </View>

        {/* Attendee Names */}
        {item.notes && item.number_of_people > 1 && (
          <View style={{marginBottom: 16}}>
            <AppText
              style={{
                fontWeight: '600',
                fontSize: 12,
                color: '#6c757d',
                marginBottom: 4,
              }}>
              Attendees:
            </AppText>
            <AppText style={{fontSize: 12, color: '#495057'}}>{item.notes}</AppText>
          </View>
        )}

        {/* Booking Date */}
        <View style={{marginBottom: 16}}>
          <AppText style={{fontSize: 12, color: '#6c757d'}}>
            Booked on: {formatDate(item.created_at)}
          </AppText>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
            borderWidth: 1,
            borderColor: '#4a6da7',
            borderRadius: 4,
            backgroundColor: '#f1f3f5',
          }}
          onPress={() => handleUpdateClick(item)}>
          <CustomIcon size={16} color="#4a6da7" name={CustomIcons.Refresh} />
          <AppText
            style={{
              marginLeft: 8,
              fontWeight: '500',
              fontSize: 14,
              color: '#4a6da7',
            }}>
            Update Status
          </AppText>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{flex: 1}} edges={['left', 'right']}>
      <AppView style={[$.flex_1, {backgroundColor: '#F5F7FA'}]}>
        <CustomHeader
          title="Event Bookings"
          backgroundColor={Colors.light.background}
          titleColor={Colors.light.text}
        />

        {/* Search and Filters */}
        <AppView style={[$.px_small, $.py_small]}>
          {/* Search */}
          <AppView style={[$.mb_small]}>
            <FormInput
              label=""
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search bookings..."
              containerStyle={{marginBottom: 0}}
            />
          </AppView>

          {/* Filter Buttons Row */}
          <AppView style={[$.flex_row, {gap: 6}]}>
            {/* Event Filter */}
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
              onPress={() => eventFilterSheetRef.current?.open()}>
              <AppView>
                <AppText style={[$.fs_tiny, $.text_tint_5, $.mb_tiny]}>Event</AppText>
                <AppText style={[$.fs_small, $.text_tint_1]}>
                  {eventFilterOptions.find(opt => opt.id === eventFilter)?.label ||
                    'All Events'}
                </AppText>
              </AppView>
              <CustomIcon name={CustomIcons.ChevronDown} color={$.tint_3} size={16} />
            </TouchableOpacity>

            {/* Payment Status Filter */}
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
              onPress={() => paymentFilterSheetRef.current?.open()}>
              <AppView>
                <AppText style={[$.fs_tiny, $.text_tint_5, $.mb_tiny]}>Payment</AppText>
                <AppText style={[$.fs_small, $.text_tint_1]}>
                  {paymentStatusOptions.find(opt => opt.id === paymentStatusFilter)
                    ?.label || 'All'}
                </AppText>
              </AppView>
              <CustomIcon name={CustomIcons.ChevronDown} color={$.tint_3} size={16} />
            </TouchableOpacity>
          </AppView>

          <AppView style={[$.flex_row, {gap: 6}, $.mt_tiny]}>
            {/* Check-In Status Filter */}
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
              onPress={() => checkInFilterSheetRef.current?.open()}>
              <AppView>
                <AppText style={[$.fs_tiny, $.text_tint_5, $.mb_tiny]}>Check-In</AppText>
                <AppText style={[$.fs_small, $.text_tint_1]}>
                  {checkInStatusOptions.find(opt => opt.id === checkInStatusFilter)
                    ?.label || 'All'}
                </AppText>
              </AppView>
              <CustomIcon name={CustomIcons.ChevronDown} color={$.tint_3} size={16} />
            </TouchableOpacity>

            {/* Confirmation Status Filter */}
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
              onPress={() => confirmationFilterSheetRef.current?.open()}>
              <AppView>
                <AppText style={[$.fs_tiny, $.text_tint_5, $.mb_tiny]}>
                  Confirmation
                </AppText>
                <AppText style={[$.fs_small, $.text_tint_1]}>
                  {confirmationStatusOptions.find(
                    opt => opt.id === confirmationStatusFilter,
                  )?.label || 'All'}
                </AppText>
              </AppView>
              <CustomIcon name={CustomIcons.ChevronDown} color={$.tint_3} size={16} />
            </TouchableOpacity>
          </AppView>

          {/* Clear Filters Button */}
          {(eventFilter !== 'all' ||
            paymentStatusFilter !== 'all' ||
            checkInStatusFilter !== 'all' ||
            confirmationStatusFilter !== 'all' ||
            searchTerm.trim()) && (
            <TouchableOpacity
              style={[
                $.mt_tiny,
                $.px_small,
                $.py_tiny,
                $.bg_tint_3,
                $.border_rounded,
                $.align_items_center,
              ]}
              onPress={() => {
                setEventFilter('all');
                setPaymentStatusFilter('all');
                setCheckInStatusFilter('all');
                setConfirmationStatusFilter('all');
                setSearchTerm('');
              }}>
              <AppText style={[$.text_tint_11, $.fw_semibold, $.fs_tiny]}>
                Clear Filters
              </AppText>
            </TouchableOpacity>
          )}
        </AppView>

        {/* Bookings List */}
        {isloading && !isRefreshing ? (
          <AppView
            style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
            <ActivityIndicator size="large" color={$.tint_3} />
            <AppText style={[$.mt_medium, $.text_primary5]}>
              Loading bookings...
            </AppText>
          </AppView>
        ) : (
          <FlatList
            data={filteredBookings}
            showsVerticalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            renderItem={renderBookingItem}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[$.tint_3]}
                tintColor={$.tint_3}
              />
            }
            contentContainerStyle={
              filteredBookings.length === 0 ? [$.flex_1] : {paddingBottom: 16}
            }
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
                  name={CustomIcons.Calendar}
                  size={48}
                />
                <AppText style={[$.mt_medium, $.text_primary5, $.text_center]}>
                  {bookings.length === 0
                    ? 'No bookings have been made for your events yet.'
                    : 'No bookings match the selected filters.'}
                </AppText>
                <TouchableOpacity
                  style={[
                    $.mt_medium,
                    $.p_small,
                    $.bg_tint_3,
                    $.border_rounded,
                  ]}
                  onPress={handleRefresh}>
                  <AppText style={[$.text_tint_11, $.fw_semibold]}>Refresh</AppText>
                </TouchableOpacity>
              </AppView>
            }
            style={[$.flex_1]}
          />
        )}

        {/* Filter Bottom Sheets */}
        {/* Event Filter */}
        <BottomSheetComponent
          ref={eventFilterSheetRef}
          screenname="Select Event"
          Save={() => eventFilterSheetRef.current?.close()}
          close={() => eventFilterSheetRef.current?.close()}
          showbutton={false}>
          <ScrollView nestedScrollEnabled={true}>
            {eventFilterOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  $.p_small,
                  $.mb_tiny,
                  $.border_rounded,
                  {
                    backgroundColor:
                      eventFilter === option.id ? '#F0F7FF' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: eventFilter === option.id ? '#4A90E2' : '#E9ECEF',
                  },
                ]}
                onPress={() => {
                  setEventFilter(option.id);
                  eventFilterSheetRef.current?.close();
                }}>
                <AppText
                  style={[
                    $.fs_regular,
                    {
                      color: eventFilter === option.id ? '#4A90E2' : '#333',
                      fontWeight: eventFilter === option.id ? '600' : '400',
                    },
                  ]}>
                  {option.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BottomSheetComponent>

        {/* Payment Status Filter */}
        <BottomSheetComponent
          ref={paymentFilterSheetRef}
          screenname="Select Payment Status"
          Save={() => paymentFilterSheetRef.current?.close()}
          close={() => paymentFilterSheetRef.current?.close()}
          showbutton={false}>
          <ScrollView nestedScrollEnabled={true}>
            {paymentStatusOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  $.p_small,
                  $.mb_tiny,
                  $.border_rounded,
                  {
                    backgroundColor:
                      paymentStatusFilter === option.id ? '#F0F7FF' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor:
                      paymentStatusFilter === option.id ? '#4A90E2' : '#E9ECEF',
                  },
                ]}
                onPress={() => {
                  setPaymentStatusFilter(option.id);
                  paymentFilterSheetRef.current?.close();
                }}>
                <AppText
                  style={[
                    $.fs_regular,
                    {
                      color: paymentStatusFilter === option.id ? '#4A90E2' : '#333',
                      fontWeight: paymentStatusFilter === option.id ? '600' : '400',
                    },
                  ]}>
                  {option.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BottomSheetComponent>

        {/* Check-In Status Filter */}
        <BottomSheetComponent
          ref={checkInFilterSheetRef}
          screenname="Select Check-In Status"
          Save={() => checkInFilterSheetRef.current?.close()}
          close={() => checkInFilterSheetRef.current?.close()}
          showbutton={false}>
          <ScrollView nestedScrollEnabled={true}>
            {checkInStatusOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  $.p_small,
                  $.mb_tiny,
                  $.border_rounded,
                  {
                    backgroundColor:
                      checkInStatusFilter === option.id ? '#F0F7FF' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor:
                      checkInStatusFilter === option.id ? '#4A90E2' : '#E9ECEF',
                  },
                ]}
                onPress={() => {
                  setCheckInStatusFilter(option.id);
                  checkInFilterSheetRef.current?.close();
                }}>
                <AppText
                  style={[
                    $.fs_regular,
                    {
                      color: checkInStatusFilter === option.id ? '#4A90E2' : '#333',
                      fontWeight: checkInStatusFilter === option.id ? '600' : '400',
                    },
                  ]}>
                  {option.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BottomSheetComponent>

        {/* Confirmation Status Filter */}
        <BottomSheetComponent
          ref={confirmationFilterSheetRef}
          screenname="Select Confirmation Status"
          Save={() => confirmationFilterSheetRef.current?.close()}
          close={() => confirmationFilterSheetRef.current?.close()}
          showbutton={false}>
          <ScrollView nestedScrollEnabled={true}>
            {confirmationStatusOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  $.p_small,
                  $.mb_tiny,
                  $.border_rounded,
                  {
                    backgroundColor:
                      confirmationStatusFilter === option.id ? '#F0F7FF' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor:
                      confirmationStatusFilter === option.id ? '#4A90E2' : '#E9ECEF',
                  },
                ]}
                onPress={() => {
                  setConfirmationStatusFilter(option.id);
                  confirmationFilterSheetRef.current?.close();
                }}>
                <AppText
                  style={[
                    $.fs_regular,
                    {
                      color:
                        confirmationStatusFilter === option.id ? '#4A90E2' : '#333',
                      fontWeight: confirmationStatusFilter === option.id ? '600' : '400',
                    },
                  ]}>
                  {option.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BottomSheetComponent>

        {/* Update Status Bottom Sheet */}
        <BottomSheetComponent
          ref={updateStatusSheetRef}
          screenname="Update Booking Status"
          Save={handleUpdate}
          close={() => {
            updateStatusSheetRef.current?.close();
            setSelectedBooking(null);
          }}
          showbutton={true}>
          <ScrollView nestedScrollEnabled={true} style={[$.flex_1]}>
            {selectedBooking && (
              <>
                <AppView style={[$.mb_small]}>
                  <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                    Event
                  </AppText>
                  <AppText style={[$.fs_regular, $.text_tint_1]}>
                    {eventsMap.get(selectedBooking.event_id)?.event_name || 'Event'}
                  </AppText>
                </AppView>

                <AppView style={[$.mb_small]}>
                  <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                    Booked By
                  </AppText>
                  <AppText style={[$.fs_regular, $.text_tint_1]}>
                    {selectedBooking.user_name || `User #${selectedBooking.user_id}`}
                  </AppText>
                  {selectedBooking.user_mobile && (
                    <AppText style={[$.fs_small, $.text_tint_3]}>
                      {selectedBooking.user_mobile}
                    </AppText>
                  )}
                </AppView>

                <AppView style={[$.mb_small]}>
                  <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                    Confirmation Status *
                  </AppText>
                  <AppSingleSelect
                    data={confirmationStatusUpdateOptions}
                    selecteditem={confirmationStatusUpdateOptions.find(
                      opt => opt.id === confirmationStatus,
                    )}
                    onSelect={item => setConfirmationStatus(item.id)}
                    renderItemLabel={item => item.label}
                    keyExtractor={item => item.id}
                    searchKeyExtractor={item => item.label}
                    title=""
                  />
                </AppView>

                <AppView style={[$.mb_small]}>
                  <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                    Payment Status *
                  </AppText>
                  <AppSingleSelect
                    data={paymentStatusUpdateOptions}
                    selecteditem={paymentStatusUpdateOptions.find(
                      opt => opt.id === paymentStatus,
                    )}
                    onSelect={item => setPaymentStatus(item.id)}
                    renderItemLabel={item => item.label}
                    keyExtractor={item => item.id}
                    searchKeyExtractor={item => item.label}
                    title=""
                  />
                </AppView>

                <AppView style={[$.mb_small]}>
                  <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                    Check-In Status *
                  </AppText>
                  <AppSingleSelect
                    data={checkInStatusUpdateOptions}
                    selecteditem={checkInStatusUpdateOptions.find(
                      opt => opt.id === checkInStatus,
                    )}
                    onSelect={item => setCheckInStatus(item.id)}
                    renderItemLabel={item => item.label}
                    keyExtractor={item => item.id}
                    searchKeyExtractor={item => item.label}
                    title=""
                  />
                </AppView>
              </>
            )}
          </ScrollView>
        </BottomSheetComponent>
      </AppView>
    </SafeAreaView>
  );
}

