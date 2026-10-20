import { useState, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { OrganizationPageShell } from "@/components/layout/OrganizationPageShell";
import { 
  Clock, 
  Calendar, 
  Home, 
  Plus, 
  Trash, 
  Loader2, 
  X,
  Save,
  Package,
  AlertCircle,
  ArrowRight,
  Copy,
  Pencil,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { OnboardingPageGuide } from "@/components/onboarding/OrganizationOnboarding";
import { OrganisationLocation } from "@/models/organisationlocation.model";
import { 
  OrganisationServiceTiming, 
  Leavereq, 
  OrganisationServiceTimingBulkSaveReq,
  OrganisationServiceTimingSlotReq,
} from "@/models/organisationservicetiming.model";
import { LeaveDates, LeaveDatesDeleteReq } from "@/models/leavedates.model";
import { OrganisationServiceTimingService } from "@/services/organisationservicetiming.service";
import { useOrganisationLocations } from "@/hooks/useOrganisationLocations";
import {
  organisationServiceTimingsQueryKey,
  useOrganisationServiceTimings,
} from "@/hooks/useOrganisationServiceTimings";
import { LeaveDatesService } from "@/services/leavedates.service";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";
import { invalidatePublicSiteCacheForLocation } from "@/utils/publicSiteCache.util";
import { onboardingStepRoute } from "@/utils/organizationOnboarding.util";

function formatTimingTimeForApi(value: Date | string): string {
  if (value instanceof Date) {
    return value.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }
  return String(value);
}

function buildTimingBulkSaveReq(
  organizationId: number,
  locationId: number,
  slotsByDay: Record<number, OrganisationServiceTiming[]>,
  counter: number,
  openBefore: number,
): OrganisationServiceTimingBulkSaveReq {
  const req = new OrganisationServiceTimingBulkSaveReq();
  req.organisationid = organizationId;
  req.organisationlocationid = locationId;
  req.counter = counter;
  req.openbefore = openBefore;
  req.slots = [];

  Object.entries(slotsByDay).forEach(([dayId, slots]) => {
    slots.forEach((slot) => {
      if (!slot.start_time || !slot.end_time) return;
      const entry = new OrganisationServiceTimingSlotReq();
      entry.day_of_week = parseInt(dayId, 10);
      entry.start_time = formatTimingTimeForApi(slot.start_time);
      entry.end_time = formatTimingTimeForApi(slot.end_time);
      req.slots.push(entry);
    });
  });

  return req;
}

const TimingScreen = ({ embedded = false }: { embedded?: boolean }) => {
  const { toast } = useToast();
  const { user, isAuthenticated, userType } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const organizationId = user?.organisationid || 1;
  const { hasCustomDomain, hasServices, hasWebsite, hasTiming, isComplete, isLoading: isLoadingOnboarding } =
    useOnboardingStatus({ enabled: !embedded });
  const inOnboarding = !embedded && !isComplete && hasCustomDomain && hasServices;

  // State management
  const [isLeaveBusy, setIsLeaveBusy] = useState(false);
  const [isSavingTimings, setIsSavingTimings] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<OrganisationLocation | null>(null);
  const [showTimingForm, setShowTimingForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const didAutoSelectLocationRef = useRef(false);

  const { data: locationsData, isLoading: isLoadingLocations } = useOrganisationLocations({
    organisationId: organizationId,
    staffLocationId: user?.locationid || 0,
    enabled: !!organizationId,
  });
  const locations = locationsData ?? [];

  const selectedLocationId = selectedLocation?.id ?? 0;
  const {
    data: timingRows = [],
    isLoading: isFetchingTimings,
  } = useOrganisationServiceTimings({
    organisationId: organizationId,
    locationId: selectedLocationId,
    enabled: showTimingForm && selectedLocationId > 0,
  });
  
  // API services - use useMemo to prevent recreation on every render
  const timingService = useMemo(() => new OrganisationServiceTimingService(), []);
  const leaveDatesService = useMemo(() => new LeaveDatesService(), []);
  
  // Timing states
  const [dayTimeSlots, setDayTimeSlots] = useState<Record<number, OrganisationServiceTiming[]>>({});
  const [counter, setCounter] = useState(0);
  const [openBefore, setOpenBefore] = useState(0);

  // Leave states
  const [leaveRequest, setLeaveRequest] = useState<Leavereq>(new Leavereq());
  const [selectedLeaveDate, setSelectedLeaveDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [leaveList, setLeaveList] = useState<any[]>([]);
  const [editingLeave, setEditingLeave] = useState<any | null>(null);
  const [showLeaveList, setShowLeaveList] = useState(false);

  // Days of week
  const daysOfWeek = [
    { id: 1, label: 'Monday' },
    { id: 2, label: 'Tuesday' },
    { id: 3, label: 'Wednesday' },
    { id: 4, label: 'Thursday' },
    { id: 5, label: 'Friday' },
    { id: 6, label: 'Saturday' },
    { id: 7, label: 'Sunday' },
  ];

  // Initialize day time slots
  const initializeDayTimeSlots = () => {
    const initialSlots: Record<number, OrganisationServiceTiming[]> = {};
    daysOfWeek.forEach(day => {
      initialSlots[day.id] = [];
    });
    return initialSlots;
  };

  // Convert time string to Date
  const timeStringToDate = (timeString: string): Date => {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const now = new Date();
    now.setHours(hours, minutes, seconds, 0);
    return now;
  };

  useEffect(() => {
    if (!showTimingForm || selectedLocationId <= 0) return;

    const newDayTimeSlots = initializeDayTimeSlots();
    timingRows.forEach((timing) => {
      const slot = new OrganisationServiceTiming();
      slot.id = timing.id;
      slot.localid = timing.id || Date.now();
      slot.start_time = timeStringToDate(timing.start_time as string);
      slot.end_time = timeStringToDate(timing.end_time as string);
      slot.day_of_week = timing.day_of_week;

      if (newDayTimeSlots[timing.day_of_week]) {
        newDayTimeSlots[timing.day_of_week].push(slot);
      }
    });

    setDayTimeSlots(newDayTimeSlots);
    if (timingRows.length > 0) {
      setCounter(Math.max(1, timingRows[0]?.counter || 0));
      setOpenBefore(timingRows[0]?.openbefore || 0);
    } else {
      setCounter(0);
      setOpenBefore(0);
    }
  }, [timingRows, selectedLocationId, showTimingForm]);

  const persistTimingSlots = async (
    locationId: number,
    slotsByDay: Record<number, OrganisationServiceTiming[]>,
    nextCounter: number,
    nextOpenBefore: number,
  ) => {
    const payload = buildTimingBulkSaveReq(
      organizationId,
      locationId,
      slotsByDay,
      nextCounter,
      nextOpenBefore,
    );
    await timingService.saveBulk(payload);
    invalidatePublicSiteCacheForLocation(locationId);
    await queryClient.invalidateQueries({
      queryKey: organisationServiceTimingsQueryKey(organizationId, locationId),
    });
    await queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
  };

  // Add time slot
  const addTimeSlot = (dayId: number) => {
    const newTiming = new OrganisationServiceTiming();
    newTiming.localid = Date.now();
    
    // Set default times (9 AM to 5 PM)
    const startTime = new Date();
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date();
    endTime.setHours(17, 0, 0, 0);
    
    newTiming.start_time = startTime;
    newTiming.end_time = endTime;
    newTiming.day_of_week = dayId;

    setDayTimeSlots(prev => ({
      ...prev,
      [dayId]: [...prev[dayId], newTiming],
    }));
  };

  // Apply Monday's hours to all days
  const applyMondayToAllDays = async () => {
    const mondaySlots = dayTimeSlots[1]; // Monday is day 1
    
    if (!mondaySlots || mondaySlots.length === 0) {
      toast({
        title: "No Monday Hours",
        description: "Please set Monday hours first before applying to all days",
        variant: "destructive"
      });
      return;
    }

    // Check if other days have existing hours
    const hasExistingHours = Object.keys(dayTimeSlots).some(dayId => {
      const dayIdNum = parseInt(dayId);
      return dayIdNum > 1 && dayTimeSlots[dayIdNum]?.length > 0;
    });

    if (hasExistingHours) {
      const confirmed = window.confirm(
        "This will overwrite existing hours for Tuesday to Sunday. Are you sure you want to continue?"
      );
      if (!confirmed) return;
    }

    if (!selectedLocation) {
      toast({
        title: "Error",
        description: "No location selected",
        variant: "destructive"
      });
      return;
    }

    try {
      const newDayTimeSlots = { ...dayTimeSlots };
      
      // Apply Monday's slots to all other days (Tuesday to Sunday)
      for (let dayId = 2; dayId <= 7; dayId++) {
        newDayTimeSlots[dayId] = mondaySlots.map(slot => ({
          ...slot,
          localid: Date.now() + Math.random(), // Generate new unique ID
          day_of_week: dayId
        }));
      }

      setDayTimeSlots(newDayTimeSlots);

      setIsSavingTimings(true);
      try {
        await persistTimingSlots(selectedLocation.id, newDayTimeSlots, counter, openBefore);
        toast({
          title: "Success",
          description: "Monday's hours applied and saved to all days (Tuesday to Sunday)",
        });
      } catch (error) {
        console.error('❌ Error saving Monday hours:', error);
        toast({
          title: "Error",
          description: "Failed to save Monday hours to server",
          variant: "destructive"
        });
      } finally {
        setIsSavingTimings(false);
      }
    } catch (error) {
      console.error('❌ Error preparing Monday hours:', error);
    }
  };


  // Remove time slot
  const removeTimeSlot = (dayId: number, slotId: number) => {
    setDayTimeSlots(prev => ({
      ...prev,
      [dayId]: prev[dayId].filter(slot => slot.localid !== slotId),
    }));
  };

  const formatSlotClock = (value: Date | string | undefined) => {
    if (!value) return "";
    if (value instanceof Date) {
      return value.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return String(value).slice(0, 5);
  };

  const parseClockToDate = (clock: string) => {
    const [hours, minutes] = clock.split(":");
    const date = new Date();
    date.setHours(parseInt(hours || "0", 10), parseInt(minutes || "0", 10), 0, 0);
    return date;
  };

  /** Open = has hours; Closed = empty list for that day. */
  const setDayOpen = (dayId: number, open: boolean) => {
    if (open) {
      if ((dayTimeSlots[dayId]?.length ?? 0) === 0) addTimeSlot(dayId);
      return;
    }
    setDayTimeSlots((prev) => ({ ...prev, [dayId]: [] }));
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

  const saveTimingData = async () => {
    try {
      if (!selectedLocation) {
        toast({
          title: "Error",
          description: "No location selected",
          variant: "destructive"
        });
        return;
      }

      setIsSavingTimings(true);
      await persistTimingSlots(
        selectedLocation.id,
        dayTimeSlots,
        counter,
        openBefore,
      );

      if (!isComplete && hasCustomDomain && hasServices && hasWebsite && !embedded) {
        toast({
          title: "Setup complete!",
          description: "Your business is ready — welcome to your dashboard.",
        });
        setShowTimingForm(false);
        setSelectedLocation(null);
        setTimeout(() => navigate("/organization/dashboard"), 600);
        return;
      }
      
      toast({
        title: "Success",
        description: "Business hours saved successfully",
      });
      setShowTimingForm(false);
      setSelectedLocation(null);
    } catch (error) {
      console.error('❌ Error saving timing data:', error);
      toast({
        title: "Error",
        description: "Failed to save business hours",
        variant: "destructive"
      });
    } finally {
      setIsSavingTimings(false);
    }
  };



  // Handle leave submission
  const handleLeaveSubmit = async () => {
    try {
      if (!selectedLeaveDate) {
        toast({
          title: "Error",
          description: "Please select a date",
          variant: "destructive"
        });
        return;
      }

      if (!leaveRequest.isfullday && (!startTime || !endTime)) {
        toast({
          title: "Error",
          description: "Please select start and end time for half day leave",
          variant: "destructive"
        });
        return;
      }

      if (!leaveRequest.organisationid || !leaveRequest.organisationlocationid) {
        toast({
          title: "Error",
          description: "Please select a location",
          variant: "destructive"
        });
        return;
      }

      console.log('📅 Saving leave request:', leaveRequest);
      
      // Prepare leave request with proper formats
      const formatDateTime = (date: Date | null) => {
        if (!date) return "0001-01-01T00:00:00.000Z";
        return date.toISOString();
      };

      const leaveReq = {
        organisationid: leaveRequest.organisationid,
        organisationlocationid: leaveRequest.organisationlocationid,
        appointmentdate: formatDateTime(selectedLeaveDate),
        start_time: leaveRequest.isfullday ? "00:00:00" : startTime,
        end_time: leaveRequest.isfullday ? "00:00:00" : endTime,
        isfullday: leaveRequest.isfullday,
        isforce: leaveRequest.isforce
      };
      
      console.log('📤 Sending to API:', JSON.stringify(leaveReq, null, 2));
      
      let response;
      if (editingLeave) {
        // Use handleEditLeaveSubmit for editing
        await handleEditLeaveSubmit();
        return;
      } else {
        response = await timingService.addLeave(leaveReq);
        console.log('✅ Leave saved successfully:', response);
      }
      
      toast({
        title: "Success",
        description: editingLeave ? "Leave updated successfully" : "Leave booked successfully",
      });
      setShowLeaveForm(false);
      setEditingLeave(null);
      setLeaveRequest(new Leavereq());
      setSelectedLeaveDate(null);
      setStartTime('');
      setEndTime('');
      
      // Refresh leave list
      if (selectedLocation) {
        await fetchLeaveList(selectedLocation.id);
      }
    } catch (error) {
      console.error('❌ Error saving leave:', error);
      toast({
        title: "Error",
        description: "Failed to book leave",
        variant: "destructive"
      });
    }
  };

  // Fetch leave list
  const fetchLeaveList = async (locationId: number) => {
    try {
      setIsLeaveBusy(true);
      const req = {
        organisationid: organizationId,
        organisationlocationid: locationId
      };
      const leaves = await timingService.getLeaveRequests(req);
      setLeaveList(leaves || []);
    } catch (error) {
      console.error('❌ Error fetching leave list:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leave list",
        variant: "destructive"
      });
    } finally {
      setIsLeaveBusy(false);
    }
  };

  // Handle cancel leave
  const handleCancelLeave = async (leave: any) => {
    if (!confirm('Are you sure you want to cancel this leave?')) {
      return;
    }

    try {
      setIsLeaveBusy(true);
      const req = new LeaveDatesDeleteReq();
      req.id = leave.leaveid;  // Use leaveid from API response
      req.version = 1;  // Default version since API doesn't return it
      
      const result = await leaveDatesService.delete(req);
      
      toast({
        title: "Success",
        description: "Leave cancelled successfully",
      });
      
      // Refresh leave list
      if (selectedLocation) {
        await fetchLeaveList(selectedLocation.id);
      }
    } catch (error) {
      console.error('❌ Error cancelling leave:', error);
      toast({
        title: "Error",
        description: "Failed to cancel leave",
        variant: "destructive"
      });
    } finally {
      setIsLeaveBusy(false);
    }
  };
  const handleEditLeave = (leave: any) => {
    setEditingLeave(leave);
    setSelectedLeaveDate(new Date(leave.appointmentdate));
    const leaveReq = new Leavereq();
    leaveReq.organisationid = leave.organisationid;
    leaveReq.organisationlocationid = leave.organisationlocationid;
    leaveReq.isfullday = leave.isfullday;
    leaveReq.isforce = leave.isforce;
    leaveReq.appointmentdate = new Date(leave.appointmentdate);
    leaveReq.start_time = leave.start_time || '';
    leaveReq.end_time = leave.end_time || '';
    setLeaveRequest(leaveReq);
    setStartTime(leave.start_time || '');
    setEndTime(leave.end_time || '');
    setShowLeaveForm(true);
    setShowTimingForm(false);
  };

  // Handle edit leave submission
  const handleEditLeaveSubmit = async () => {
    try {
      if (!selectedLeaveDate) {
        toast({
          title: "Error",
          description: "Please select a date",
          variant: "destructive"
        });
        return;
      }

      if (!leaveRequest.isfullday && (!startTime || !endTime)) {
        toast({
          title: "Error",
          description: "Please select start and end time for half day leave",
          variant: "destructive"
        });
        return;
      }

      if (!leaveRequest.organisationid || !leaveRequest.organisationlocationid) {
        toast({
          title: "Error",
          description: "Please select a location",
          variant: "destructive"
        });
        return;
      }

      // Validate required fields
      if (!editingLeave?.leaveid) {
        toast({
          title: "Error",
          description: "Leave ID is required for update",
          variant: "destructive"
        });
        return;
      }

      // Create LeaveDates object for update
      const leaveReq = new LeaveDates();
      leaveReq.id = editingLeave.leaveid;  // Use leaveid from API response
      leaveReq.organizationid = leaveRequest.organisationid;
      leaveReq.organizationlocationid = leaveRequest.organisationlocationid;
      leaveReq.leaveon = selectedLeaveDate;
      
      // Convert time strings to TimeSpan format for backend
      const formatTimeForBackend = (timeStr: string) => {
        if (!timeStr || timeStr === "00:00:00") return "00:00:00";
        // Ensure format is HH:mm:ss
        const parts = timeStr.split(':');
        if (parts.length === 2) {
          return `${parts[0]}:${parts[1]}:00`;
        }
        return timeStr;
      };
      
      leaveReq.start_time = leaveRequest.isfullday ? "00:00:00" : formatTimeForBackend(startTime);
      leaveReq.end_time = leaveRequest.isfullday ? "00:00:00" : formatTimeForBackend(endTime);
      leaveReq.isfullday = leaveRequest.isfullday;
      leaveReq.version = 1;  // Default version since API doesn't return it
      leaveReq.modifiedby = user?.id || 0;
      leaveReq.modifiedon = new Date();
      leaveReq.isactive = true;
      leaveReq.issuspended = false;
      
      // Set default values for required fields (API doesn't return these)
      leaveReq.createdby = user?.id || 0;
      leaveReq.createdon = new Date();
      leaveReq.parentid = 0;
      leaveReq.isfactory = false;
      leaveReq.notes = "";
      
      // Ensure attributes is properly initialized
      if (!leaveReq.attributes) {
        leaveReq.attributes = new LeaveDates.AttributesData();
      }

      // Validate required fields before sending
      const validationErrors = [];
      if (!leaveReq.id || leaveReq.id <= 0) validationErrors.push("ID is required");
      if (!leaveReq.organizationid || leaveReq.organizationid <= 0) validationErrors.push("Organization ID is required");
      if (!leaveReq.organizationlocationid || leaveReq.organizationlocationid <= 0) validationErrors.push("Organization Location ID is required");
      if (!leaveReq.leaveon) validationErrors.push("Leave date is required");
      if (!leaveReq.start_time) validationErrors.push("Start time is required");
      if (!leaveReq.end_time) validationErrors.push("End time is required");
      
      if (validationErrors.length > 0) {
        console.error('❌ Validation errors:', validationErrors);
        toast({
          title: "Validation Error",
          description: validationErrors.join(', '),
          variant: "destructive"
        });
        return;
      }
      
      console.log('🔍 LeaveDates Update Request:', JSON.stringify(leaveReq, null, 2));
      console.log('🔍 Selected Leave Date:', selectedLeaveDate);
      console.log('🔍 Start Time:', startTime);
      console.log('🔍 End Time:', endTime);
      console.log('🔍 Is Full Day:', leaveRequest.isfullday);
      console.log('🔍 Editing Leave:', editingLeave);
      
      // Try using the Save endpoint instead of Update (Save handles both insert and update)
      const response = await leaveDatesService.save(leaveReq);
      console.log('✅ LeaveDates Save Success:', response);
      
      toast({
        title: "Success",
        description: "Leave updated successfully",
      });
      
      setShowLeaveForm(false);
      setEditingLeave(null);
      setLeaveRequest(new Leavereq());
      setSelectedLeaveDate(null);
      setStartTime('');
      setEndTime('');
      
      // Refresh leave list
      if (selectedLocation) {
        await fetchLeaveList(selectedLocation.id);
      }
    } catch (error) {
      console.error('❌ Error editing leave:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      let errorMessage = "Failed to edit leave";
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).flat().join(', ');
      } else if (error.response?.data?.title) {
        errorMessage = error.response.data.title;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Handle location selection for timing
  const handleLocationSelectForTiming = (location: OrganisationLocation) => {
    setSelectedLocation(location);
    setShowTimingForm(true);
    setShowLeaveForm(false);
    setShowLeaveList(false);
  };

  // Handle location selection for leave
  const handleLocationSelectForLeave = (location: OrganisationLocation) => {
    setSelectedLocation(location);
    setLeaveRequest(prev => ({
      ...prev,
      organisationid: location.organisationid,
      organisationlocationid: location.id
    }));
    fetchLeaveList(location.id);
    setShowTimingForm(false);
    setShowLeaveForm(false);
    setShowLeaveList(true);
  };



  // Auto-select sole location (preserve previous fetchLocations behavior)
  useEffect(() => {
    if (didAutoSelectLocationRef.current) return;
    if (locations.length !== 1) return;
    didAutoSelectLocationRef.current = true;
    const location = locations[0];
    setSelectedLocation(location);
    setShowTimingForm(true);
    setShowLeaveForm(false);
  }, [locations]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-appointza-cream">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-appointza-navy">Authentication Required</h2>
          <p className="mt-2 text-stone-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoadingLocations || (showTimingForm && isFetchingTimings) || (!embedded && isLoadingOnboarding)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-stone-600">Loading business hours…</span>
      </div>
    );
  }

  // Show message if no services exist
  if (!embedded && !hasCustomDomain) {
    return (
      <div className="org-page">
        <div className="org-panel-section">
          <div className={cn(org.card, "mx-auto max-w-2xl overflow-hidden rounded-2xl border-stone-200 bg-white shadow-none")}>
            <div className="border-b border-stone-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <div>
                  <h2 className={org.title}>Custom domain required first</h2>
                  <p className={org.description}>Choose your public booking page address before setting hours.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <p className="text-sm text-stone-600">
                Pick a subdomain that ends with our default domain — for example{" "}
                <span className="font-mono text-stone-800">mysalon.appointza.com</span> — then return here to set
                when you&apos;re open.
              </p>
              <Button
                type="button"
                onClick={() => navigate("/organization/custom-domain")}
                className={cn(org.btnPrimary, "min-h-11 w-full sm:w-auto")}
              >
                Set custom domain
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!embedded && !hasServices) {
    return (
      <div className="org-page">
        <div className="org-panel-section">
          <div className={cn(org.card, "mx-auto max-w-2xl overflow-hidden rounded-2xl border-stone-200 bg-white shadow-none")}>
            <div className="border-b border-stone-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <div>
                  <h2 className={org.title}>Services required first</h2>
                  <p className={org.description}>Add a service before setting business hours.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <p className="text-sm text-stone-600">
                Customers book your services — create at least one service, then return here to set
                when you&apos;re open.
              </p>
              <Button
                type="button"
                onClick={() => navigate("/organization/services")}
                className={cn(org.btnPrimary, "min-h-11 w-full touch-manipulation sm:w-auto")}
              >
                <Package className="mr-2 h-4 w-4" />
                Go to services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!embedded && !isComplete && !hasWebsite) {
    const locationId = locations[0]?.id ?? 0;
    return (
      <div className="org-page">
        <div className="org-panel-section">
          <div className={cn(org.card, "mx-auto max-w-2xl overflow-hidden rounded-2xl border-stone-200 bg-white shadow-none")}>
            <div className="border-b border-stone-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <div>
                  <h2 className={org.title}>Create your website first</h2>
                  <p className={org.description}>Step 3 of setup — build your public booking page before setting hours.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <p className="text-sm text-stone-600">
                Customers need a public page to browse your services. Create and save your website, then return here
                to set when you&apos;re open.
              </p>
              <Button
                type="button"
                onClick={() => navigate(onboardingStepRoute("website", locationId))}
                className={cn(org.btnPrimary, "min-h-11 w-full touch-manipulation sm:w-auto")}
              >
                Create website
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasSingleLocation = locations.length === 1;

  const returnToSingleLocationHours = () => {
    if (!hasSingleLocation) return;
    const location = locations[0];
    setSelectedLocation(location);
    setShowTimingForm(true);
    setShowLeaveForm(false);
    setShowLeaveList(false);
  };

  const timingContent = (
    <>
        {locations.length === 0 && !showTimingForm && !showLeaveForm && !showLeaveList && (
          <div className={cn(org.card, "rounded-2xl border-stone-200 bg-white p-8 text-center shadow-none")}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Home className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-appointza-navy">No locations yet</h3>
            <p className="mt-1 text-sm text-stone-500">
              Add a business location in Settings before setting hours.
            </p>
          </div>
        )}

        {!showTimingForm && !showLeaveForm && !showLeaveList && locations.length > 1 && (
          <div className={cn(settingsEmbedded.list, embedded && "w-full")}>
            {inOnboarding && (
              <p className="text-sm font-medium text-blue-600">
                Tap <span className="font-semibold">Set hours</span> on your location to continue setup.
              </p>
            )}
            {embedded ? (
              <div className={settingsEmbedded.listGroup}>
                {locations.map((location) => (
                  <div key={location.id} className={settingsEmbedded.listRow}>
                    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Home className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-appointza-navy sm:text-lg">
                          {location.name}
                        </h3>
                        {location.address ? (
                          <p className="truncate text-xs text-stone-500 sm:text-sm">{location.address}</p>
                        ) : (
                          <p className="text-xs text-stone-400 sm:text-sm">Business location</p>
                        )}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:shrink-0">
                      <Button
                        type="button"
                        onClick={() => handleLocationSelectForTiming(location)}
                        className={cn(
                          inOnboarding ? org.btnPrimary : org.btnOutline,
                          "min-h-10 w-full touch-manipulation sm:w-auto",
                        )}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {inOnboarding ? "Set hours" : "Edit hours"}
                      </Button>
                      {!inOnboarding && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleLocationSelectForLeave(location)}
                          className={cn(org.btnOutline, "min-h-10 w-full sm:w-auto")}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Book leave
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className={cn("grid w-full gap-3")}>
              {locations.map((location) => (
                  <div
                    key={location.id}
                    className={cn(
                      org.card,
                      "w-full rounded-xl border-stone-200 bg-white p-4 shadow-none sm:p-5",
                      inOnboarding && "ring-1 ring-[#FFD4CC]/60",
                    )}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Home className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-appointza-navy sm:text-lg">
                            {location.name}
                          </h3>
                          {location.address ? (
                            <p className="truncate text-xs text-stone-500 sm:text-sm">{location.address}</p>
                          ) : (
                            <p className="text-xs text-stone-400 sm:text-sm">Business location</p>
                          )}
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:shrink-0">
                        <Button
                          type="button"
                          onClick={() => handleLocationSelectForTiming(location)}
                          className={cn(
                            inOnboarding ? org.btnPrimary : org.btnOutline,
                            "min-h-10 w-full touch-manipulation sm:w-auto",
                          )}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {inOnboarding ? "Set hours" : "Edit hours"}
                        </Button>
                        {!inOnboarding && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleLocationSelectForLeave(location)}
                            className={cn(org.btnOutline, "min-h-10 w-full sm:w-auto")}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Book leave
                          </Button>
                        )}
                      </div>
                    </div>
                    </div>
                ))}
            </div>
            )}
          </div>
        )}

        {/* Timing Form — simple week schedule */}
        {showTimingForm && selectedLocation && (
          <div className="w-full overflow-hidden rounded-xl border border-[#e6eaf0] bg-white shadow-none">
            <div className="flex flex-col gap-3 border-b border-[#e6eaf0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa3b2]">
                  Weekly hours
                </p>
                <h3 className="truncate text-[16px] font-semibold text-[#1a1a1a]">
                  When are you open?
                </h3>
                <p className="mt-0.5 text-[13px] text-[#667085]">
                  Turn a day on, set open → close, then save.
                  {selectedLocation.name ? (
                    <>
                      {" "}
                      Place: <span className="font-medium text-[#344054]">{selectedLocation.name}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!inOnboarding ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleLocationSelectForLeave(selectedLocation)}
                    className={cn(org.btnOutline, "h-8")}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Day off
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyMondayToAllDays}
                  disabled={isSavingTimings}
                  className={cn(org.btnOutline, "h-8")}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Mon to all
                </Button>
                {!hasSingleLocation ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowTimingForm(false);
                      setSelectedLocation(null);
                    }}
                    className="h-8 w-8 text-[#7a8494] hover:bg-[#f4f6f9] hover:text-[#1a1a1a]"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>

            {isFetchingTimings ? (
              <div className="flex items-center justify-center gap-2 px-4 py-12 text-[13px] text-[#667085]">
                <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
                Loading hours…
              </div>
            ) : (
              <div className="divide-y divide-[#eef1f5]">
                {daysOfWeek.map((day) => {
                  const slots = dayTimeSlots[day.id] ?? [];
                  const isOpen = slots.length > 0;
                  return (
                    <div
                      key={day.id}
                      className={cn(
                        "flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4 sm:px-5",
                        !isOpen && "bg-[#fafbfc]",
                      )}
                    >
                      <div className="flex min-w-[8.5rem] items-center justify-between gap-3 sm:pt-1.5">
                        <div>
                          <p className="text-[14px] font-semibold text-[#1a1a1a]">{day.label}</p>
                          <p
                            className={cn(
                              "text-[12px] font-medium",
                              isOpen ? "text-[#2a5af5]" : "text-[#98a2b3]",
                            )}
                          >
                            {isOpen ? "Open" : "Closed"}
                          </p>
                        </div>
                        <Switch
                          checked={isOpen}
                          onCheckedChange={(checked) => setDayOpen(day.id, checked)}
                          aria-label={`${day.label} ${isOpen ? "open" : "closed"}`}
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        {!isOpen ? (
                          <p className="rounded-md border border-dashed border-[#e6eaf0] bg-white px-3 py-2.5 text-[13px] text-[#98a2b3] sm:mt-0.5">
                            Closed all day — flip the switch to set times
                          </p>
                        ) : (
                          <>
                            {slots.map((slot) => (
                              <div
                                key={slot.localid}
                                className="flex flex-col gap-2 rounded-md border border-[#e6eaf0] bg-white p-2 sm:flex-row sm:items-center sm:gap-2"
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <Label className="sr-only">Opens</Label>
                                  <Input
                                    type="time"
                                    value={formatSlotClock(slot.start_time)}
                                    onChange={(e) =>
                                      updateTimeSlot(
                                        day.id,
                                        slot.localid,
                                        "start_time",
                                        parseClockToDate(e.target.value),
                                      )
                                    }
                                    className={cn(org.input, "h-9 flex-1 tabular-nums")}
                                  />
                                  <span className="shrink-0 text-[12px] font-medium text-[#98a2b3]">
                                    to
                                  </span>
                                  <Label className="sr-only">Closes</Label>
                                  <Input
                                    type="time"
                                    value={formatSlotClock(slot.end_time)}
                                    onChange={(e) =>
                                      updateTimeSlot(
                                        day.id,
                                        slot.localid,
                                        "end_time",
                                        parseClockToDate(e.target.value),
                                      )
                                    }
                                    className={cn(org.input, "h-9 flex-1 tabular-nums")}
                                  />
                                </div>
                                {slots.length > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => removeTimeSlot(day.id, slot.localid)}
                                    className="inline-flex h-9 w-full items-center justify-center rounded-md border border-[#e6eaf0] text-[#667085] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:w-9"
                                    aria-label="Remove hours"
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                  </button>
                                ) : null}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addTimeSlot(day.id)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-[#2a5af5] transition-colors hover:bg-[#eef4ff]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add another time
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={cn(org.saveBar, "flex-wrap gap-2")}>
              {!hasSingleLocation ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowTimingForm(false);
                    setSelectedLocation(null);
                  }}
                  className={cn(org.btnOutline, "h-9")}
                >
                  Back
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={saveTimingData}
                disabled={isSavingTimings || isFetchingTimings}
                className={org.saveBtn}
              >
                {isSavingTimings ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Leave Form Card */}
        {showLeaveForm && selectedLocation && (
          <Card className={cn(org.card, "w-full overflow-hidden rounded-2xl border-stone-200 bg-white shadow-none")}>
            <CardHeader className="space-y-1 border-b border-stone-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 sm:items-center">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg font-semibold text-appointza-navy sm:text-xl">
                    {editingLeave ? "Edit leave" : "Book leave"}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm text-stone-500">
                    {editingLeave ? "Update leave details" : "Block time off for this location."}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowLeaveForm(false);
                    setEditingLeave(null);
                    setLeaveRequest(new Leavereq());
                    setSelectedLeaveDate(null);
                    setStartTime('');
                    setEndTime('');
                    returnToSingleLocationHours();
                  }}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leave-date" className={org.label}>Leave date</Label>
                <Input
                  type="date"
                  id="leave-date"
                  value={selectedLeaveDate ? selectedLeaveDate.toISOString().split('T')[0] : ''}
                  onChange={async (e) => {
                    const date = new Date(e.target.value);
                    setSelectedLeaveDate(date);
                    setLeaveRequest(prev => ({ ...prev, appointmentdate: date }));
                    
                    // Re-validate when date changes - check if this date has a leave
                    if (selectedLocation) {
                      // Refresh leave list to ensure we have latest data
                      const req = {
                        organisationid: organizationId,
                        organisationlocationid: selectedLocation.id
                      };
                      const leaves = await timingService.getLeaveRequests(req);
                      const updatedLeaveList = leaves || [];
                      
                      const dateString = date.toISOString().split('T')[0];
                      const existingLeave = updatedLeaveList.find((leave: any) => {
                        const leaveDate = new Date(leave.appointmentdate).toISOString().split('T')[0];
                        return leaveDate === dateString;
                      });
                      
                      if (existingLeave) {
                        // If there's an existing leave, clear time slots and show message
                        if (existingLeave.isfullday) {
                          setStartTime('');
                          setEndTime('');
                          setLeaveRequest(prev => ({ ...prev, isfullday: true }));
                          toast({
                            title: "Full Day Leave Exists",
                            description: "This date already has a full day leave. Please select a different date.",
                            variant: "destructive"
                          });
                        } else {
                          // Half day leave - set the times but show warning
                          setStartTime(existingLeave.start_time || '');
                          setEndTime(existingLeave.end_time || '');
                          setLeaveRequest(prev => ({ ...prev, isfullday: false }));
                          toast({
                            title: "Half Day Leave Exists",
                            description: `This date already has a leave from ${existingLeave.start_time?.slice(0, 5)} to ${existingLeave.end_time?.slice(0, 5)}.`,
                            variant: "default"
                          });
                        }
                      } else {
                        // No existing leave - reset times if switching from a date with leave
                        setStartTime('');
                        setEndTime('');
                        setLeaveRequest(prev => ({ ...prev, isfullday: false }));
                      }
                      
                      // Update leave list state
                      setLeaveList(updatedLeaveList);
                    }
                  }}
                  className={cn(org.input, "h-11 w-full")}
                />
              </div>

              <div className="space-y-2">
                <Label className={org.label}>Leave type</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="half-day"
                      checked={!leaveRequest.isfullday}
                      onCheckedChange={(checked) => 
                        setLeaveRequest(prev => ({ ...prev, isfullday: !checked }))
                      }
                    />
                    <Label htmlFor="half-day" className="text-sm sm:text-base cursor-pointer">Half Day</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="full-day"
                      checked={leaveRequest.isfullday}
                      onCheckedChange={(checked) => 
                        setLeaveRequest(prev => ({ ...prev, isfullday: !!checked }))
                      }
                    />
                    <Label htmlFor="full-day" className="text-sm sm:text-base cursor-pointer">Full Day</Label>
                  </div>
                </div>
              </div>

               {!leaveRequest.isfullday && (
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                   <div className="space-y-2">
                     <Label className={org.label}>Start time</Label>
                     <div className="flex items-center gap-2">
                       <Clock className="h-4 w-4 shrink-0 text-blue-600" />
                       <Input
                         type="time"
                         value={startTime}
                         onChange={(e) => {
                           setStartTime(e.target.value + ':00');
                         }}
                         className={cn(org.input, "h-11 flex-1")}
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label className={org.label}>End time</Label>
                     <div className="flex items-center gap-2">
                       <Clock className="h-4 w-4 shrink-0 text-blue-600" />
                       <Input
                         type="time"
                         value={endTime}
                         onChange={(e) => {
                           setEndTime(e.target.value + ':00');
                         }}
                         className={cn(org.input, "h-11 flex-1")}
                       />
                     </div>
                   </div>
                 </div>
               )}

              <div className="space-y-2">
                <Label className={org.label}>Location</Label>
                <Input
                  value={selectedLocation?.name || 'Not selected'}
                  disabled
                  className={cn(org.input, "h-11 mt-0 bg-stone-50")}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-stone-200 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLeaveForm(false);
                  setEditingLeave(null);
                  setLeaveRequest(new Leavereq());
                  setSelectedLeaveDate(null);
                  setStartTime('');
                  setEndTime('');
                  returnToSingleLocationHours();
                }}
                className={cn(org.btnOutline, "min-h-11 w-full sm:w-auto")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleLeaveSubmit}
                className={cn(org.btnPrimary, "min-h-11 w-full sm:w-auto")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {editingLeave ? "Update leave" : "Book leave"}
              </Button>
            </div>
            </CardContent>
          </Card>
        )}

        {showLeaveList && selectedLocation && (
          <Card className={cn(org.card, "w-full overflow-hidden rounded-2xl border-stone-200 bg-white shadow-none")}>
            <CardHeader className="space-y-1 border-b border-stone-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 sm:items-center">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg font-semibold text-appointza-navy sm:text-xl">
                    Leave management
                  </CardTitle>
                  <CardDescription className="mt-1 truncate text-sm text-stone-500">
                    Scheduled time off for {selectedLocation.name}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowLeaveList(false);
                    returnToSingleLocationHours();
                  }}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-5 sm:p-6">

            <div className="space-y-4">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <h3 className="text-base font-semibold text-appointza-navy sm:text-lg">Current leaves</h3>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingLeave(null);
                    setLeaveRequest(prev => ({
                      ...prev,
                      organisationid: selectedLocation?.organisationid || 0,
                      organisationlocationid: selectedLocation?.id || 0
                    }));
                    setShowLeaveForm(true);
                    setShowLeaveList(false);
                  }}
                  className={cn(org.btnPrimary, "min-h-10 w-full sm:w-auto")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add leave
                </Button>
              </div>

              {isLeaveBusy ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : leaveList.length === 0 ? (
                <div className={cn(org.empty, "py-10")}>
                  No leaves scheduled yet
                </div>
              ) : (
                <div className="space-y-2">
                  {leaveList.map((leave, index) => (
                    <div
                      key={leave.leaveid || index}
                      className={cn(org.panel, "rounded-xl border-stone-200 bg-white p-4 shadow-none")}
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-appointza-navy">
                                  {new Date(leave.appointmentdate).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-stone-500">
                                  {leave.isfullday ? 'Full day' : `${leave.start_time} – ${leave.end_time}`}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {leave.isforce && (
                                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                                    Force leave
                                  </span>
                                )}
                                {leave.isfullday && (
                                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                    Full day
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditLeave(leave)}
                              className={cn(org.btnOutline, "min-h-9 w-full sm:w-auto")}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelLeave(leave)}
                              className={cn(org.btnOutline, "min-h-9 w-full border-red-100 text-red-600 hover:bg-red-50 sm:w-auto")}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-stone-200 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLeaveList(false);
                  returnToSingleLocationHours();
                }}
                className={cn(org.btnOutline, "min-h-11 w-full sm:w-auto")}
              >
                Close
              </Button>
            </div>
            </CardContent>
          </Card>
        )}

    </>
  );

  if (embedded) {
    return (
      <OrganizationPageShell embedded>
        <SettingsEmbeddedHeader
          icon={Clock}
          title="Business Hours"
          description="Say which days you are open, and from what time to what time."
        />
        <div className={settingsEmbedded.sectionBody}>{timingContent}</div>
      </OrganizationPageShell>
    );
  }

  return (
    <div className="org-page">
      {inOnboarding && (
        <div className="org-page-section pb-0 pt-4 sm:pt-6">
          <OnboardingPageGuide
            compact
            stepId="timing"
            hasCustomDomain={hasCustomDomain}
            hasServices={hasServices}
            hasWebsite={hasWebsite}
            hasTiming={hasTiming}
          />
        </div>
      )}
      <div className="org-panel-section space-y-5 pt-4">{timingContent}</div>
    </div>
  );
};

export default TimingScreen;
