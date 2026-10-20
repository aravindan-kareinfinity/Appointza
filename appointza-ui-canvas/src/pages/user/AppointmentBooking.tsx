import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Calendar as CalendarIcon, 
  CalendarCheck,
  Clock, 
  MapPin, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Info,
  // CreditCard, // TODO: Future implementation - Payment integration
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import UserLayout from "@/components/layout/UserLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCurrentAppPath,
  getMainAppAuthUrl,
  mustUseMainAppForAuth,
  redirectToLogin,
} from "@/utils/authNavigation.util";
import { useToast } from "@/hooks/use-toast";
import { OrganisationService } from "@/services/organisation.service";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { OrganisationServiceTimingService } from "@/services/organisationservicetiming.service";
import { OrganisationServicesService } from "@/services/organisationservices.service";
import { FilesService } from "@/services/files.service";
import { AppoinmentService } from "@/services/appoinment.service";
import { Organisation, OrganisationSelectReq } from "@/models/organisation.model";
import { OrganisationLocation, OrganisationLocationSelectReq } from "@/models/organisationlocation.model";
import { OrganisationServiceTiming, OrganisationServiceTimingSelectReq, Weeks } from "@/models/organisationservicetiming.model";
import { OrganisationServices, OrganisationServicesSelectReq } from "@/models/organisationservices.model";
import { AppoinmentFinal, SelectedSerivice, AppoinmentSelectReq } from "@/models/appoinment.model";
import { DayOfWeekUtil } from "@/utils/dayofweek.util";
import type { CreatePaymentOrderReq, VerifyPaymentReq } from "@/services/payment.service";
import { environment } from "@/utils/environment";
import { getServiceEffectivePriceForDate } from "@/utils/servicePricing.util";
import {
  parseDotNetTimeSpanToMilliseconds,
  isTimeSlotInPastForToday,
} from "@/utils/appointmentBookingTime.util";
import { BookingTimeSlotPicker } from "@/components/booking/BookingTimeSlotPicker";
import { parseOrganisationAppointmentSettings } from "@/utils/organisationAppointmentSettings.util";

interface HolidayInfo {
  date: Date;
  reason: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
}

