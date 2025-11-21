import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, RefreshControl, TouchableOpacity, ScrollView, View, StyleSheet, SafeAreaView, Image} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {AppAlert} from '../../components/appalert.component';
import {AppSwitch} from '../../components/appswitch.component';
import {AppSingleSelect} from '../../components/appsingleselect.component';
import {BottomSheetComponent} from '../../components/bottomsheet.component';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
import {AppoinmentService} from '../../services/appoinment.service';
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {StaffService} from '../../services/staff.service';
import {ReferenceValueService} from '../../services/referencevalue.service';
import {EventBookingService} from '../../services/eventbooking.service';
import {EventService} from '../../services/event.service';
import {EventBooking, EventBookingSelectReq} from '../../models/eventbooking.model';
import {Event, EventSelectReq} from '../../models/event.model';
import {FilesService} from '../../services/files.service';
import {
  BookedAppoinmentRes,
  AppoinmentSelectReq,
  AddStaffReq,
  UpdateStatusReq,
  UpdatePaymentReq,
} from '../../models/appoinment.model';
import {
  OrganisationLocationStaffReq,
  OrganisationLocationStaffRes,
} from '../../models/organisationlocation.model';
import {StaffSelectReq, StaffUser} from '../../models/staff.model';
import {ReferenceTypeSelectReq} from '../../models/referencetype.model';
import {REFERENCETYPE} from '../../models/users.model';
import {ReferenceValue} from '../../models/referencevalue.model';
import {HomeTabParamList} from '../../hometab.navigation';
import {AppStackParamList} from '../../appstack.navigation';
import {environment} from '../../utils/environment';
import {AppTextInput} from '../../components/apptextinput.component';
import {FormInput} from '../../components/forminput.component';

type UserAppoinmentScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'UserAppoinment'>,
  NativeStackScreenProps<AppStackParamList>
>;

const statusColors: Record<string, string> = {
  CONFIRMED: '#4CAF50',
  PENDING: '#FFC107',
  CANCELLED: '#F44336',
  COMPLETED: '#2196F3',
};

