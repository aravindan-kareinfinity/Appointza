import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { AppButton } from '../../components/appbutton.component';
import { $ } from '../../styles';
import {
  CustomIcon,
  CustomIcons,
} from '../../components/customicons.component';
import { AppAlert } from '../../components/appalert.component';
import { AppSwitch } from '../../components/appswitch.component';
import { AppSingleSelect } from '../../components/appsingleselect.component';
import { BottomSheetComponent } from '../../components/bottomsheet.component';
import { useAppDispatch, useAppSelector } from '../../redux/hooks.redux';
import {
  selectusercontext,
  usercontextactions,
} from '../../redux/usercontext.redux';
import { AppoinmentService } from '../../services/appoinment.service';
import { StaffService } from '../../services/staff.service';
import { ReferenceValueService } from '../../services/referencevalue.service';
import {
  BookedAppoinmentRes,
  AppoinmentSelectReq,
  AddStaffReq,
  UpdateStatusReq,
  UpdatePaymentReq,
} from '../../models/appoinment.model';
// Remove unused imports since we're no longer using location selection
// import {
//   OrganisationLocationStaffReq,
//   OrganisationLocationStaffRes,
// } from '../../models/organisationlocation.model';
import { StaffSelectReq, StaffUser } from '../../models/staff.model';
import { ReferenceTypeSelectReq } from '../../models/referencetype.model';
import { REFERENCETYPE } from '../../models/users.model';
import { ReferenceValue } from '../../models/referencevalue.model';
import { HomeTabParamList } from '../../hometab.navigation';
import { AppStackParamList } from '../../appstack.navigation';
import { environment } from '../../utils/environment';
import { AppTextInput } from '../../components/apptextinput.component';
import { DatePickerComponent } from '../../components/Datetimepicker.component';
import { FormInput } from '../../components/forminput.component';
import { EventBookingService } from '../../services/eventbooking.service';
import { EventService } from '../../services/event.service';
import { EventBooking, EventBookingSelectReq } from '../../models/eventbooking.model';
import { Event, EventSelectReq } from '../../models/event.model';

type BussinessAppoinmentScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'BussinessAppoinment'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function BussinessAppoinmentScreen() {
  const navigation =
    useNavigation<BussinessAppoinmentScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs for bottom sheets
  const addStaffSheetRef = useRef<any>(null);
  const statusSheetRef = useRef<any>(null);
  const paymentSheetRef = useRef<any>(null);

  // Data states
  const [OrganisationApponmentlist, setOrganisationAppoinmentList] = useState<
    BookedAppoinmentRes[]
  >([]);
  // Remove locationlist state since we're using Redux location
  // const [locationlist, Setlocationlist] = useState<
  //   OrganisationLocationStaffRes[]
  // >([]);

  const [stafflist, setStafflist] = useState<StaffUser[]>([]);
  const [AppinmentStatuslist, setAppoinmentStatuslist] = useState<
    ReferenceValue[]
  >([]);
  const [updatedAppointmentId, setUpdatedAppointmentId] = useState<
    number | null
  >(null);
  const flatListRef = useRef<FlatList>(null);
  const itemHeights = useRef<{ [key: number]: number }>({});
  const [selectedPaymentType, setSelectedPaymentType] =
    useState<string>('Cash');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentName, setPaymentName] = useState<string>('');
  const [paymentCode, setPaymentCode] = useState<string>('');
  const [seletecedappinmentid, Setselectedappoinmentid] = useState(0);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'appointments' | 'eventbookings'>('appointments');

  // Event Bookings States
  const [eventBookings, setEventBookings] = useState<EventBooking[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsMap, setEventsMap] = useState<Map<number, Event>>(new Map());
  const [selectedEventBooking, setSelectedEventBooking] = useState<EventBooking | null>(null);
  const [isLoadingEventBookings, setIsLoadingEventBookings] = useState(false);
  const [isRefreshingEventBookings, setIsRefreshingEventBookings] = useState(false);
  const [isUpdatingEventBooking, setIsUpdatingEventBooking] = useState(false);
  
  // Event Bookings Filter States
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [checkInStatusFilter, setCheckInStatusFilter] = useState<string>('all');
  const [confirmationStatusFilter, setConfirmationStatusFilter] = useState<string>('all');
  const [eventBookingSearchTerm, setEventBookingSearchTerm] = useState('');
  
  // Event Bookings Update Form States
  const [eventPaymentStatus, setEventPaymentStatus] = useState<string>('');
  const [eventCheckInStatus, setEventCheckInStatus] = useState<string>('');
  const [eventConfirmationStatus, setEventConfirmationStatus] = useState<string>('');

  // Refs for Event Bookings bottom sheets
  const eventUpdateStatusSheetRef = useRef<any>(null);
  const eventFilterSheetRef = useRef<any>(null);
  const eventPaymentFilterSheetRef = useRef<any>(null);
  const eventCheckInFilterSheetRef = useRef<any>(null);
  const eventConfirmationFilterSheetRef = useRef<any>(null);

  // Services
  const usercontext = useAppSelector(selectusercontext);
  const dispatch = useAppDispatch();
  const appoinmentservices = useMemo(() => new AppoinmentService(), []);
  const staffservice = useMemo(() => new StaffService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const eventBookingService = useMemo(() => new EventBookingService(), []);
  const eventService = useMemo(() => new EventService(), []);

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, []),
  );

  // Load organization appointments when location changes
  useEffect(() => {

      getorganisationappoinment(orgId, locId);
      getstafflist();
    
  }, [ usercontext.value.organisationlocationid]);
  const [showdatepicker, setshowdatepicker] = useState(false);
  const [seleteddate, setselectedate] = useState<Date | null>(null);
  const loadInitialData = async () => {
    setIsloading(true);
    try {
      // Remove getstafflocation call since we're using Redux location
      // await getstafflocation();
      await fetchStatusReferenceTypes();
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const orgId  = useAppSelector(selectusercontext).value.organisationid || 0;
  const locId =useAppSelector(selectusercontext).value.organisationlocationid || 0;
  

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
    
        await getorganisationappoinment(orgId, locId);
      
    } catch (error) {
      handleError(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Remove getstafflocation function since it's no longer needed
  // const getstafflocation = async () => {
  //   try {
  //     const req = new OrganisationLocationStaffReq();
  //     req.userid = usercontext.value.userid;
  //     const res = await organisationLocationService.Selectlocation(req);

  //     if (res && res.length > 0) {
  //       // Setlocationlist(res); // This line is removed
  //       // Remove local location selection - Redux handles this
  //       // Prefer stored redux location if available and valid
  //       // const storedLocId = usercontext.value.organisationlocationid || 0;
  //       // const preferred =
  //       //   storedLocId > 0
  //       //     ? res.find(r => r.organisationlocationid === storedLocId)
  //       //     : undefined;
  //       // const chosen = preferred || res[0];
        
  //       // Persist to redux if changed or not set
  //       // if (!preferred || storedLocId !== chosen.organisationlocationid) {
  //       //   dispatch(
  //       //     usercontextactions.setOrganisationLocation({
  //       //       id: chosen.organisationlocationid,
  //       //       name: chosen.name,
  //       //     }),
  //       //   );
  //       // }
  //     } else {
  //       // Setlocationlist([]); // This line is removed
  //     }
  //   } catch (error: any) {
  //     handleError(error);
  //     // }
  //   };
  // };

  const getorganisationappoinment = async (orgid: number, locid: number) => {
    try {
      setIsloading(true);
      const req = new AppoinmentSelectReq();
      req.organisationlocationid = locid;
      req.organisationid = orgid;
      if (seleteddate) {
        req.appointmentdate = seleteddate;
      }
      console.log('resssssssssss', req);

      const res = await appoinmentservices.SelectBookedAppoinment(req);
      setOrganisationAppoinmentList(res || []);
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const getstafflist = async () => {
    const orgId  = useAppSelector(selectusercontext).value.organisationid || 0;
    const locId =useAppSelector(selectusercontext).value.organisationlocationid || 0;
    if (orgId === 0 || locId === 0) return;

    try {
      setIsloading(true);
      const req = new StaffSelectReq();
      req.organisationid = orgId;
      req.organisationlocationid = locId;
      const res = await staffservice.SelectStaffDetail(req);
      if (res) {
        setStafflist(res);
      } else {
        setStafflist([]);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      Alert.alert('Error', 'Failed to fetch staff data. Please try again.');
    } finally {
      setIsloading(false);
    }
  };

  const fetchStatusReferenceTypes = async () => {
    try {
      setIsloading(true);
      var req = new ReferenceTypeSelectReq();
      req.referencetypeid = REFERENCETYPE.APPOINTMENTSTATUS;
      const response = await referenceValueService.select(req);
      if (response) {
        setAppoinmentStatuslist(response);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const handleError = (error: any) => {
    const message = error?.response?.data?.message || 'An error occurred';
    AppAlert({ message });
  };

  // Event Bookings Functions
  const fetchEventBookings = async () => {
    if (!usercontext.value.organisationid) return;

    try {
      setIsLoadingEventBookings(true);
      
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

        setEventBookings(allBookings);
      } else {
        setEventBookings([]);
      }
    } catch (error) {
      console.error('Error fetching event bookings:', error);
      AppAlert({message: 'Failed to load event bookings'});
      setEventBookings([]);
      setEvents([]);
    } finally {
      setIsLoadingEventBookings(false);
    }
  };

  const handleEventBookingsRefresh = async () => {
    setIsRefreshingEventBookings(true);
    try {
      await fetchEventBookings();
    } catch (error) {
      handleError(error);
    } finally {
      setIsRefreshingEventBookings(false);
    }
  };

  const handleEventBookingUpdateClick = (booking: EventBooking) => {
    setSelectedEventBooking(booking);
    setEventPaymentStatus(booking.payment_status);
    setEventCheckInStatus(booking.check_in_status);
    setEventConfirmationStatus(booking.confirmation_status || 'pending');
    eventUpdateStatusSheetRef.current?.open();
  };

  const handleEventBookingUpdate = async () => {
    if (!selectedEventBooking) return;

    try {
      setIsUpdatingEventBooking(true);

      const updatedBooking = {...selectedEventBooking};
      updatedBooking.payment_status = eventPaymentStatus;
      updatedBooking.check_in_status = eventCheckInStatus;
      updatedBooking.confirmation_status = eventConfirmationStatus;

      await eventBookingService.update(updatedBooking);

      // Update local state
      setEventBookings(eventBookings.map(b =>
        b.id === selectedEventBooking.id ? updatedBooking : b,
      ));

      eventUpdateStatusSheetRef.current?.close();
      setSelectedEventBooking(null);
      AppAlert({message: 'Booking status updated successfully'});
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsUpdatingEventBooking(false);
    }
  };

  const getEventPaymentStatusColor = (status: string) => {
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

  const getEventCheckInStatusColor = (status: string) => {
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

  const getEventConfirmationStatusColor = (status: string) => {
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

  const formatEventDate = (date: Date | string | null): string => {
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

  const formatEventDateRange = (event: Event): string => {
    if (event.event_type === 'single' && event.event_date) {
      return formatEventDate(event.event_date);
    } else if (event.event_type === 'range' && event.from_date && event.to_date) {
      return `${formatEventDate(event.from_date)} - ${formatEventDate(event.to_date)}`;
    } else if (event.event_type === 'daily') {
      return 'Daily Recurring';
    }
    return 'N/A';
  };

  // Filter event bookings
  const filteredEventBookings = useMemo(() => {
    let filtered = eventBookings;

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
    if (eventBookingSearchTerm.trim()) {
      const term = eventBookingSearchTerm.toLowerCase();
      filtered = filtered.filter(
        b =>
          b.user_name?.toLowerCase().includes(term) ||
          b.user_mobile?.toLowerCase().includes(term) ||
          eventsMap.get(b.event_id)?.event_name.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [
    eventBookings,
    eventFilter,
    paymentStatusFilter,
    checkInStatusFilter,
    confirmationStatusFilter,
    eventBookingSearchTerm,
    eventsMap,
  ]);

  // Event Bookings Filter Options
  const eventFilterOptions = [
    {id: 'all', label: 'All Events'},
    ...events.map(event => ({id: event.id.toString(), label: event.event_name})),
  ];

  const eventPaymentStatusOptions = [
    {id: 'all', label: 'All Statuses'},
    {id: 'pending', label: 'Pending'},
    {id: 'paid', label: 'Paid'},
    {id: 'failed', label: 'Failed'},
    {id: 'refunded', label: 'Refunded'},
  ];

  const eventCheckInStatusOptions = [
    {id: 'all', label: 'All Statuses'},
    {id: 'not_checked_in', label: 'Not Checked In'},
    {id: 'checked_in', label: 'Checked In'},
    {id: 'cancelled', label: 'Cancelled'},
  ];

  const eventConfirmationStatusOptions = [
    {id: 'all', label: 'All Statuses'},
    {id: 'pending', label: 'Pending'},
    {id: 'approved', label: 'Approved'},
    {id: 'rejected', label: 'Rejected'},
  ];

  const eventPaymentStatusUpdateOptions = [
    {id: 'pending', label: 'Pending'},
    {id: 'paid', label: 'Paid'},
    {id: 'failed', label: 'Failed'},
    {id: 'refunded', label: 'Refunded'},
  ];

  const eventCheckInStatusUpdateOptions = [
    {id: 'not_checked_in', label: 'Not Checked In'},
    {id: 'checked_in', label: 'Checked In'},
    {id: 'cancelled', label: 'Cancelled'},
  ];

  const eventConfirmationStatusUpdateOptions = [
    {id: 'pending', label: 'Pending'},
    {id: 'approved', label: 'Approved'},
    {id: 'rejected', label: 'Rejected'},
  ];

  // Remove handleLocationChange - no longer needed
  // const handleLocationChange = (item: OrganisationLocationStaffRes) => {
  //   dispatch(
  //     usercontextactions.setOrganisationLocation({
  //       id: item.organisationlocationid,
  //       name: item.name,
  //     }),
  //   );
  // };

  // No local selection; rely on redux organisationlocationid exclusively

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#2196F3';
      case 'CANCELLED':
        return '#F44336';
      case 'CONFIRMED':
        return '#4CAF50';
      default:
        return '#FFC107';
    }
  };

  const scrollToUpdatedAppointment = (appointmentId: number) => {
    setTimeout(() => {
      const index = OrganisationApponmentlist.findIndex(
        item => item.id === appointmentId,
      );
      if (index !== -1) {
        // Calculate offset by summing up heights of previous items
        let offset = 0;
        for (let i = 0; i < index; i++) {
          const itemId = OrganisationApponmentlist[i].id;
          offset += itemHeights.current[itemId] || 250; // Default height if not measured
        }

        flatListRef.current?.scrollToOffset({
          offset: offset,
          animated: true,
        });
      }
    }, 300);
  };

  const onLayoutItem = (id: number, event: any) => {
    const { height } = event.nativeEvent.layout;
    itemHeights.current[id] = height;
  };

  const Assignstaff = async (staffid: number, staffname: string) => {
    try {
      setIsloading(true);
      var req = new AddStaffReq();
      (req.appoinmentid = seletecedappinmentid),
        (req.organisationid = usercontext.value.organisationid || 0),
        (req.organisationlocationid =
          usercontext.value.organisationlocationid || 0),
        (req.staffid = staffid);
      req.staffname = staffname;
      const response = await appoinmentservices.Assignstaff(req);
      if (response) {
        setOrganisationAppoinmentList(prevList =>
          prevList.map(appointment =>
            appointment.id === seletecedappinmentid
              ? { ...appointment, staffid, staffname }
              : appointment,
          ),
        );
        addStaffSheetRef.current?.close();
        setTimeout(() => {
          scrollToUpdatedAppointment(seletecedappinmentid);
          Alert.alert(environment.baseurl, 'staff assigned succesfully');
        }, 100);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const Updatestatus = async (statusid: number, statuscode: string) => {
    try {
      setIsloading(true);
      var req = new UpdateStatusReq();
      req.appoinmentid = seletecedappinmentid;
      (req.organisationid = usercontext.value.organisationid || 0),
        (req.organisationlocationid =
          usercontext.value.organisationlocationid || 0),
        (req.statusid = statusid);
      req.statuscode = statuscode;
      req.statustype = '';

      const response = await appoinmentservices.UpdateStatus(req);
      if (response) {
        setOrganisationAppoinmentList(prevList =>
          prevList.map(appointment =>
            appointment.id === seletecedappinmentid
              ? { ...appointment, statusid, statuscode }
              : appointment,
          ),
        );
        statusSheetRef.current?.close();
        setTimeout(() => {
          scrollToUpdatedAppointment(seletecedappinmentid);
          Alert.alert(environment.baseurl, 'status updated successfully');
        }, 100);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const Updatepayment = async (paymentData: UpdatePaymentReq) => {
    try {
      setIsloading(true);
      const response = await appoinmentservices.UpdatePayment(paymentData);
      if (response) {
        setOrganisationAppoinmentList(prevList =>
          prevList.map(appointment =>
            appointment.id === seletecedappinmentid
              ? {
                  ...appointment,
                  ispaid: true,
                  paymenttype: paymentData.paymenttype,
                  paymentamount: paymentData.amount,
                  paymentname: paymentData.paymentname,
                  paymentcode: paymentData.paymentcode,
                }
              : appointment,
          ),
        );
        paymentSheetRef.current?.close();
        setTimeout(() => {
          scrollToUpdatedAppointment(seletecedappinmentid);
          Alert.alert(environment.baseurl, 'Payment updated successfully');
        }, 100);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const renderEventBookingItem = ({item}: {item: EventBooking}) => {
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
          borderLeftColor: getEventConfirmationStatusColor(item.confirmation_status || 'pending'),
        }}
        activeOpacity={0.9}
        onPress={() => handleEventBookingUpdateClick(item)}>
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
            <CustomIcon size={24} color="#4a6da7" name={CustomIcons.AppointmentCalendar} />
          </View>

          <View style={{marginLeft: 16, flex: 1}}>
            <AppText style={{fontWeight: '600', fontSize: 16, color: '#333'}}>
              {event?.event_name || 'Event'}
            </AppText>
            <AppText style={{fontWeight: '400', fontSize: 12, color: '#6c757d'}}>
              {event ? formatEventDateRange(event) : 'N/A'}
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
              color={getEventConfirmationStatusColor(item.confirmation_status || 'pending')}
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
              color={getEventPaymentStatusColor(item.payment_status)}
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
              color={getEventCheckInStatusColor(item.check_in_status)}
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
            Booked on: {formatEventDate(item.created_at)}
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
          onPress={() => handleEventBookingUpdateClick(item)}>
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

  const renderAppointmentItem = ({ item }: { item: BookedAppoinmentRes }) => (
    <TouchableOpacity
      onLayout={event => onLayoutItem(item.id, event)}
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#4a6da7',
      }}
      activeOpacity={0.9}
      onPress={() => {}}
    >
      {/* Header with Date and Time */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
      >
        <Text
          style={{ fontWeight: 'bold', fontSize: 16, color: '#333', flex: 1 }}
        >
          {new Date(item.appoinmentdate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#e9ecef',
            padding: 4,
            borderRadius: 4,
          }}
        >
          <Text
            style={{
              fontWeight: '500',
              fontSize: 12,
              color: '#495057',
              marginRight: 4,
            }}
          >
            {item.fromtime.toString().substring(0, 5)}
          </Text>
          <Text style={{ fontWeight: '300', fontSize: 12, color: '#adb5bd' }}>
            -
          </Text>
          <Text
            style={{
              fontWeight: '500',
              fontSize: 12,
              color: '#495057',
              marginLeft: 4,
            }}
          >
            {item.totime.toString().substring(0, 5)}
          </Text>
        </View>
      </View>

      {/* Client Info */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
      >
        <View
          style={{
            backgroundColor: '#e9ecef',
            padding: 8,
            borderRadius: 4,
            justifyContent: 'center',
            alignItems: 'center',
            width: 40,
            height: 40,
          }}
        >
          <CustomIcon size={24} color="#4a6da7" name={CustomIcons.Account} />
        </View>

        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 16, color: '#333' }}>
            {item.username}
          </Text>
          <Text style={{ fontWeight: '400', fontSize: 12, color: '#6c757d' }}>
            {item.mobile || 'No mobile provided'}
          </Text>
        </View>
      </View>

      {/* Status and Staff Badges */}
      <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#e9ecef',
            padding: 4,
            borderRadius: 4,
            paddingHorizontal: 8,
          }}
        >
          <CustomIcon
            name={
              item.statuscode === 'COMPLETED'
                ? CustomIcons.OnlinePayment
                : item.statuscode === 'CANCELLED'
                ? CustomIcons.CashPayment
                : item.statuscode === 'CONFIRMED'
                ? CustomIcons.StatusIndicator
                : CustomIcons.TimeCard
            }
            size={20}
            color={getStatusColor(item.statuscode)}
          />
          <Text
            style={{
              marginLeft: 4,
              fontWeight: '500',
              fontSize: 12,
              color: '#495057',
            }}
          >
            {item.statuscode || 'No status'}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#e9ecef',
            padding: 4,
            borderRadius: 4,
            paddingHorizontal: 8,
          }}
        >
          <CustomIcon size={14} color="#adb5bd" name={CustomIcons.Account} />
          <Text
            style={{
              marginLeft: 4,
              fontWeight: '500',
              fontSize: 12,
              color: '#495057',
            }}
          >
            {item.staffname || 'Unassigned'}
          </Text>
        </View>

        {item.ispaid && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#28a745',
              padding: 4,
              borderRadius: 4,
              paddingHorizontal: 8,
            }}
          >
            <CustomIcon size={14} color="#28a745" name={CustomIcons.Circle} />
            <Text
              style={{
                marginLeft: 4,
                fontWeight: '500',
                fontSize: 12,
                color: '#28a745',
              }}
            >
              Paid
            </Text>
          </View>
        )}
      </View>

      {/* Services List */}
      {item.attributes?.servicelist?.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontWeight: '600',
              fontSize: 12,
              color: '#6c757d',
              marginBottom: 8,
            }}
          >
            SERVICES
          </Text>

          <View
            style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 4 }}
          >
            {item.attributes.servicelist.map((service, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 8,
                  backgroundColor: index % 2 === 0 ? '#f1f3f5' : '#f8f9fa',
                  borderBottomWidth:
                    index === item.attributes.servicelist.length - 1 ? 0 : 1,
                  borderBottomColor: '#e0e0e0',
                }}
              >
                <Text
                  style={{ fontWeight: '400', fontSize: 12, color: '#6c757d' }}
                >
                  {service.servicename}
                </Text>
                <Text
                  style={{ fontWeight: '600', fontSize: 12, color: '#4a6da7' }}
                >
                  ₹{service.serviceprice}
                </Text>
              </View>
            ))}

            {/* Total Price */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 8,
                backgroundColor: '#e9ecef',
              }}
            >
              <Text style={{ fontWeight: '600', fontSize: 12, color: '#333' }}>
                Total
              </Text>
              <Text
                style={{ fontWeight: '700', fontSize: 12, color: '#4a6da7' }}
              >
                ₹
                {item.attributes.servicelist
                  .reduce(
                    (total, service) =>
                      total + (Number(service.serviceprice) || 0),
                    0,
                  )
                  .toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View
        style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}
      >
        {stafflist.length > 0 && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 8,
              borderWidth: 1,
              borderColor: '#4a6da7',
              borderRadius: 4,
              backgroundColor: '#f1f3f5',
            }}
            onPress={() => {
              addStaffSheetRef.current?.open();
              Setselectedappoinmentid(item.id);
            }}
          >
            <CustomIcon
              size={16}
              color="#4a6da7"
              name={CustomIcons.AddAccount}
            />
            <Text
              style={{
                marginLeft: 4,
                fontWeight: '500',
                fontSize: 12,
                color: '#4a6da7',
              }}
            >
              Assign
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 8,
            borderWidth: 1,
            borderColor: '#28a745',
            borderRadius: 4,
            backgroundColor: '#f1f3f5',
          }}
          onPress={() => {
            Setselectedappoinmentid(item.id);
            statusSheetRef.current?.open();
          }}
        >
          <CustomIcon size={16} color="#28a745" name={CustomIcons.Edit} />
          <Text
            style={{
              marginLeft: 4,
              fontWeight: '500',
              fontSize: 12,
              color: '#28a745',
            }}
          >
            Status
          </Text>
        </TouchableOpacity>

        {item.ispaid && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 8,
              borderWidth: 1,
              borderColor: '#4a6da7',
              borderRadius: 4,
              backgroundColor: '#f1f3f5',
            }}
            onPress={() => {
              Setselectedappoinmentid(item.id);
              paymentSheetRef.current?.open();
            }}
          >
            <CustomIcon size={16} color="#4a6da7" name={CustomIcons.Save} />
            <Text
              style={{
                marginLeft: 4,
                fontWeight: '500',
                fontSize: 12,
                color: '#4a6da7',
              }}
            >
              Payment
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    const orgId = usercontext.value.organisationid || 0;
    const locId = usercontext.value.organisationlocationid || 0;
    if (orgId > 0 && locId > 0) {
      getorganisationappoinment(orgId, locId);
      getstafflist();
    }
  }, [seleteddate]);

  // Add useEffect to handle scrolling after updates
  useEffect(() => {
    if (updatedAppointmentId) {
      scrollToUpdatedAppointment(updatedAppointmentId);
      setUpdatedAppointmentId(null);
    }
  }, [updatedAppointmentId, OrganisationApponmentlist]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <AppView style={[$.flex_1, { backgroundColor: '#F5F7FA' }]}>
        {/* Header Section */}
        <AppView
          style={[$.flex_row, $.mb_tiny, $.px_small, $.pt_small, $.pb_tiny, $.align_items_center]}
        >
          <AppText
            style={[
              $.fs_medium,
              $.fw_semibold,
              $.text_primary5,
              $.flex_1,
            ]}
          >
            {activeCategoryTab === 'appointments' ? 'Appointments' : 'Event Bookings'}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setshowdatepicker(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <CustomIcon
                name={CustomIcons.TimeCard}
                size={18}
                color="#4a6da7"
              />
              <AppText
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#333',
                  marginLeft: 6,
                }}
              >
                {seleteddate ? seleteddate.toDateString() : 'All Dates'}
              </AppText>
            </TouchableOpacity>

            {seleteddate && (
              <TouchableOpacity
                onPress={() => setselectedate(null)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#f8f9fa',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <CustomIcon
                  name={CustomIcons.Refresh}
                  size={18}
                  color="#4a6da7"
                />
                <AppText
                  style={{ fontSize: 14, fontWeight: '500', color: '#4a6da7' }}
                >
                  Clear
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </AppView>

        {/* Category Tabs (Appointments / Event Bookings) */}
        <View style={{flexDirection: 'row', padding: 8, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#e0e0e0'}}>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 16,
              marginHorizontal: 4,
              borderRadius: 8,
              backgroundColor: activeCategoryTab === 'appointments' ? '#4a6da7' : '#f5f5f5',
            }}
            onPress={() => setActiveCategoryTab('appointments')}>
            <AppText
              style={{
                textAlign: 'center',
                fontSize: 14,
                fontWeight: '600',
                color: activeCategoryTab === 'appointments' ? '#FFFFFF' : '#666',
              }}>
              Appointments
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 16,
              marginHorizontal: 4,
              borderRadius: 8,
              backgroundColor: activeCategoryTab === 'eventbookings' ? '#4a6da7' : '#f5f5f5',
            }}
            onPress={() => setActiveCategoryTab('eventbookings')}>
            <AppText
              style={{
                textAlign: 'center',
                fontSize: 14,
                fontWeight: '600',
                color: activeCategoryTab === 'eventbookings' ? '#FFFFFF' : '#666',
              }}>
              Event Bookings
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Show current location info - Uses location stored in Redux from account screen */}
        {usercontext.value.organisationlocationname && activeCategoryTab === 'appointments' && (
          <AppView style={[$.mx_normal, $.mb_tiny, $.p_small, {backgroundColor: '#FFFFFF'}]}>
            <AppText style={[$.fs_compact, $.fw_semibold, $.text_primary5]}>
              Location: {usercontext.value.organisationlocationname}
            </AppText>
          </AppView>
        )}

        {/* Location Selector - Remove this section as it's now handled in account screen */}
        {/* {locationlist.length > 1 && (
          <AppView style={[$.mb_tiny, { paddingLeft: 10, paddingRight: 10 }]}>
            <FormSelect
              label="Select Location"
              options={locationlist.map(loc => ({
                id: loc.organisationlocationid,
                name: loc.name,
              }))}
              selectedId={usercontext.value.organisationlocationid || 0}
              onSelect={option => {
                const selectedLocation = locationlist.find(
                  loc => loc.organisationlocationid === option.id,
                );
                if (selectedLocation) {
                  handleLocationChange(selectedLocation);
                }
              }}
            />
          </AppView>
        )} */}

        {/* Conditional Content Based on Active Tab */}
        {activeCategoryTab === 'appointments' ? (
          /* Loading Indicator / List */
          isloading && !isRefreshing ? (
            <AppView
              style={[$.flex_1, $.justify_content_center, $.align_items_center]}
            >
              <ActivityIndicator size="large" color={$.tint_3} />
              <AppText style={[$.mt_medium, $.text_primary1]}>
                Loading appointments...
              </AppText>
            </AppView>
          ) : (
            <FlatList
              ref={flatListRef}
              data={OrganisationApponmentlist}
              showsVerticalScrollIndicator={false}
              keyExtractor={item => item.id.toString()}
              renderItem={renderAppointmentItem}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={[$.tint_3]}
                  tintColor={$.tint_3}
                />
              }
              ListEmptyComponent={
                <AppView
                  style={[
                    $.flex_1,
                    $.justify_content_center,
                    $.align_items_center,
                    $.p_large,
                  ]}
                >
                  <CustomIcon
                    color={$.tint_5}
                    name={CustomIcons.Scheduled}
                    size={$.s_large}
                  />
                  <AppText style={[$.mt_medium, $.text_primary5, $.text_center]}>
                    No appointments for this location
                  </AppText>
                  <TouchableOpacity
                    style={[
                      $.mt_medium,
                      $.p_small,
                      $.bg_tint_3,
                      $.border_rounded,
                    ]}
                    onPress={handleRefresh}
                  >
                    <AppText style={[$.text_tint_11, $.fw_semibold]}>
                      Refresh
                    </AppText>
                  </TouchableOpacity>
                </AppView>
              }
              contentContainerStyle={
                OrganisationApponmentlist.length === 0
                  ? [$.flex_1]
                  : {paddingBottom: 16}
              }
              style={[$.flex_1]}
            />
          )
        ) : (
          /* Event Bookings Screen */
          <>
            {/* Search and Filters */}
            <AppView style={[$.px_small, $.py_small]}>
              {/* Search */}
              <AppView style={[$.mb_small]}>
                <FormInput
                  label=""
                  value={eventBookingSearchTerm}
                  onChangeText={setEventBookingSearchTerm}
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
                    {justifyContent: 'space-between'},
                  ]}
                  onPress={() => eventFilterSheetRef.current?.open()}>
                  <AppView>
                    <AppText style={[$.fs_tiny, $.text_tint_5, $.mb_tiny]}>Event</AppText>
                    <AppText style={[$.fs_small, $.text_tint_1]}>
                      {eventFilterOptions.find(opt => opt.id === eventFilter)?.label ||
                        'All Events'}
                    </AppText>
                  </AppView>
                  <CustomIcon name={CustomIcons.RightChevron} color={$.tint_3} size={16} />
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
                    {justifyContent: 'space-between'},
                  ]}
                  onPress={() => eventPaymentFilterSheetRef.current?.open()}>
                  <AppView>
                    <AppText style={[$.fs_tiny, $.text_tint_5, $.mb_tiny]}>Payment</AppText>
                    <AppText style={[$.fs_small, $.text_tint_1]}>
                      {eventPaymentStatusOptions.find(opt => opt.id === paymentStatusFilter)
                        ?.label || 'All'}
                    </AppText>
                  </AppView>
                  <CustomIcon name={CustomIcons.RightChevron} color={$.tint_3} size={16} />
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
                    {justifyContent: 'space-between'},
                  ]}
                  onPress={() => eventCheckInFilterSheetRef.current?.open()}>
                  <AppView>
                    <AppText style={[$.fs_tiny, $.text_tint_5, $.mb_tiny]}>Check-In</AppText>
                    <AppText style={[$.fs_small, $.text_tint_1]}>
                      {eventCheckInStatusOptions.find(opt => opt.id === checkInStatusFilter)
                        ?.label || 'All'}
                    </AppText>
                  </AppView>
                  <CustomIcon name={CustomIcons.RightChevron} color={$.tint_3} size={16} />
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
                    {justifyContent: 'space-between'},
                  ]}
                  onPress={() => eventConfirmationFilterSheetRef.current?.open()}>
                  <AppView>
                    <AppText style={[$.fs_tiny, $.text_tint_5, $.mb_tiny]}>
                      Confirmation
                    </AppText>
                    <AppText style={[$.fs_small, $.text_tint_1]}>
                      {eventConfirmationStatusOptions.find(
                        opt => opt.id === confirmationStatusFilter,
                      )?.label || 'All'}
                    </AppText>
                  </AppView>
                  <CustomIcon name={CustomIcons.RightChevron} color={$.tint_3} size={16} />
                </TouchableOpacity>
              </AppView>

              {/* Clear Filters Button */}
              {(eventFilter !== 'all' ||
                paymentStatusFilter !== 'all' ||
                checkInStatusFilter !== 'all' ||
                confirmationStatusFilter !== 'all' ||
                eventBookingSearchTerm.trim()) && (
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
                    setEventBookingSearchTerm('');
                  }}>
                  <AppText style={[$.text_tint_11, $.fw_semibold, $.fs_tiny]}>
                    Clear Filters
                  </AppText>
                </TouchableOpacity>
              )}
            </AppView>

            {/* Event Bookings List */}
            {isLoadingEventBookings && !isRefreshingEventBookings ? (
              <AppView
                style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
                <ActivityIndicator size="large" color={$.tint_3} />
                <AppText style={[$.mt_medium, $.text_primary5]}>
                  Loading bookings...
                </AppText>
              </AppView>
            ) : (
              <FlatList
                data={filteredEventBookings}
                showsVerticalScrollIndicator={false}
                keyExtractor={item => item.id.toString()}
                renderItem={renderEventBookingItem}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshingEventBookings}
                    onRefresh={handleEventBookingsRefresh}
                    colors={[$.tint_3]}
                    tintColor={$.tint_3}
                  />
                }
                contentContainerStyle={
                  filteredEventBookings.length === 0 ? [$.flex_1] : {paddingBottom: 16}
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
                      name={CustomIcons.AppointmentCalendar}
                      size={48}
                    />
                    <AppText style={[$.mt_medium, $.text_primary5, $.text_center]}>
                      {eventBookings.length === 0
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
                      onPress={handleEventBookingsRefresh}>
                      <AppText style={[$.text_tint_11, $.fw_semibold]}>Refresh</AppText>
                    </TouchableOpacity>
                  </AppView>
                }
                style={[$.flex_1]}
              />
            )}
          </>
        )}

        {/* Bottom Sheets */}
        <BottomSheetComponent
          ref={addStaffSheetRef}
          screenname="Assign Staff"
          Save={() => {
            addStaffSheetRef.current?.close();
          }}
          close={() => addStaffSheetRef.current?.close()}
        >
          <ScrollView contentContainerStyle={[]} nestedScrollEnabled={true}>
            {stafflist.length > 0 ? (
              stafflist.map(staff => (
                <TouchableOpacity
                  key={staff.id}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                  onPress={() => {
                    Assignstaff(staff.id, staff.name);
                    addStaffSheetRef.current?.close();
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: '#E3F2FD',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <CustomIcon
                        name={CustomIcons.Account}
                        size={24}
                        color="#1976D2"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText
                        style={[$.fw_semibold, { color: '#333', fontSize: 16 }]}
                      >
                        {staff.name}
                      </AppText>
                      <AppText
                        style={[$.text_tint_3, $.fs_small, { marginTop: 4 }]}
                      >
                        {staff.mobile}
                      </AppText>
                    </View>
                    <CustomIcon
                      name={CustomIcons.RightChevron}
                      size={20}
                      color="#666"
                    />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View
                style={{
                  padding: 24,
                  backgroundColor: '#F8F9FA',
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E9ECEF',
                  borderStyle: 'dashed',
                }}
              >
                <CustomIcon
                  name={CustomIcons.Account}
                  size={32}
                  color="#ADB5BD"
                />
                <AppText style={[$.text_tint_3, $.mt_small, $.text_center]}>
                  No staff members available
                </AppText>
              </View>
            )}
          </ScrollView>
        </BottomSheetComponent>

        <BottomSheetComponent
          ref={statusSheetRef}
          screenname="Select Appointment Status"
          Save={() => {
            statusSheetRef.current?.close();
          }}
          showbutton={false}
          close={() => statusSheetRef.current?.close()}
        >
          <ScrollView contentContainerStyle={[]} nestedScrollEnabled={true}>
            {AppinmentStatuslist.length > 0 ? (
              AppinmentStatuslist.map(status => (
                <TouchableOpacity
                  key={status.id}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                  onPress={() => {
                    Updatestatus(status.id, status.identifier);
                    statusSheetRef.current?.close();
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor:
                          getStatusColor(status.identifier) + '20',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <CustomIcon
                        name={
                          status.identifier === 'COMPLETED'
                            ? CustomIcons.OnlinePayment
                            : status.identifier === 'CANCELLED'
                            ? CustomIcons.CashPayment
                            : status.identifier === 'CONFIRMED'
                            ? CustomIcons.StatusIndicator
                            : CustomIcons.TimeCard
                        }
                        size={24}
                        color={getStatusColor(status.identifier)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText
                        style={[$.fw_semibold, { color: '#333', fontSize: 16 }]}
                      >
                        {status.displaytext}
                      </AppText>
                    </View>
                    <CustomIcon
                      name={CustomIcons.RightChevron}
                      size={20}
                      color="#666"
                    />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View
                style={{
                  padding: 24,
                  backgroundColor: '#F8F9FA',
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E9ECEF',
                  borderStyle: 'dashed',
                }}
              >
                <CustomIcon
                  name={CustomIcons.StatusIndicator}
                  size={32}
                  color="#ADB5BD"
                />
                <AppText style={[$.text_tint_3, $.mt_small, $.text_center]}>
                  No status options available
                </AppText>
              </View>
            )}
          </ScrollView>
        </BottomSheetComponent>

        <DatePickerComponent
          date={seleteddate || new Date()}
          show={showdatepicker}
          mode="date"
          setShow={setshowdatepicker}
          setDate={date => {
            // Set to null when "clearing" the date
            setselectedate(date);
          }}
        />

        {/* Event Bookings Bottom Sheets */}
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
          ref={eventPaymentFilterSheetRef}
          screenname="Select Payment Status"
          Save={() => eventPaymentFilterSheetRef.current?.close()}
          close={() => eventPaymentFilterSheetRef.current?.close()}
          showbutton={false}>
          <ScrollView nestedScrollEnabled={true}>
            {eventPaymentStatusOptions.map(option => (
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
                  eventPaymentFilterSheetRef.current?.close();
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
          ref={eventCheckInFilterSheetRef}
          screenname="Select Check-In Status"
          Save={() => eventCheckInFilterSheetRef.current?.close()}
          close={() => eventCheckInFilterSheetRef.current?.close()}
          showbutton={false}>
          <ScrollView nestedScrollEnabled={true}>
            {eventCheckInStatusOptions.map(option => (
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
                  eventCheckInFilterSheetRef.current?.close();
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
          ref={eventConfirmationFilterSheetRef}
          screenname="Select Confirmation Status"
          Save={() => eventConfirmationFilterSheetRef.current?.close()}
          close={() => eventConfirmationFilterSheetRef.current?.close()}
          showbutton={false}>
          <ScrollView nestedScrollEnabled={true}>
            {eventConfirmationStatusOptions.map(option => (
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
                  eventConfirmationFilterSheetRef.current?.close();
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

        {/* Update Event Booking Status Bottom Sheet */}
        <BottomSheetComponent
          ref={eventUpdateStatusSheetRef}
          screenname="Update Booking Status"
          Save={handleEventBookingUpdate}
          close={() => {
            eventUpdateStatusSheetRef.current?.close();
            setSelectedEventBooking(null);
          }}
          showbutton={true}>
          <ScrollView nestedScrollEnabled={true} style={[$.flex_1]}>
            {selectedEventBooking && (
              <>
                <AppView style={[$.mb_small]}>
                  <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                    Event
                  </AppText>
                  <AppText style={[$.fs_regular, $.text_tint_1]}>
                    {eventsMap.get(selectedEventBooking.event_id)?.event_name || 'Event'}
                  </AppText>
                </AppView>

                <AppView style={[$.mb_small]}>
                  <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                    Booked By
                  </AppText>
                  <AppText style={[$.fs_regular, $.text_tint_1]}>
                    {selectedEventBooking.user_name || `User #${selectedEventBooking.user_id}`}
                  </AppText>
                  {selectedEventBooking.user_mobile && (
                    <AppText style={[$.fs_small, $.text_tint_3]}>
                      {selectedEventBooking.user_mobile}
                    </AppText>
                  )}
                </AppView>

                <AppView style={[$.mb_small]}>
                  <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                    Confirmation Status *
                  </AppText>
                  <AppSingleSelect
                    data={eventConfirmationStatusUpdateOptions}
                    selecteditem={eventConfirmationStatusUpdateOptions.find(
                      opt => opt.id === eventConfirmationStatus,
                    )}
                    onSelect={item => setEventConfirmationStatus(item.id)}
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
                    data={eventPaymentStatusUpdateOptions}
                    selecteditem={eventPaymentStatusUpdateOptions.find(
                      opt => opt.id === eventPaymentStatus,
                    )}
                    onSelect={item => setEventPaymentStatus(item.id)}
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
                    data={eventCheckInStatusUpdateOptions}
                    selecteditem={eventCheckInStatusUpdateOptions.find(
                      opt => opt.id === eventCheckInStatus,
                    )}
                    onSelect={item => setEventCheckInStatus(item.id)}
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

        <BottomSheetComponent
          ref={paymentSheetRef}
          screenname="Payment Details"
          Save={() => {
            const paymentReq = new UpdatePaymentReq();
            paymentReq.appoinmentid = seletecedappinmentid;
            paymentReq.paymenttype = selectedPaymentType;
            paymentReq.paymenttypeid =
              selectedPaymentType === 'Cash'
                ? 1
                : selectedPaymentType === 'Card'
                ? 2
                : 3;
            paymentReq.amount = Number(paymentAmount) || 0;
            paymentReq.paymentname = paymentName;
            paymentReq.paymentcode = paymentCode;
            paymentReq.statusid = 1;
            paymentReq.customername = '';
            paymentReq.customerid = 0;
            paymentReq.organisationid = usercontext.value.organisationid || 0;
            paymentReq.organisationlocationid =
              usercontext.value.organisationlocationid || 0;

            Updatepayment(paymentReq);
            paymentSheetRef.current?.close();
          }}
          close={() => paymentSheetRef.current?.close()}
        >
          <ScrollView contentContainerStyle={[]} nestedScrollEnabled={true}>
            {/* Payment Type Selection */}
            <View style={{ marginBottom: 20 }}>
              <AppText style={[$.fw_medium, $.mb_small, { color: '#495057' }]}>
                Payment Method
              </AppText>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {['Cash', 'Card', 'Online'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor:
                        selectedPaymentType === type ? '#1976D2' : '#E0E0E0',
                      backgroundColor:
                        selectedPaymentType === type ? '#E3F2FD' : '#FFFFFF',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                    onPress={() => setSelectedPaymentType(type)}
                  >
                    <CustomIcon
                      name={
                        type === 'Cash'
                          ? CustomIcons.CashPayment
                          : type === 'Card'
                          ? CustomIcons.OnlinePayment
                          : CustomIcons.OnlinePayment
                      }
                      size={24}
                      color={
                        selectedPaymentType === type ? '#1976D2' : '#666666'
                      }
                    />
                    <AppText
                      style={{
                        marginTop: 8,
                        color:
                          selectedPaymentType === type ? '#1976D2' : '#666666',
                        fontWeight: '500',
                      }}
                    >
                      {type}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount Input */}
            <FormInput
              label="Amount"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
              containerStyle={{ marginBottom: 16 }}
            />

            {/* Payment Name */}
            <FormInput
              label="Payment Name (Optional)"
              value={paymentName}
              onChangeText={setPaymentName}
              placeholder="e.g., Credit Card, UPI, etc."
              containerStyle={{ marginBottom: 16 }}
            />

            {/* Payment Code */}
            <FormInput
              label="Payment Code/Reference"
              value={paymentCode}
              onChangeText={setPaymentCode}
              placeholder="Transaction ID or Reference"
              containerStyle={{ marginBottom: 16 }}
            />
          </ScrollView>
        </BottomSheetComponent>
      </AppView>
    </SafeAreaView>
  );
}