const AppointmentBooking = () => {
  const { organisationId, organisationLocationId } = useParams<{
    organisationId: string;
    organisationLocationId: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // API services
  const organisationService = useMemo(() => new OrganisationService(), []);
  const organisationLocationService = useMemo(() => new OrganisationLocationService(), []);
  const organisationServiceTimingService = useMemo(() => new OrganisationServiceTimingService(), []);
  const organisationServicesService = useMemo(() => new OrganisationServicesService(), []);
  const filesService = useMemo(() => new FilesService(), []);
  const appointmentService = useMemo(() => new AppoinmentService(), []);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [organisationDetails, setOrganisationDetails] = useState<Organisation | null>(null);
  const [locationDetails, setLocationDetails] = useState<OrganisationLocation | null>(null);
  const [services, setServices] = useState<OrganisationServices[]>([]);
  const [timeSlots, setTimeSlots] = useState<AppoinmentFinal[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AppoinmentFinal>(new AppoinmentFinal());
  const [selectedServices, setSelectedServices] = useState<SelectedSerivice[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPaymentRequired, setIsPaymentRequired] = useState(false);
  const [hasPaymentCredentials, setHasPaymentCredentials] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState<AppoinmentFinal | null>(null);
  const [holidayDates, setHolidayDates] = useState<HolidayInfo[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [hasLeaveRequests, setHasLeaveRequests] = useState(false);
  const [isLoadingLeaveRequests, setIsLoadingLeaveRequests] = useState(false);
  const [bookingWindowDays, setBookingWindowDays] = useState<number>(5); // Default to 5 days if not loaded
  const appliedServicePreselect = useRef(false);

  // Auth tokens live on the main app host only. Never book on org subdomains.
  useEffect(() => {
    if (!mustUseMainAppForAuth()) return;
    window.location.replace(getMainAppAuthUrl(getCurrentAppPath()));
  }, []);

  const preselectedServiceId = useMemo(() => {
    const raw = searchParams.get("serviceId") || searchParams.get("serviceid") || "";
    const parsed = parseInt(raw, 10);
    return parsed > 0 ? parsed : 0;
  }, [searchParams]);

  // Convert leave requests to holiday dates
  const convertLeaveRequestsToHolidays = useCallback(() => {
    if (!hasLeaveRequests || leaveRequests.length === 0) {
      setHolidayDates([]);
      return;
    }

    const holidays: HolidayInfo[] = leaveRequests.map(leave => ({
      date: new Date(leave.appointmentdate),
      reason: leave.isfullday ? 'Full Day Leave' : 'Half Day Leave',
      isFullDay: leave.isfullday,
      startTime: leave.isfullday ? undefined : leave.start_time?.slice(0, 5), // Convert HH:mm:ss to HH:mm
      endTime: leave.isfullday ? undefined : leave.end_time?.slice(0, 5) // Convert HH:mm:ss to HH:mm
    }));

    setHolidayDates(holidays);
    console.log('🔄 Converted leave requests to holidays:', holidays);
  }, [hasLeaveRequests, leaveRequests]);

  // Initialize holiday dates - only use actual leave requests from database
  const initializeHolidayDates = useCallback(() => {
    // Don't add any hardcoded holidays - only use actual leave requests
    setHolidayDates([]);
  }, []);

  // Check if date is holiday
  const isHoliday = useCallback((date: Date): boolean => {
    return holidayDates.some(holiday => 
      holiday.date.toDateString() === date.toDateString() && holiday.isFullDay
    );
  }, [holidayDates]);

  // Check if date has holiday
  const hasHoliday = useCallback((date: Date): boolean => {
    return holidayDates.some(holiday => 
      holiday.date.toDateString() === date.toDateString()
    );
  }, [holidayDates]);

  // Get holiday info
  const getHolidayInfo = useCallback((date: Date): HolidayInfo | null => {
    return holidayDates.find(holiday => 
      holiday.date.toDateString() === date.toDateString()
    ) || null;
  }, [holidayDates]);

  // Check if time slot is blocked
  const isTimeSlotBlocked = useCallback((date: Date, timeSlot: string): boolean => {
    const holidayInfo = getHolidayInfo(date);
    if (!holidayInfo || holidayInfo.isFullDay) {
      return false;
    }

    const slotTime = timeSlot.split(':').slice(0, 2).join(':');
    const startTime = holidayInfo.startTime || '00:00';
    const endTime = holidayInfo.endTime || '23:59';

    return slotTime >= startTime && slotTime < endTime;
  }, [getHolidayInfo]);

  // Check if time slot is blocked by leave request
  const isTimeSlotBlockedByLeave = useCallback((date: Date, timeSlot: string): boolean => {
    if (!hasLeaveRequests || leaveRequests.length === 0) {
      return false;
    }

    const slotTime = timeSlot.split(':').slice(0, 2).join(':');
    const dateString = date.toISOString().split('T')[0];

    return leaveRequests.some(leave => {
      const leaveDate = new Date(leave.appointmentdate).toISOString().split('T')[0];
      if (leaveDate !== dateString) return false;

      // Check if it's a full day leave
      if (leave.isfullday) return true;

      // Check if it's a half day leave that blocks this time slot
      if (leave.start_time && leave.end_time) {
        const leaveStart = leave.start_time.slice(0, 5); // Extract HH:mm from HH:mm:ss
        const leaveEnd = leave.end_time.slice(0, 5); // Extract HH:mm from HH:mm:ss
        
        return slotTime >= leaveStart && slotTime < leaveEnd;
      }

      return false;
    });
  }, [hasLeaveRequests, leaveRequests]);

  // Get leave info for a specific date
  const getLeaveInfoForDate = useCallback((date: Date) => {
    if (!hasLeaveRequests || leaveRequests.length === 0) {
      return null;
    }

    const dateString = date.toISOString().split('T')[0];
    return leaveRequests.find(leave => {
      const leaveDate = new Date(leave.appointmentdate).toISOString().split('T')[0];
      return leaveDate === dateString;
    });
  }, [hasLeaveRequests, leaveRequests]);

  // Calculate price based on selected date (weekday/weekend)
  const calculateServicePrice = useCallback((service: OrganisationServices, date: Date): number => {
    return getServiceEffectivePriceForDate(service, date).effectivePrice;
  }, []);

  // Calculate total amount based on selected date (weekday/weekend pricing)
  const calculateTotalAmount = useCallback(() => {
    if (organisationDetails?.isserviceamount) {
      // Calculate total using prices based on selected date
      return selectedServices.reduce((total, selectedService) => {
        // Find the original service to get pricing info
        const service = services.find(s => s.id === selectedService.id);
        if (!service) return total;
        return total + calculateServicePrice(service, selectedDate);
      }, 0);
    } else {
      return organisationDetails?.booking_amount || 5.10;
    }
  }, [organisationDetails, selectedServices, services, selectedDate, calculateServicePrice]);

  // Carousel navigation functions
  const nextImage = useCallback(() => {
    try {
      const images = locationDetails?.images || 
                    locationDetails?.attributes?.images || 
                    (locationDetails as any)?.images || 
                    [];
      if (images.length > 0) {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }
    } catch (error) {
      console.error('Error in nextImage:', error);
    }
  }, [locationDetails]);

  const prevImage = useCallback(() => {
    try {
      const images = locationDetails?.images || 
                    locationDetails?.attributes?.images || 
                    (locationDetails as any)?.images || 
                    [];
      if (images.length > 0) {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    } catch (error) {
      console.error('Error in prevImage:', error);
    }
  }, [locationDetails]);

  const goToImage = useCallback((index: number) => {
    try {
      const images = locationDetails?.images || 
                    locationDetails?.attributes?.images || 
                    (locationDetails as any)?.images || 
                    [];
      if (index >= 0 && index < images.length) {
        setCurrentImageIndex(index);
      }
    } catch (error) {
      console.error('Error in goToImage:', error);
    }
  }, [locationDetails]);

  // Load organization details
  const loadOrganisationDetails = useCallback(async () => {
    if (!organisationId || !organisationLocationId) return;

    setIsLoading(true);
    try {
      const orgReq = new OrganisationSelectReq();
      orgReq.id = parseInt(organisationId);

      const locReq = new OrganisationLocationSelectReq();
      locReq.organisationid = parseInt(organisationId);
      locReq.id = parseInt(organisationLocationId);

      const [orgRes, locRes] = await Promise.all([
        organisationService.select(orgReq),
        organisationLocationService.selectPublic(locReq),
      ]);

      if (orgRes && orgRes.length > 0) {
        setOrganisationDetails(orgRes[0]);
      }

      if (locRes && locRes.length > 0) {
        console.log('🔍 Location data loaded:', locRes[0]);
        console.log('🔍 isPaymentRequired value:', locRes[0].isPaymentRequired);
        console.log('🔍 isPaymentRequired type:', typeof locRes[0].isPaymentRequired);
        setLocationDetails(locRes[0]);
        const paymentRequired = locRes[0].isPaymentRequired === true || locRes[0].isPaymentRequired === 'true';
        setIsPaymentRequired(paymentRequired);
        console.log('💰 Payment required (final):', paymentRequired);
        
        // Check if payment gateway credentials exist and are active for the organization
        // If no records OR is_active = false, make it free booking
        if (paymentRequired && parseInt(organisationId || '0') > 0) {
          try {
            const credentialsResponse = await fetch(`${environment.baseurl}/api/PaymentGatewayCredentials/Select`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                item: {
                  organization_id: parseInt(organisationId || '0'),
                  gateway_name: 'razorpay',
                  is_active: true  // Only get active credentials
                }
              })
            });
            
            if (credentialsResponse.ok) {
              const credentialsResult = await credentialsResponse.json();
              const credentials = credentialsResult.item || [];
              
              // Check if we have at least one active Razorpay credential
              // If no records found OR all are inactive, credentials.length will be 0
              const hasActiveCredentials = credentials.length > 0 && 
                credentials.some((cred: any) => cred.is_active === true && cred.gateway_name === 'razorpay');
              
              setHasPaymentCredentials(hasActiveCredentials);
              console.log('💳 Payment credentials check:', {
                found: credentials.length,
                hasActive: hasActiveCredentials,
                credentials: credentials
              });
              
              // If no active credentials, treat as free booking
              if (!hasActiveCredentials) {
                console.log('💰 No active payment credentials found - booking will be free');
              }
            } else {
              // API error - treat as free booking
              setHasPaymentCredentials(false);
              console.log('💰 Payment credentials API error - booking will be free');
            }
          } catch (error) {
            console.error('Error checking payment credentials:', error);
            // Error checking credentials - treat as free booking for safety
            setHasPaymentCredentials(false);
            console.log('💰 Error checking credentials - booking will be free');
          }
        } else {
          // Payment not required - free booking
          setHasPaymentCredentials(false);
        }
      }
    } catch (error) {
      console.error('Error loading organization details:', error);
      toast({
        title: "Error",
        description: "Failed to load organization details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [organisationId, organisationLocationId, organisationService, organisationLocationService, toast]);

  // Load services
  const loadServices = useCallback(async () => {
    if (!organisationId) return;

    try {
      const req = new OrganisationServicesSelectReq();
      req.organisationid = parseInt(organisationId);
      if (organisationLocationId > 0) {
        req.organisationlocationid = parseInt(organisationLocationId);
      }
      const response = await organisationServicesService.select(req);
      if (response) {
        // Filter only active services
        const activeServices = response.filter(service => service.isactive);
        console.log('📦 Services loaded:', {
          total: response.length,
          active: activeServices.length,
          services: activeServices.map(s => ({
            id: s.id,
            name: s.Servicename,
            isactive: s.isactive,
            show_price: s.show_price,
            is_price_different: s.is_price_different,
            weekday_price: s.weekday_price,
            weekend_price: s.weekend_price,
            prize: s.prize,
            offerprize: s.offerprize
          }))
        });
        setServices(activeServices);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive"
      });
    }
  }, [organisationId, organisationServicesService, toast]);

  // Load leave requests
  const loadLeaveRequests = useCallback(async () => {
    if (!organisationId || !organisationLocationId) return;

    setIsLoadingLeaveRequests(true);
    try {
      const req = {
        organisationid: parseInt(organisationId),
        organisationlocationid: parseInt(organisationLocationId),
        appointmentdate: sendToApi(selectedDate)
      };

      const response = await organisationServiceTimingService.getLeaveRequests(req);
      
      console.log('🔍 Leave requests response:', response);
      console.log('🔍 Leave requests length:', response?.length);
      
      if (response && response.length > 0) {
        setLeaveRequests(response);
        setHasLeaveRequests(true);
        
        console.log('✅ Leave requests loaded:', {
          count: response.length,
          requests: response.map(leave => ({
            date: leave.appointmentdate,
            isfullday: leave.isfullday,
            start_time: leave.start_time,
            end_time: leave.end_time
          }))
        });
      } else {
        console.log('ℹ️ No leave requests found');
        setLeaveRequests([]);
        setHasLeaveRequests(false);
      }
    } catch (error) {
      console.error('❌ Error loading leave requests:', error);
      // Don't show error toast for leave requests as it's not critical
    } finally {
      setIsLoadingLeaveRequests(false);
    }
  }, [organisationId, organisationLocationId, selectedDate, organisationServiceTimingService]);

  // Convert leave requests to holidays whenever leave requests change
  useEffect(() => {
    convertLeaveRequestsToHolidays();
  }, [convertLeaveRequestsToHolidays]);

  // Load booking window settings
  const loadBookingWindow = useCallback(async () => {
    if (!organisationId || !organisationLocationId) return;

    try {
      const orgReq = new OrganisationSelectReq();
      orgReq.id = parseInt(organisationId);
      const orgRes = await organisationService.select(orgReq);
      if (orgRes && orgRes.length > 0) {
        const fromOrg = parseOrganisationAppointmentSettings(orgRes[0].attributes_json);
        if (fromOrg.hasOpenbefore) {
          setBookingWindowDays(fromOrg.openbefore);
          return;
        }
      }

      const req = new OrganisationServiceTimingSelectReq();
      req.organisationid = parseInt(organisationId);
      req.organisationlocationid = parseInt(organisationLocationId);
      req.day_of_week = 1;
      req.appointmentdate = sendToApi(new Date());

      const response = await organisationServiceTimingService.select(req);
      if (response && response.length > 0) {
        setBookingWindowDays(response[0].openbefore || 0);
      }
    } catch (error) {
      console.error("Error loading booking window:", error);
    }
  }, [organisationId, organisationLocationId, organisationService, organisationServiceTimingService]);

  // Load time slots
  const loadTimeSlots = useCallback(async () => {
    if (!organisationId || !organisationLocationId) return;

    try {
      const req = new OrganisationServiceTimingSelectReq();
      req.organisationid = parseInt(organisationId);
      req.organisationlocationid = parseInt(organisationLocationId);
      
      const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      const dayNumber = Weeks[dayName as keyof typeof Weeks];
      req.day_of_week = dayNumber;
      req.appointmentdate = sendToApi(selectedDate);

      const response = await organisationServiceTimingService.selecttimingslot(req);
      
      if (response) {
        setTimeSlots(response);
      }
    } catch (error) {
      console.error('❌ Error loading time slots:', error);
      toast({
        title: "Error",
        description: "Failed to load time slots",
        variant: "destructive"
      });
    }
  }, [organisationId, organisationLocationId, selectedDate, organisationServiceTimingService, toast]);

  // Convert date for API
  const sendToApi = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return utcDate;
  };

  // Handle service selection
  const handleServiceSelection = (service: OrganisationServices) => {
    const item = new SelectedSerivice();
    item.id = service.id;
    item.servicename = service.Servicename;
    // Use calculated price based on selected date
    const calculatedPrice = calculateServicePrice(service, selectedDate);
    item.serviceprice = calculatedPrice;
    item.servicetimetaken = service.timetaken;
    item.iscombo = service.Iscombo;

    setSelectedServices(prevSelected => {
      const isSelected = prevSelected.some(s => s.id === item.id);
      const newSelectedServices = isSelected
        ? prevSelected.filter(s => s.id !== item.id)
        : [...prevSelected, item];

      // Calculate total duration
      const totalDuration = newSelectedServices.reduce(
        (sum, s) => sum + s.servicetimetaken,
        0
      );

      // Update end time
      if (selectedTimeSlot.fromtime) {
        const baseTime = new Date(`1970-01-01T${selectedTimeSlot.fromtime}`);
        const endTime = new Date(baseTime.getTime() + totalDuration * 60000);
        
        setSelectedTimeSlot(prev => ({
          ...prev,
          totime: endTime.toTimeString().split(' ')[0]
        }));
      }

      return newSelectedServices;
    });
  };

  useEffect(() => {
    if (appliedServicePreselect.current || preselectedServiceId <= 0 || services.length === 0) {
      return;
    }
    const match = services.find((service) => service.id === preselectedServiceId);
    if (!match) {
      return;
    }
    appliedServicePreselect.current = true;
    handleServiceSelection(match);
  }, [preselectedServiceId, services, handleServiceSelection]);

  // Handle time slot selection
  const handleTimeSlotSelection = (timeSlot: AppoinmentFinal) => {
    if (isTimeSlotInPastForToday(selectedDate, timeSlot.fromtime)) {
      toast({
        title: "Time no longer available",
        description: "That time has already passed today. Please choose a later slot.",
        variant: "destructive",
      });
      return;
    }

    if (selectedServices.length > 0) {
      const totalDuration = selectedServices.reduce(
        (sum, service) => sum + service.servicetimetaken,
        0
      );

      const baseTime = new Date(`1970-01-01T${timeSlot.fromtime}`);
      const endTime = new Date(baseTime.getTime() + totalDuration * 60000);

      setSelectedTimeSlot({
        ...timeSlot,
        totime: endTime.toTimeString().split(' ')[0]
      });
    } else {
      setSelectedTimeSlot({
        ...timeSlot,
        totime: timeSlot.fromtime
      });
    }
  };

  // Format time from API TimeSpan (.NET may serialize as "23:15:00" or "1.00:00:00" after midnight)
  const formatTime = (timeString: string) => {
    const ms = parseDotNetTimeSpanToMilliseconds(timeString);
    if (ms == null || !Number.isFinite(ms)) return "—";
    const d = new Date(new Date(1970, 0, 1).getTime() + ms);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Handle booking
  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in before booking an appointment. You will be redirected to the login page.",
        variant: "destructive"
      });
      // Redirect to login with return URL
      redirectToLogin(getCurrentAppPath(), navigate);
      return;
    }

    if (isHoliday(selectedDate)) {
      const holidayInfo = getHolidayInfo(selectedDate);
      toast({
        title: "Cannot Book on Holiday",
        description: `${holidayInfo?.reason || 'Holiday'} - Please select a different date`,
        variant: "destructive"
      });
      return;
    }

    if (hasHoliday(selectedDate) && isTimeSlotBlocked(selectedDate, selectedTimeSlot.fromtime)) {
      const holidayInfo = getHolidayInfo(selectedDate);
      toast({
        title: "Time Slot Not Available",
        description: `${holidayInfo?.reason} - This time slot is blocked`,
        variant: "destructive"
      });
      return;
    }

    if (isTimeSlotInPastForToday(selectedDate, selectedTimeSlot.fromtime)) {
      toast({
        title: "Time no longer available",
        description: "That time has already passed today. Pick a later time slot.",
        variant: "destructive",
      });
      return;
    }

     // Check for full day leave first
     if (hasLeaveRequests) {
       const leaveInfo = getLeaveInfoForDate(selectedDate);
       if (leaveInfo && leaveInfo.isfullday) {
         toast({
           title: "Cannot Book on Full Day Leave",
           description: "This date has a full day leave request. Please select a different date.",
           variant: "destructive"
         });
         return;
       }
     }

     if (isTimeSlotBlockedByLeave(selectedDate, selectedTimeSlot.fromtime)) {
       toast({
         title: "Time Slot Not Available",
         description: "This time slot is blocked due to a leave request",
         variant: "destructive"
       });
       return;
     }

    if (selectedServices.length === 0) {
      toast({
        title: "No Services Selected",
        description: "Please select at least one service before booking",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTimeSlot.fromtime) {
      toast({
        title: "No Time Selected",
        description: "Please select a time slot before booking",
        variant: "destructive"
      });
      return;
    }

    // First, validate slot availability by attempting to book
    // This will check if the slot is available before initiating payment
    const appointment = new AppoinmentFinal();
    appointment.appoinmentdate = sendToApi(selectedDate);
    appointment.userid = user?.id || 0;
    appointment.organisationlocationid = parseInt(organisationLocationId || '0');
    appointment.organizationid = parseInt(organisationId || '0');
    appointment.totime = selectedTimeSlot.totime;
    appointment.fromtime = selectedTimeSlot.fromtime;
    appointment.attributes.servicelist = selectedServices;

    try {
      // Try to book first - this will validate slot availability
      // If payment is required, it will return "PAYMENT_REQUIRED"
      // If slot is not available, it will return an error message
      const validationResponse = await organisationServiceTimingService.Bookappoinment(appointment);
      
      console.log('📋 Booking validation response:', validationResponse);
      
      // Check if payment is required and credentials exist
      const totalAmount = calculateTotalAmount();
      
      // Handle PAYMENT_REQUIRED response from API
      if (validationResponse === "PAYMENT_REQUIRED" || validationResponse === "PAYMENT_REQUIRED") {
        // API says payment is required - check if we have active credentials
        if (hasPaymentCredentials && totalAmount > 0) {
          // We have credentials - proceed with payment flow
          console.log('💳 Payment required and credentials available - initiating payment');
          setPendingAppointment(appointment);
          handlePaymentFlow(appointment);
        } else {
          // No active credentials - treat as free booking
          // Set ispaid = true to bypass payment requirement in backend
          console.log('💰 Payment required but no active credentials - booking as free');
          appointment.ispaid = true; // Mark as paid to allow free booking
          const freeBookingResponse = await organisationServiceTimingService.Bookappoinment(appointment);
          
          if (freeBookingResponse === "Successfully booked." || freeBookingResponse === "Successfully booked") {
            setSelectedServices([]);
            setSelectedTimeSlot(new AppoinmentFinal());
            
            toast({
              title: "Appointment Booked Successfully!",
              description: `Your appointment has been booked successfully (free booking).`,
            });
            
            navigate('/user/dashboard');
          } else {
            toast({
              title: "Booking Error",
              description: freeBookingResponse || "Unable to complete booking. Please try again.",
              variant: "destructive"
            });
          }
        }
      } else if (validationResponse === "Successfully booked." || validationResponse === "Successfully booked") {
        // Slot is available, no payment required - already booked
        setSelectedServices([]);
        setSelectedTimeSlot(new AppoinmentFinal());
        
        toast({
          title: "Appointment Booked Successfully!",
          description: `Your appointment has been booked successfully!`,
        });
        
        navigate('/user/dashboard');
      } else {
        // Slot is not available or other error - show the error message
        toast({
          title: "Slot Not Available",
          description: validationResponse || "This time slot is no longer available. Please select another time.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error validating slot availability:', error);
      toast({
        title: "Error",
        description: error.message || "There was an error checking slot availability. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle direct booking (without payment) - All bookings are free
  const handleDirectBooking = async () => {
    try {
      // TODO: Future implementation - Payment integration
      // setIsProcessingPayment(true);
      
      const appointment = new AppoinmentFinal();
      appointment.appoinmentdate = sendToApi(selectedDate);
      appointment.userid = user?.id || 0;
      appointment.organisationlocationid = parseInt(organisationLocationId || '0');
      appointment.organizationid = parseInt(organisationId || '0');
      appointment.totime = selectedTimeSlot.totime;
      appointment.fromtime = selectedTimeSlot.fromtime;
      appointment.attributes.servicelist = selectedServices;

      const response = await organisationServiceTimingService.Bookappoinment(appointment);

      if (response === "Successfully booked." || response === "Successfully booked") {
        setSelectedServices([]);
        setSelectedTimeSlot(new AppoinmentFinal());

        toast({
          title: "Appointment Booked Successfully!",
          description: `Your appointment has been booked successfully!`,
        });

        navigate('/user/dashboard');
      } else {
        toast({
          title: "Booking Error",
          description: response || 'Unknown error occurred',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "There was an error booking your appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      // TODO: Future implementation - Payment integration
      // setIsProcessingPayment(false);
    }
  };

  // Handle payment flow
  const handlePaymentFlow = async (appointment: AppoinmentFinal) => {
    try {
      setIsProcessingPayment(true);
      
      // Validate user is authenticated
      if (!user || !user.id || user.id <= 0) {
        toast({
          title: "Authentication Required",
          description: "Please log in to proceed with payment",
          variant: "destructive"
        });
        setIsProcessingPayment(false);
        redirectToLogin(getCurrentAppPath(), navigate);
        return;
      }

      // Validate organization and location IDs
      const orgId = parseInt(organisationId || '0');
      const locId = parseInt(organisationLocationId || '0');
      
      if (orgId <= 0 || locId <= 0) {
        toast({
          title: "Invalid Location",
          description: "Invalid organization or location. Please try again.",
          variant: "destructive"
        });
        setIsProcessingPayment(false);
        return;
      }
      
      // Calculate total amount
      const totalAmount = calculateTotalAmount();
      
      if (totalAmount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Payment amount must be greater than zero",
          variant: "destructive"
        });
        setIsProcessingPayment(false);
        return;
      }

      console.log('💰 Creating payment order:', {
        organizationid: orgId,
        organisationlocationid: locId,
        userid: user.id,
        amount: totalAmount,
        appointmentdate: selectedDate.toISOString(),
        servicelist: selectedServices
      });

      // Create payment order - server will recalculate amount for security
      const paymentReq: CreatePaymentOrderReq = {
        organizationid: orgId,
        organisationlocationid: locId,
        userid: user.id,
        amount: totalAmount, // Server will recalculate this for security
        currency: "INR",
        receipt: `appt_${locId}_${Date.now()}`,
        appointmentdate: selectedDate.toISOString(), // Required for weekend/weekday pricing
        servicelist: selectedServices.map(s => ({
          id: s.id,
          servicename: s.servicename,
          serviceprice: s.serviceprice,
          servicetimetaken: s.servicetimetaken,
          iscombo: s.iscombo
        })) // Required for service-based pricing
      };

      const { PaymentService } = await import("@/services/payment.service");
      const { loadScript } = await import("@/utils/razorpay.util");
      const paymentService = new PaymentService();
      const paymentOrder = await paymentService.createOrder(paymentReq);
      
      // Load Razorpay script
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      
      // Initialize Razorpay checkout
      const options = {
        key: paymentOrder.key,
        amount: paymentOrder.amount * 100, // Convert to paise
        currency: paymentOrder.currency,
        name: organisationDetails?.name || "Appointza",
        description: `Payment for appointment booking`,
        order_id: paymentOrder.orderid,
        handler: async function (response: any) {
          await handlePaymentSuccess(response, appointment);
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.mobile || ""
        },
        theme: {
          color: "#2563eb"
        },
        modal: {
          ondismiss: function() {
            setIsProcessingPayment(false);
            setShowPaymentModal(false);
          }
        }
      };

      const razorpay = (window as any).Razorpay(options);
      razorpay.open();
      setShowPaymentModal(true);
      
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
      setIsProcessingPayment(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (response: any, appointment: AppoinmentFinal) => {
    try {
      setIsProcessingPayment(true);
      
      // First, book the appointment (mark as paid)
      appointment.ispaid = true;
      const bookingResponse = await organisationServiceTimingService.Bookappoinment(appointment);

      if (bookingResponse === "PAYMENT_REQUIRED") {
        toast({
          title: "Payment Required",
          description: "Please complete payment to book this appointment",
          variant: "destructive"
        });
        return;
      }

      if (bookingResponse === "Successfully booked." || bookingResponse === "Successfully booked") {
        // Fetch the newly created appointment to get its ID
        const appointmentReq = new AppoinmentSelectReq();
        appointmentReq.userid = user?.id || 0;
        appointmentReq.organisationlocationid = appointment.organisationlocationid;
        appointmentReq.organisationid = appointment.organizationid;
        appointmentReq.appointmentdate = appointment.appoinmentdate;
        
        const appointments = await appointmentService.select(appointmentReq);
        // Find the appointment we just created (most recent, matching time and date)
        const bookedAppointment = appointments
          .filter(apt => {
            const aptFromTime = typeof apt.fromtime === 'string' 
              ? apt.fromtime 
              : apt.fromtime instanceof Date 
                ? apt.fromtime.toTimeString().slice(0, 5)
                : '';
            const aptToTime = typeof apt.totime === 'string'
              ? apt.totime
              : apt.totime instanceof Date
                ? apt.totime.toTimeString().slice(0, 5)
                : '';
            return aptFromTime === appointment.fromtime &&
                   aptToTime === appointment.totime &&
                   new Date(apt.appoinmentdate).toDateString() === appointment.appoinmentdate.toDateString();
          })
          .sort((a, b) => b.id - a.id)[0]; // Get the most recent one

        if (bookedAppointment && bookedAppointment.id > 0) {
          // Verify payment with appointment ID
          try {
            const verifyReq: VerifyPaymentReq = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointmentid: bookedAppointment.id
            };

            const { PaymentService } = await import("@/services/payment.service");
            const paymentService = new PaymentService();
            const verifyResult = await paymentService.verifyPayment(verifyReq);
            
            if (verifyResult.isvalid) {
              toast({
                title: "Payment Successful!",
                description: "Your appointment has been booked and payment is confirmed.",
              });
            } else {
              toast({
                title: "Payment Verification Failed",
                description: verifyResult.message || "Please contact support with your payment ID.",
                variant: "destructive"
              });
            }
          } catch (verifyError: any) {
            console.error('Payment verification error:', verifyError);
            toast({
              title: "Payment Verification Error",
              description: "Payment was successful but verification failed. Please contact support.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Payment Successful!",
            description: "Your appointment has been booked. Payment verification will be processed.",
          });
        }

        setSelectedServices([]);
        setSelectedTimeSlot(new AppoinmentFinal());
        setPendingAppointment(null);
        setShowPaymentModal(false);

        navigate('/user/dashboard');
      } else {
        toast({
          title: "Booking Error",
          description: bookingResponse || 'Unknown error occurred',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "There was an error processing your payment. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Load data on mount (leave requests load via selectedDate effect)
  useEffect(() => {
    void Promise.all([
      loadOrganisationDetails(),
      loadServices(),
      loadBookingWindow(),
    ]);
    initializeHolidayDates();
  }, [loadOrganisationDetails, loadServices, loadBookingWindow, initializeHolidayDates]);

  // Reset carousel when location changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [locationDetails]);

  // Ensure currentImageIndex is within bounds
  useEffect(() => {
    const images = locationDetails?.images || 
                  locationDetails?.attributes?.images || 
                  (locationDetails as any)?.images || 
                  [];
    
    if (images.length > 0 && currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [locationDetails, currentImageIndex]);

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      try {
        const images = locationDetails?.images || 
                      locationDetails?.attributes?.images || 
                      (locationDetails as any)?.images || 
                      [];
        
        if (images.length <= 1) return;
        
        if (event.key === 'ArrowLeft') {
          prevImage();
        } else if (event.key === 'ArrowRight') {
          nextImage();
        }
      } catch (error) {
        console.error('Error in keyboard navigation:', error);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevImage, nextImage, locationDetails]);

  // Load time slots and leave requests when date changes
  useEffect(() => {
    loadTimeSlots();
    loadLeaveRequests();
  }, [loadTimeSlots, loadLeaveRequests, selectedDate]);

  useEffect(() => {
    setSelectedTimeSlot((prev) => {
      if (!prev.fromtime) return prev;
      if (isTimeSlotInPastForToday(selectedDate, prev.fromtime)) {
        return new AppoinmentFinal();
      }
      return prev;
    });
  }, [selectedDate, timeSlots]);

  if (isLoading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading appointment booking...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  // Error boundary fallback
  if (!organisationDetails && !isLoading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load organization details. Please try again.</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="w-full min-h-0 -mx-4 sm:-mx-6 lg:-mx-8 px-3 sm:px-4 lg:px-5">
        {/* Login Prompt for Unauthenticated Users */}
        {!isAuthenticated && (
          <div className="border-b border-orange-200 bg-orange-50 py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-orange-600" />
              <p className="text-sm text-orange-800">
                You need to be logged in to book an appointment.{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-orange-600 underline"
                  onClick={() => redirectToLogin(getCurrentAppPath(), navigate)}
                >
                  Click here to login
                </Button>
              </p>
            </div>
          </div>
        )}

        {/* Leave Request Warning */}
        {hasLeaveRequests && (
          <div className="border-b border-red-200 bg-red-50 py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This location has active leave requests. Some time slots
                may be unavailable for booking.
              </p>
            </div>
          </div>
        )}

        {/* Header — org & location */}
        <div className="border-b border-gray-100 py-4 sm:py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 text-lg font-bold text-white">
              {organisationDetails?.organisationlogo ? (
                <img
                  src={filesService.get(organisationDetails.organisationlogo)}
                  alt={organisationDetails.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : organisationDetails?.imageid ? (
                <img
                  src={filesService.get(organisationDetails.imageid)}
                  alt={organisationDetails.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                (organisationDetails?.name || "A").charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">
                {organisationDetails?.name || "Loading..."}
              </h1>
              <p className="text-sm text-gray-500 flex items-start gap-1.5 mt-0.5">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="min-w-0">
                  {locationDetails
                    ? `${locationDetails.addressline1}, ${locationDetails.addressline2}, ${locationDetails.city}, ${locationDetails.state} - ${locationDetails.pincode}`
                    : "Loading address..."}
                </span>
              </p>
            </div>
          </div>
          {/* <Button
            variant="ghost"
            className="text-orange-600 hover:text-orange-700 font-medium shrink-0 w-full sm:w-auto"
            onClick={() => navigate("/services")}
          >
            Change Location
          </Button> */}
        </div>

        {/* Location Images Carousel */}
        {(() => {
          try {
            const images =
              locationDetails?.images ||
              locationDetails?.attributes?.images ||
              (locationDetails as any)?.images ||
              [];

            if (!images || images.length === 0) {
              return null;
            }

            return (
              <div className="pt-5 border-b border-gray-200/80 pb-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Location Images</h4>
                  <div className="relative">
                    <div className="relative w-full h-52 md:h-64 bg-gray-100 rounded-lg overflow-hidden">
                      {images[currentImageIndex] && (
                        <img
                          src={filesService.get(images[currentImageIndex])}
                          alt={`Location image ${currentImageIndex + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
                            aria-label="Next image"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      )}
                    </div>
                    {images.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        {images.map((imageId: number, index: number) => {
                          if (!imageId) return null;
                          return (
                            <button
                              type="button"
                              key={index}
                              onClick={() => goToImage(index)}
                              className={cn(
                                "flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200",
                                index === currentImageIndex
                                  ? "border-orange-500 ring-2 ring-orange-200"
                                  : "border-gray-200 hover:border-gray-300"
                              )}
                            >
                              <img
                                src={filesService.get(imageId)}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          } catch (error) {
            console.error("Error rendering carousel:", error);
            return null;
          }
        })()}

        <div className="grid md:grid-cols-5 gap-6 py-6 md:gap-6 items-start">
          {/* Left: services — scroll list only on md+ */}
          <div className="md:col-span-3 flex flex-col gap-6 min-h-0 min-w-0">
            <h2 className="text-xl font-semibold mb-0 shrink-0">Available Services</h2>

            {selectedServices.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3 shrink-0">
                <p className="text-sm font-medium text-gray-700">Selected Services</p>
                <div className="flex flex-wrap gap-2">
                  {selectedServices.map((service) => (
                    <Badge
                      key={service.id}
                      variant="secondary"
                      className="px-3 py-1 rounded-full border border-gray-200 bg-white"
                    >
                      {service.servicename}
                    </Badge>
                  ))}
                </div>
                {selectedTimeSlot.fromtime ? (
                  <div className="text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                    {formatTime(selectedTimeSlot.fromtime)} — {formatTime(selectedTimeSlot.totime)}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Select a time slot on the right to confirm your appointment time.
                  </p>
                )}
              </div>
            )}

            <div
              className={cn(
                "min-w-0 space-y-4",
                // Mobile: page scrolls as one surface. Desktop: nested list scroll.
                "md:min-h-0 md:max-h-[min(65dvh,36rem)] md:overflow-y-auto md:overscroll-y-contain md:pr-2 md:[scrollbar-gutter:stable]",
              )}
            >
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No services available for this location.
                </p>
              ) : (
                services.map((service) => {
                const isSelected = selectedServices.some((s) => s.id === service.id);
                const imageId = service.attributes?.ImageIds?.find((id) => (id ?? 0) > 0) ?? 0;
                const imageUrl = imageId ? filesService.getImageUrl(imageId) : "";
                const priceBreakdown = getServiceEffectivePriceForDate(service, selectedDate);
                const calculatedPrice = priceBreakdown.basePrice;
                const displayPrice = priceBreakdown.effectivePrice;

                return (
                  <div
                    key={`${service.id}-${selectedDate.getTime()}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleServiceSelection(service);
                      }
                    }}
                    className={cn(
                      "border rounded-3xl p-5 transition cursor-pointer bg-white",
                      "hover:border-orange-500 hover:shadow-md",
                      isSelected ? "bg-orange-50 border-orange-200 shadow-sm" : "border-gray-200"
                    )}
                    onClick={() => handleServiceSelection(service)}
                  >
                    <div className="flex items-start gap-4">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={service.Servicename}
                          className="h-16 w-16 rounded-2xl object-cover border border-gray-200 shrink-0"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="flex-1 flex justify-between items-start gap-4 min-w-0">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900">{service.Servicename}</h3>
                        <p className="text-sm text-gray-600">
                          {service.timetaken} min session
                        </p>
                      </div>
                      {service.show_price !== false && (
                        <div className="text-right shrink-0">
                          {priceBreakdown.isOfferApplied ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span
                                className={cn(
                                  "text-xl font-bold tabular-nums",
                                  isSelected ? "text-green-600" : "text-gray-900"
                                )}
                              >
                                ₹{displayPrice}
                              </span>
                              <span className="text-sm text-gray-500 line-through tabular-nums">
                                ₹{calculatedPrice}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={cn(
                                "text-xl font-bold tabular-nums",
                                isSelected ? "text-green-600" : "text-gray-900"
                              )}
                            >
                              ₹{displayPrice}
                              {service.is_price_different ? (
                                <span className="text-xs font-normal text-gray-500">
                                  {" "}
                                  (
                                  {selectedDate.getDay() === 0 || selectedDate.getDay() === 6
                                    ? "Weekend"
                                    : "Weekday"}
                                  )
                                </span>
                              ) : null}
                            </span>
                          )}
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>

          {/* Right: date, slots, pricing, confirm — time grid scrolls independently */}
          <div className="md:col-span-2 space-y-6 min-h-0 min-w-0">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <CalendarIcon className="h-4 w-4 text-orange-600 shrink-0" />
                Select Date
              </h3>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-auto rounded-2xl px-5 py-4 justify-start text-left font-normal border-gray-200 shadow-none",
                      hasHoliday(selectedDate) && "border-red-300 bg-red-50"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {format(selectedDate, "PPP")}
                      {isHoliday(selectedDate) && " (Holiday)"}
                      {hasHoliday(selectedDate) && !isHoliday(selectedDate) && " (Partial Leave)"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        if (isHoliday(date)) {
                          const holidayInfo = getHolidayInfo(date);
                          toast({
                            title: "Holiday Selected",
                            description: `${holidayInfo?.reason} - Please select a different date`,
                            variant: "destructive",
                          });
                          return;
                        }

                        if (hasLeaveRequests) {
                          const leaveInfo = getLeaveInfoForDate(date);
                          if (leaveInfo) {
                            if (leaveInfo.isfullday) {
                              toast({
                                title: "Full Day Leave",
                                description:
                                  "This date has a full day leave request. All time slots are unavailable.",
                                variant: "destructive",
                              });
                            } else {
                              toast({
                                title: "Half Day Leave",
                                description: `This date has a half day leave from ${leaveInfo.start_time.slice(0, 5)} to ${leaveInfo.end_time.slice(0, 5)}. Some time slots may be unavailable.`,
                                variant: "default",
                              });
                            }
                          }
                        }

                        setSelectedDate(date);
                        setShowDatePicker(false);
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const checkDate = new Date(date);
                      checkDate.setHours(0, 0, 0, 0);

                      console.log("🗓️ Checking date:", {
                        date: date.toDateString(),
                        checkDate: checkDate.toDateString(),
                        today: today.toDateString(),
                        bookingWindowDays,
                        hasLeaveRequests,
                      });

                      if (checkDate < today) {
                        console.log("🚫 Disabling past date:", date.toDateString());
                        return true;
                      }

                      if (bookingWindowDays > 0) {
                        const maxBookingDate = new Date(today);
                        maxBookingDate.setDate(today.getDate() + bookingWindowDays);
                        maxBookingDate.setHours(23, 59, 59, 999);

                        console.log("📅 Booking window check:", {
                          today: today.toDateString(),
                          checkDate: checkDate.toDateString(),
                          bookingWindowDays,
                          maxBookingDate: maxBookingDate.toDateString(),
                          isBeyondWindow: checkDate > maxBookingDate,
                          daysDifference: Math.ceil(
                            (checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                          ),
                        });

                        if (checkDate > maxBookingDate) {
                          console.log(
                            "🚫 Disabling date beyond booking window:",
                            date.toDateString(),
                            "Max allowed:",
                            maxBookingDate.toDateString()
                          );
                          return true;
                        }
                      }

                      if (isHoliday(date)) {
                        console.log("🚫 Disabling holiday date:", date.toDateString());
                        return true;
                      }

                      console.log("✅ Date is available:", date.toDateString());
                      return false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {bookingWindowDays > 0 && (
                <div className="mt-4 text-xs bg-blue-50 text-blue-700 p-3 rounded-2xl flex items-center gap-2">
                  <Info className="h-4 w-4 shrink-0" />
                  Appointments can only be booked up to {bookingWindowDays} day
                  {bookingWindowDays !== 1 ? "s" : ""} in advance
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-col rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 md:min-h-0">
              <div className="mb-4 flex shrink-0 items-center justify-between gap-2 sm:mb-5">
                <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold sm:text-base">
                  <Clock className="h-4 w-4 shrink-0 text-orange-600" />
                  <span className="truncate">Available Time Slots</span>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto shrink-0 px-2 py-1 text-sm text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                  onClick={loadTimeSlots}
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-1 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              <div
                className={cn(
                  "min-w-0 space-y-4 overflow-x-hidden",
                  // Mobile: expand with the page. Desktop sidebar: keep a capped scroll region.
                  "md:min-h-0 md:max-h-[min(50dvh,28rem)] md:overflow-y-auto md:overscroll-y-contain md:pr-1 md:[scrollbar-gutter:stable]",
                )}
              >
              {timeSlots.length > 0 ? (
                <BookingTimeSlotPicker
                  timeSlots={timeSlots}
                  selectedFromTime={selectedTimeSlot.fromtime}
                  selectedDate={selectedDate}
                  hasLeaveRequests={hasLeaveRequests}
                  leaveInfo={hasLeaveRequests ? getLeaveInfoForDate(selectedDate) : null}
                  formatTime={formatTime}
                  isTimeSlotBlocked={isTimeSlotBlocked}
                  isTimeSlotBlockedByLeave={isTimeSlotBlockedByLeave}
                  isTimeSlotInPastForToday={isTimeSlotInPastForToday}
                  onSelect={handleTimeSlotSelection}
                />
              ) : (
                <div className="text-center py-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
                  <Clock className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">No time slots available for this date</p>
                </div>
              )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 text-center text-blue-700 font-medium">
              {isPaymentRequired && hasPaymentCredentials && calculateTotalAmount() > 0
                ? `Total Amount: ₹${calculateTotalAmount().toLocaleString("en-IN")}`
                : "Appointment is free"}
            </div>

            <Button
              onClick={handleBooking}
              disabled={!isAuthenticated || selectedServices.length === 0 || !selectedTimeSlot.fromtime}
              className="w-full rounded-3xl py-5 h-auto text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md hover:shadow-lg transition border-0 hover:opacity-95 flex items-center justify-center gap-2"
            >
              <CalendarCheck className="h-5 w-5 shrink-0" />
              {!isAuthenticated
                ? "Login to Book Appointment"
                : isPaymentRequired && hasPaymentCredentials && calculateTotalAmount() > 0
                  ? `Pay ₹${calculateTotalAmount().toLocaleString("en-IN")} & Book`
                  : "Confirm Booking"}
            </Button>
          </div>
        </div>

        {/* TODO: Future implementation - Payment integration */}
      </div>
    </UserLayout>
  );
};

export default AppointmentBooking;