export function UserAppoinmentScreen() {
  const navigation = useNavigation<UserAppoinmentScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<BookedAppoinmentRes | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('Cash');
  const [paymentName, setPaymentName] = useState('');
  const [paymentCode, setPaymentCode] = useState('');
 
  // Data states
  const [UserApponmentlist, setUserAppoinmentList] = useState<BookedAppoinmentRes[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<BookedAppoinmentRes[]>([]);
  const [previousAppointments, setPreviousAppointments] = useState<BookedAppoinmentRes[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'previous'>('upcoming');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  
  // Event bookings states
  const [activeCategoryTab, setActiveCategoryTab] = useState<'services' | 'events'>('services');
  const [eventBookings, setEventBookings] = useState<EventBooking[]>([]);
  const [eventDetailsMap, setEventDetailsMap] = useState<Map<number, Event>>(new Map());
  const [upcomingEventBookings, setUpcomingEventBookings] = useState<EventBooking[]>([]);
  const [previousEventBookings, setPreviousEventBookings] = useState<EventBooking[]>([]);

  // Refs
  const cancelSheetRef = useRef<any>(null);
  const paymentSheetRef = useRef<any>(null);
  const filterSheetRef = useRef<any>(null);
  const [dateRange, setDateRange] = useState<{start: Date | null; end: Date | null}>({
    start: null,
    end: null
  });

  // Services
  const usercontext = useAppSelector(selectusercontext);
  const appoinmentservices = useMemo(() => new AppoinmentService(), []);
  const referenceService = useMemo(() => new ReferenceValueService(), []);
  const eventBookingService = useMemo(() => new EventBookingService(), []);
  const eventService = useMemo(() => new EventService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, []),
  );
  
  // Reload data when category tab changes
  useEffect(() => {
    if (usercontext.value.userid > 0) {
      loadInitialData();
    }
  }, [activeCategoryTab]);

  const loadInitialData = async () => {
    setIsloading(true);
    try {
      if (usercontext.value.userid > 0) {
        if (activeCategoryTab === 'services') {
          await getuserappoinment();
        } else {
          await getUserEventBookings();
        }
      }
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };
  
  // Fetch user event bookings
  const getUserEventBookings = async () => {
    try {
      setIsloading(true);
      const req = new EventBookingSelectReq();
      req.user_id = usercontext.value.userid;
      req.id = 0;
      req.event_id = 0;
      req.payment_status = '';
      req.check_in_status = '';
      req.confirmation_status = '';

      const bookings = await eventBookingService.select(req);
      setEventBookings(bookings || []);
      
      // Fetch event details for each booking
      const eventIds = [...new Set(bookings?.map(b => b.event_id) || [])];
      const eventDetails = new Map<number, Event>();
      
      for (const eventId of eventIds) {
        try {
          const eventReq = new EventSelectReq();
          eventReq.id = eventId;
          eventReq.organisation_id = 0;
          eventReq.organisation_location_id = 0;
          eventReq.status = '';
          eventReq.is_public = true;
          
          const events = await eventService.select(eventReq);
          if (events && events.length > 0) {
            eventDetails.set(eventId, events[0]);
          }
        } catch (error) {
          console.error(`Error fetching event ${eventId}:`, error);
        }
      }
      
      setEventDetailsMap(eventDetails);
      
      // Separate event bookings into upcoming and previous
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const upcoming = bookings?.filter(booking => {
        const event = eventDetails.get(booking.event_id);
        if (!event) return false;
        
        let eventDate: Date | null = null;
        if (event.event_type === 'single' && event.event_date) {
          eventDate = new Date(event.event_date);
        } else if (event.event_type === 'range' && event.from_date) {
          eventDate = new Date(event.from_date);
        } else if (event.event_type === 'daily') {
          // For daily events, consider them as upcoming
          return true;
        }
        
        if (!eventDate) return false;
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= now;
      }) || [];
      
      const previous = bookings?.filter(booking => {
        const event = eventDetails.get(booking.event_id);
        if (!event) return false;
        
        let eventDate: Date | null = null;
        if (event.event_type === 'single' && event.event_date) {
          eventDate = new Date(event.event_date);
        } else if (event.event_type === 'range' && event.to_date) {
          eventDate = new Date(event.to_date);
        } else if (event.event_type === 'daily') {
          return false; // Daily events are always upcoming
        }
        
        if (!eventDate) return false;
        eventDate.setHours(0, 0, 0, 0);
        return eventDate < now;
      }) || [];

      setUpcomingEventBookings(upcoming);
      setPreviousEventBookings(previous);
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };


  const getuserappoinment = async () => {
    try {
      setIsloading(true);
      const req = new AppoinmentSelectReq();
      req.userid = usercontext.value.userid;

      const res = await appoinmentservices.SelectBookedAppoinment(req);
      setUserAppoinmentList(res || []);
      
      // Separate appointments into upcoming and previous
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to start of today
      
      const upcoming = res?.filter(appointment => {
        const appointmentDate = new Date(appointment.appoinmentdate);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate >= now;
      }) || [];
      
      const previous = res?.filter(appointment => {
        const appointmentDate = new Date(appointment.appoinmentdate);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate < now;
      }) || [];

      setUpcomingAppointments(upcoming);
      setPreviousAppointments(previous);
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !cancelReason) {
      AppAlert({ message: 'Please provide a reason for cancellation' });
      return;
    }

    // Check if appointment is within 24 hours
    const appointmentDate = new Date(selectedAppointment.appoinmentdate);
    const currentDate = new Date();
    const hoursDifference = (appointmentDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      Alert.alert(
        'Late Cancellation',
        'This appointment is within 24 hours. You may be subject to a cancellation fee. Do you want to proceed?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Proceed',
            onPress: async () => {
              try {
                setIsloading(true);
                const req = new UpdateStatusReq();
                req.appoinmentid = selectedAppointment.id;
                req.statuscode = 'CANCELLED';
                // req.cancelreason = cancelReason;
                
                await appoinmentservices.UpdateStatus(req);
                
                // Refresh the appointments list
                await getuserappoinment();
                
                // Close the bottom sheet
                cancelSheetRef.current?.close();
                
                // Reset states
                setSelectedAppointment(null);
                setCancelReason('');
                
                AppAlert({ message: 'Appointment cancelled successfully' });
              } catch (error) {
                handleError(error);
              } finally {
                setIsloading(false);
              }
            },
          },
        ],
      );
    } else {
      // Proceed with cancellation if more than 24 hours
      try {
        setIsloading(true);
        const req = new UpdateStatusReq();
        req.appoinmentid = selectedAppointment.id;
        req.statuscode = 'CANCELLED';
        // req.cancelreason = cancelReason;
        
        await appoinmentservices.UpdateStatus(req);
        
        // Refresh the appointments list
        await getuserappoinment();
        
        // Close the bottom sheet
        cancelSheetRef.current?.close();
        
        // Reset states
        setSelectedAppointment(null);
        setCancelReason('');
        
        AppAlert({ message: 'Appointment cancelled successfully' });
      } catch (error) {
        handleError(error);
      } finally {
        setIsloading(false);
      }
    }
  };

  const handlePayment = async () => {
    if (!selectedAppointment || !paymentAmount) {
      AppAlert({ message: 'Please fill in all required fields' });
      return;
    }

    try {
      setIsloading(true);
      const req = new UpdatePaymentReq();
      req.appoinmentid = selectedAppointment.id;
      req.paymenttype = selectedPaymentType;
      req.paymenttypeid = selectedPaymentType === 'Cash' ? 1 : 
                         selectedPaymentType === 'Card' ? 2 : 3;
      req.amount = Number(paymentAmount) || 0;
      req.paymentname = paymentName;
      req.paymentcode = paymentCode;
      req.statusid = 1; // Assuming 1 is for completed payment
      req.customername = selectedAppointment.username || '';
      req.customerid = selectedAppointment.userid || 0;
      req.organisationid = selectedAppointment.organizationid || 0;
      req.organisationlocationid = selectedAppointment.organisationlocationid || 0;
      
      await appoinmentservices.UpdatePayment(req);
      
      // Refresh the appointments list
      await getuserappoinment();
      
      // Close the bottom sheet
      paymentSheetRef.current?.close();
      
      // Reset states
      setSelectedAppointment(null);
      setPaymentAmount('');
      setSelectedPaymentType('Cash');
      setPaymentName('');
      setPaymentCode('');
      
      AppAlert({ message: 'Payment updated successfully' });
    } catch (error) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const handleError = (error: any) => {
    const message = error?.response?.data?.message || 'An error occurred';
    AppAlert({message});
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (usercontext.value.userid > 0) {
        if (activeCategoryTab === 'services') {
          await getuserappoinment();
        } else {
          await getUserEventBookings();
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const getFilteredAppointments = (appointments: BookedAppoinmentRes[]) => {
    return appointments.filter(appointment => {
      // Status filter
      if (selectedStatus !== 'ALL' && appointment.statuscode !== selectedStatus) {
        return false;
      }

      // Date range filter
      if (dateRange.start && dateRange.end) {
        const appointmentDate = new Date(appointment.appoinmentdate);
        appointmentDate.setHours(0, 0, 0, 0);
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        if (appointmentDate < startDate || appointmentDate > endDate) {
          return false;
        }
      }

      return true;
    });
  };

  // Format event date
  const formatEventDate = (event: Event): string => {
    if (event.event_type === 'single' && event.event_date) {
      return new Date(event.event_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } else if (event.event_type === 'range' && event.from_date && event.to_date) {
      const from = new Date(event.from_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const to = new Date(event.to_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `${from} - ${to}`;
    } else if (event.event_type === 'daily') {
      return 'Daily Recurring';
    }
    return 'N/A';
  };

  const renderEventBookingItem = ({item}: {item: EventBooking}) => {
    const event = eventDetailsMap.get(item.event_id);
    if (!event) {
      return null;
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'approved':
          return '#4CAF50';
        case 'pending':
          return '#FFC107';
        case 'rejected':
        case 'cancelled':
          return '#F44336';
        default:
          return '#FFC107';
      }
    };

    const getPaymentStatusColor = (status: string) => {
      switch (status) {
        case 'paid':
          return '#4CAF50';
        case 'pending':
          return '#FFC107';
        case 'failed':
        case 'refunded':
          return '#F44336';
        default:
          return '#FFC107';
      }
    };

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
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          borderLeftWidth: 4,
          borderLeftColor: getStatusColor(item.confirmation_status) || $.tint_3
        }}
        activeOpacity={0.9}
        onPress={() => {}}>
        
        {/* Header with Date */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
          <AppText style={{fontWeight: 'bold', fontSize: 16, color: '#333', flex: 1}}>
            {formatEventDate(event)}
          </AppText>
        </View>

        {/* Event Info */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
          <View style={{
            backgroundColor: '#e9ecef', 
            padding: 8, 
            borderRadius: 4,
            justifyContent: 'center',
            alignItems: 'center',
            width: 40, 
            height: 40
          }}>
            <CustomIcon
              size={24}
              color="#4a6da7"
              name={CustomIcons.Calendar}
            />
          </View>
          
          <View style={{marginLeft: 16, flex: 1}}>
            <AppText style={{fontWeight: '600', fontSize: 16, color: '#333'}}>
              {event.event_name}
            </AppText>
            {event.location && (
              <AppText style={{fontWeight: '400', fontSize: 12, color: '#6c757d'}}>
                {event.location}
              </AppText>
            )}
          </View>
        </View>

        {/* Status and Payment Info */}
        <View style={{flexDirection: 'row', marginBottom: 16, gap: 8, flexWrap: 'wrap'}}>
          {/* Confirmation Status Badge */}
          <View style={{
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: '#e9ecef', 
            padding: 4, 
            borderRadius: 4,
            paddingHorizontal: 8
          }}>
            <CustomIcon
              name={
                item.confirmation_status === 'approved' ? CustomIcons.StatusIndicator :
                item.confirmation_status === 'rejected' ? CustomIcons.Delete :
                CustomIcons.TimeCard
              }
              size={20}
              color={getStatusColor(item.confirmation_status)}
            />
            <AppText style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#495057'}}>
              {item.confirmation_status?.toUpperCase() || 'PENDING'}
            </AppText>
          </View>

          {/* Payment Status Badge */}
          <View style={{
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: '#e9ecef', 
            padding: 4, 
            borderRadius: 4,
            paddingHorizontal: 8
          }}>
            <CustomIcon
              name={item.payment_status === 'paid' ? CustomIcons.OnlinePayment : CustomIcons.CashPayment}
              size={14}
              color={getPaymentStatusColor(item.payment_status)}
            />
            <AppText style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#495057'}}>
              {item.payment_status?.toUpperCase() || 'PENDING'}
            </AppText>
          </View>

          {/* Number of People Badge */}
          <View style={{
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: '#e9ecef', 
            padding: 4, 
            borderRadius: 4,
            paddingHorizontal: 8
          }}>
            <CustomIcon
              size={14}
              color="#4a6da7"
              name={CustomIcons.Account}
            />
            <AppText style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#495057'}}>
              {item.number_of_people} {item.number_of_people === 1 ? 'Person' : 'People'}
            </AppText>
          </View>
        </View>

        {/* Booking Details */}
        <View style={{marginBottom: 16}}>
          {item.total_amount && item.total_amount > 0 && (
            <View style={{
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: 8,
              backgroundColor: '#e9ecef',
              borderRadius: 4
            }}>
              <AppText style={{fontWeight: '600', fontSize: 12, color: '#333'}}>
                Total Amount
              </AppText>
              <AppText style={{fontWeight: '700', fontSize: 14, color: '#4a6da7'}}>
                ₹{item.total_amount.toLocaleString('en-IN')}
              </AppText>
            </View>
          )}
          
          {item.notes && (
            <View style={{marginTop: 8}}>
              <AppText style={{fontWeight: '600', fontSize: 12, color: '#6c757d', marginBottom: 4}}>
                Attendees
              </AppText>
              <AppText style={{fontSize: 12, color: '#495057'}}>
                {item.notes}
              </AppText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAppointmentItem = ({item}: {item: BookedAppoinmentRes}) => (
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: getStatusColor(item.statuscode) || $.tint_3
      }}
      activeOpacity={0.9}
      onPress={() => {}}>
      
      {/* Header with Date and Time */}
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
        <AppText style={{fontWeight: 'bold', fontSize: 16, color: '#333', flex: 1}}>
          {new Date(item.appoinmentdate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </AppText>
        
        <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9ecef', padding: 4, borderRadius: 4}}>
          <AppText style={{fontWeight: '500', fontSize: 12, color: '#495057', marginRight: 4}}>
            {item.fromtime.toString().substring(0, 5)}
          </AppText>
          <AppText style={{fontWeight: '300', fontSize: 12, color: '#adb5bd'}}>-</AppText>
          <AppText style={{fontWeight: '500', fontSize: 12, color: '#495057', marginLeft: 4}}>
            {item.totime.toString().substring(0, 5)}
          </AppText>
        </View>
      </View>

      {/* Location Info */}
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
        <View style={{
          backgroundColor: '#e9ecef', 
          padding: 8, 
          borderRadius: 4,
          justifyContent: 'center',
          alignItems: 'center',
          width: 40, 
          height: 40
        }}>
          <CustomIcon
            size={24}
            color="#4a6da7"
            name={CustomIcons.Shop}
          />
        </View>
        
        <View style={{marginLeft: 16, flex: 1}}>
          <AppText style={{fontWeight: '600', fontSize: 16, color: '#333'}}>
            {item.organisationname}
          </AppText>
          <AppText style={{fontWeight: '400', fontSize: 12, color: '#6c757d'}}>
            {item.city || 'No location specified'}
          </AppText>
        </View>
      </View>

      {/* Status and Staff Info */}
      <View style={{flexDirection: 'row', marginBottom: 16, gap: 8, flexWrap: 'wrap'}}>
        {/* Status Badge */}
        <View style={{
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: '#e9ecef', 
          padding: 4, 
          borderRadius: 4,
          paddingHorizontal: 8
        }}>
          <CustomIcon
            name={
              item.statuscode === 'COMPLETED' ? CustomIcons.OnlinePayment :
              item.statuscode === 'CANCELLED' ? CustomIcons.CashPayment :
              item.statuscode === 'CONFIRMED' ? CustomIcons.StatusIndicator :
              CustomIcons.TimeCard
            }
            size={20}
            color={getStatusColor(item.statuscode)}
          />
          <AppText style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#495057'}}>
            {item.statuscode || 'PENDING'}
          </AppText>
        </View>

        {/* Staff Badge */}
        <View style={{
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: '#e9ecef', 
          padding: 4, 
          borderRadius: 4,
          paddingHorizontal: 8
        }}>
          <CustomIcon
            size={14}
            color="#4a6da7"
            name={CustomIcons.Account}
          />
          <AppText style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#495057'}}>
            {item.staffname || 'Unassigned'}
          </AppText>
        </View>

        {/* Payment Status Badge */}
        {item.ispaid && (
          <View style={{
            flexDirection: 'row', 
            alignItems: 'center', 
            borderWidth: 1,
            borderColor: '#28a745',
            padding: 4, 
            borderRadius: 4,
            paddingHorizontal: 8
          }}>
            <CustomIcon
              size={14}
              color="#28a745"
              name={CustomIcons.Circle}
            />
            <AppText style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#28a745'}}>
              Paid
            </AppText>
          </View>
        )}
      </View>

      {/* Services List */}
      {item.attributes?.servicelist?.length > 0 && (
        <View style={{marginBottom: 16}}>
          <AppText style={{fontWeight: '600', fontSize: 12, color: '#6c757d', marginBottom: 8}}>
            SERVICES
          </AppText>
          
          <View style={{borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 4}}>
            {item.attributes.servicelist.map((service, index) => (
              <View 
                key={index}
                style={{
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 8,
                  backgroundColor: index % 2 === 0 ? '#f1f3f5' : '#f8f9fa',
                  borderBottomWidth: index === item.attributes.servicelist.length - 1 ? 0 : 1,
                  borderBottomColor: '#e0e0e0'
                }}>
                <AppText style={{fontWeight: '400', fontSize: 12, color: '#6c757d'}}>
                  {service.servicename}
                </AppText>
                <AppText style={{fontWeight: '600', fontSize: 12, color: '#4a6da7'}}>
                  ₹{service.serviceprice}
                </AppText>
              </View>
            ))}
            
            {/* Total Price */}
            <View style={{
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: 8,
              backgroundColor: '#e9ecef'
            }}>
              <AppText style={{fontWeight: '600', fontSize: 12, color: '#333'}}>
                Total
              </AppText>
              <AppText style={{fontWeight: '700', fontSize: 12, color: '#4a6da7'}}>
                ₹{item.attributes.servicelist
                  .reduce((total, service) => total + (Number(service.serviceprice) || 0), 0)
                  .toLocaleString('en-IN')}
              </AppText>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 8}}>
        {item.statuscode !== 'CANCELLED' && item.statuscode !== 'COMPLETED' && (
          <TouchableOpacity
            style={{
              flexDirection: 'row', 
              alignItems: 'center',
              padding: 8,
              borderWidth: 1,
              borderColor: '#dc3545',
              borderRadius: 4,
              backgroundColor: '#f1f3f5'
            }}
            onPress={() => {
              setSelectedAppointment(item);
              cancelSheetRef.current?.open();
            }}>
            <CustomIcon
              size={16}
              color="#dc3545"
              name={CustomIcons.Delete}
            />
            <AppText style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#dc3545'}}>
              Cancel
            </AppText>
          </TouchableOpacity>
        )}

        {/* {!item.ispaid && item.statuscode !== 'CANCELLED' && (
          <TouchableOpacity
            style={{
              flexDirection: 'row', 
              alignItems: 'center',
              padding: 8,
              borderWidth: 1,
              borderColor: '#28a745',
              borderRadius: 4,
              backgroundColor: '#f1f3f5'
            }}
            onPress={() => {
              setSelectedAppointment(item);
              setPaymentAmount(item.attributes?.servicelist?.reduce(
                (total, service) => total + (Number(service.serviceprice) || 0),
                0,
              ).toString() || '');
              paymentSheetRef.current?.open();
            }}>
            <CustomIcon
              size={16}
              color="#28a745"
              name={CustomIcons.Save}
            />
            <AppText style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#28a745'}}>
              Pay Now
            </AppText>
          </TouchableOpacity>
        )} */}
      </View>
    </TouchableOpacity>
  );

  const statusOptions = [
    { label: 'All', value: 'ALL' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  const FilterBottomSheet = () => (
    <BottomSheetComponent
      ref={filterSheetRef}
      screenname="Filter Appointments"
      Save={() => {
        filterSheetRef.current?.close();
      }}
      showbutton={false}
      close={() => {
        filterSheetRef.current?.close();
      }}>
      <ScrollView contentContainerStyle={[]} nestedScrollEnabled={true}>
        <AppText style={[$.fw_semibold, $.mb_medium]}>Filter By Status</AppText>
        
        <AppView style={[$.mb_medium]}>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                backgroundColor: selectedStatus === option.value ? '#F0F7FF' : '#FFFFFF',
                borderRadius: 8,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: selectedStatus === option.value ? '#4A90E2' : '#E9ECEF',
              }}
              onPress={() => setSelectedStatus(option.value)}>
              <CustomIcon
                name={
                  option.value === 'CONFIRMED' ? CustomIcons.StatusIndicator :
                  option.value === 'PENDING' ? CustomIcons.TimeCard :
                  option.value === 'CANCELLED' ? CustomIcons.Delete :
                  option.value === 'COMPLETED' ? CustomIcons.OnlinePayment :
                  CustomIcons.Scheduled
                }
                size={20}
                color={selectedStatus === option.value ? '#4A90E2' : '#6C757D'}
              />
              <AppText
                style={{
                  marginLeft: 12,
                  color: selectedStatus === option.value ? '#4A90E2' : '#6C757D',
                  fontWeight: selectedStatus === option.value ? '600' : '400',
                }}>
                {option.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </AppView>

        <AppText style={[$.fw_semibold, $.mb_medium]}>Filter By Date Range</AppText>
        
        <AppView style={[$.mb_medium]}>
          <TouchableOpacity
            style={{
              padding: 12,
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#E9ECEF',
              marginBottom: 8,
            }}
            onPress={() => {
              // Show date picker for start date
              // You can use your DatePickerComponent here
            }}>
            <AppText style={{ color: '#6C757D' }}>
              Start Date: {dateRange.start ? dateRange.start.toLocaleDateString() : 'Select'}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              padding: 12,
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#E9ECEF',
            }}
            onPress={() => {
              // Show date picker for end date
              // You can use your DatePickerComponent here
            }}>
            <AppText style={{ color: '#6C757D' }}>
              End Date: {dateRange.end ? dateRange.end.toLocaleDateString() : 'Select'}
            </AppText>
          </TouchableOpacity>
        </AppView>

        <TouchableOpacity
          style={{
            padding: 12,
            backgroundColor: '#F8F9FA',
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 16,
          }}
          onPress={() => {
            setSelectedStatus('ALL');
            setDateRange({ start: null, end: null });
          }}>
          <AppText style={{ color: '#6C757D' }}>Reset Filters</AppText>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheetComponent>
  );

   
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <AppText style={styles.headerTitle}>My Appointments</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {activeCategoryTab === 'services' && (
            <TouchableOpacity 
              style={{ marginRight: 16 }}
              onPress={() => {
                filterSheetRef.current?.open();
              }}>
              <CustomIcon name={CustomIcons.Filter} size={24} color={$.tint_3} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleRefresh}>
            <CustomIcon name={CustomIcons.Refresh} size={24} color={$.tint_3} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Tab Buttons (Services/Events) */}
      <View style={[styles.tabContainer, { marginBottom: 0 }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeCategoryTab === 'services' && styles.activeTabButton,
          ]}
          onPress={() => {
            setActiveCategoryTab('services');
            setActiveTab('upcoming');
          }}>
          <AppText
            style={[
              styles.tabButtonText,
              activeCategoryTab === 'services' && styles.activeTabButtonText,
            ]}>
            Services
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeCategoryTab === 'events' && styles.activeTabButton,
          ]}
          onPress={() => {
            setActiveCategoryTab('events');
            setActiveTab('upcoming');
          }}>
          <AppText
            style={[
              styles.tabButtonText,
              activeCategoryTab === 'events' && styles.activeTabButtonText,
            ]}>
            Events
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Sub Tab Buttons (Upcoming/Previous) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'upcoming' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('upcoming')}>
          <AppText
            style={[
              styles.tabButtonText,
              activeTab === 'upcoming' && styles.activeTabButtonText,
            ]}>
            Upcoming
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'previous' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('previous')}>
          <AppText
            style={[
              styles.tabButtonText,
              activeTab === 'previous' && styles.activeTabButtonText,
            ]}>
            Previous
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isloading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={$.tint_3} />
          <AppText style={styles.loadingText}>
            {activeCategoryTab === 'services' 
              ? 'Loading appointments...' 
              : 'Loading event bookings...'}
          </AppText>
        </View>
      ) : activeCategoryTab === 'services' ? (
        <FlatList
          data={getFilteredAppointments(activeTab === 'upcoming' ? upcomingAppointments : previousAppointments)}
          nestedScrollEnabled
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
            <View style={styles.emptyContainer}>
              <CustomIcon
                color={$.tint_5}
                name={CustomIcons.Scheduled}
                size={48}
              />
              <AppText style={styles.emptyText}>
                {activeTab === 'upcoming'
                  ? 'You have no upcoming appointments'
                  : 'You have no previous appointments'}
              </AppText>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}>
                <AppText style={styles.refreshButtonText}>Refresh</AppText>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.listContentContainer}
        />
      ) : (
        <FlatList
          data={activeTab === 'upcoming' ? upcomingEventBookings : previousEventBookings}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item.id.toString()}
          renderItem={renderEventBookingItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[$.tint_3]}
              tintColor={$.tint_3}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CustomIcon
                color={$.tint_5}
                name={CustomIcons.Calendar}
                size={48}
              />
              <AppText style={styles.emptyText}>
                {activeTab === 'upcoming'
                  ? 'You have no upcoming event bookings'
                  : 'You have no previous event bookings'}
              </AppText>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}>
                <AppText style={styles.refreshButtonText}>Refresh</AppText>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.listContentContainer}
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet />

      {/* Payment Bottom Sheet */}
      <BottomSheetComponent
        ref={paymentSheetRef}
        screenname="Payment Details"
        Save={handlePayment}
        close={() => {
          paymentSheetRef.current?.close();
          setPaymentAmount('');
          setSelectedPaymentType('Cash');
          setPaymentName('');
          setPaymentCode('');
        }}
        showbutton={true}>
        <ScrollView
          contentContainerStyle={[]}
          nestedScrollEnabled={true}>
          <AppText style={[$.fw_semibold, $.mb_medium]}>
            Payment Details
          </AppText>
          
          {/* Payment Type Selection */}
          <FormInput
            label="Payment Method"
            value={selectedPaymentType}
            onChangeText={() => {}}
            placeholder="Select payment method"
            editable={false}
            containerStyle={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
             
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
            
            }}
          />

          <AppView style={[$.flex_row, {justifyContent: 'space-between'}, $.mb_medium]}>
            <TouchableOpacity
              style={{
                flex: 1,
                marginRight: 8,
                backgroundColor: '#F8F9FA',
               
                borderRadius: 12,
                borderWidth: 1,
                borderColor: selectedPaymentType === 'Cash' ? '#4A90E2' : '#E9ECEF',
                alignItems: 'center',
              }}
              onPress={() => setSelectedPaymentType('Cash')}>
              <CustomIcon
                name={CustomIcons.CashPayment}
                size={24}
                color={selectedPaymentType === 'Cash' ? '#4A90E2' : '#6C757D'}
              />
              <AppText
                style={{
                  marginTop: 8,
                  color: selectedPaymentType === 'Cash' ? '#4A90E2' : '#6C757D',
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
               
                borderRadius: 12,
                borderWidth: 1,
                borderColor: selectedPaymentType === 'Card' ? '#4A90E2' : '#E9ECEF',
                alignItems: 'center',
              }}
              onPress={() => setSelectedPaymentType('Card')}>
              <CustomIcon
                name={CustomIcons.OnlinePayment}
                size={24}
                color={selectedPaymentType === 'Card' ? '#4A90E2' : '#6C757D'}
              />
              <AppText
                style={{
                  marginTop: 8,
                  color: selectedPaymentType === 'Card' ? '#4A90E2' : '#6C757D',
                  fontWeight: '500',
                }}>
                Card
              </AppText>
            </TouchableOpacity>
          </AppView>

          {/* Amount Input */}
          <FormInput
            label="Amount"
            value={paymentAmount}
            onChangeText={setPaymentAmount}
            placeholder="Enter amount"
            keyboardType="numeric"
            containerStyle={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
             
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
             
            }}
          />

          {/* Payment Name */}
          <FormInput
            label="Payment Name (Optional)"
            value={paymentName}
            onChangeText={setPaymentName}
            placeholder="e.g., Credit Card, UPI, etc."
            containerStyle={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
             
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
           
            }}
          />

          {/* Payment Code */}
          <FormInput
            label="Payment Code/Reference"
            value={paymentCode}
            onChangeText={setPaymentCode}
            placeholder="Transaction ID or Reference"
            containerStyle={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
             
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
           
            }}
          />
        </ScrollView>
      </BottomSheetComponent>

      {/* Cancellation Bottom Sheet */}
      <BottomSheetComponent
        ref={cancelSheetRef}
        screenname="Cancel Appointment"
        Save={handleCancelAppointment}
        close={() => {
          cancelSheetRef.current?.close();
          setCancelReason('');
        }}
        showbutton={true}>
        <ScrollView contentContainerStyle={[]} nestedScrollEnabled={true}>
          {/* <AppText style={[$.fw_semibold, $.fs_large, $.mb_medium, $.text_danger]}>
            Cancel Appointment
          </AppText> */}
          
          {/* Appointment Details */}
          <AppView style={[$.mb_medium, {
            backgroundColor: '#F8F9FA',
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E9ECEF',
          }]}>
            <AppText style={[$.fw_medium, $.mb_small]}>Appointment Details</AppText>
            <AppText style={{ color: '#666', marginBottom: 4 }}>
              Date: {selectedAppointment && new Date(selectedAppointment.appoinmentdate).toLocaleDateString()}
            </AppText>
            <AppText style={{ color: '#666' }}>
              Time: {selectedAppointment?.fromtime.toString().substring(0, 5)} - {selectedAppointment?.totime.toString().substring(0, 5)}
            </AppText>
          </AppView>
          
          {/* Cancellation Reason */}
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
           
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
            
            }}
          />

          {/* Cancellation Policy */}
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
        </ScrollView>
      </BottomSheetComponent>
    </AppView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  listContentContainer: {
    paddingVertical: 8,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#666',
  },
  infoContainer: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#444',
  },
  locationTextContainer: {
    marginLeft: 6,
  },
  organisationText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#444',
  },
  locationText: {
    fontSize: 12,
    color: '#777',
  },
  servicesContainer: {
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginBottom: 8,
  },
  servicesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f5f5f5',
  },
  serviceName: {
    fontSize: 12,
    color: '#555',
    flex: 1,
    marginRight: 8,
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
  },
  totalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paidBadge: {
    backgroundColor: '#4CAF50',
  },
  unpaidBadge: {
    backgroundColor: '#F44336',
  },
  paymentText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  cancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  payButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  activeTabButton: {
    backgroundColor: $.tint_3,
  },
  tabButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabButtonText: {
    color: 'white',
  },
});