
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Phone,
  Calendar,
  UserPlus,
  CalendarPlus,
  CalendarX,
  Loader2,
  ArrowLeft,
  BedDouble,
  FileText,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import ClientServiceHistory from "@/components/organization/ClientServiceHistory";
import TodayAppointmentCard from "@/components/organization/TodayAppointmentCard";
import EnhancedTimeline from "@/components/organization/EnhancedTimeline";
import { useMountWhenOpened } from "@/hooks/useMountWhenOpened";
import CreateClientDialog from "@/components/organization/CreateClientDialog";
import OnSpotRegistrationDialog from "@/components/organization/OnSpotRegistrationDialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { AppoinmentService } from "@/services/appoinment.service";
import { AppointmentRecordService } from "@/services/appointmentrecord.service";
import { EventBookingService } from "@/services/eventbooking.service";
import { EventService } from "@/services/event.service";
import { ReferenceTypeService } from "@/services/referencetype.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ClientInfoRes, SearchAppointmentByMobileReq, BookedAppoinmentRes, AppoinmentSelectReq } from "@/models/appoinment.model";
import { AppointmentRecord, AppointmentRecordSelectReq } from "@/models/appointmentrecord.model";
import { EventBooking, EventBookingSelectReq } from "@/models/eventbooking.model";
import { Event, EventSelectReq } from "@/models/event.model";
import { ReferenceTypeSelectReq } from "@/models/referencetype.model";
import { ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { HospitalityService } from "@/services/hospitality.service";
import type { OrganisationRoom } from "@/models/hospitality.model";
import RoomBookingDetailsDialog from "@/components/organization/RoomBookingDetailsDialog";
import {
  getRoomBookingEndDate,
  getRoomBookingStartDate,
  roomBookingLabel,
  roomBookingReference,
  roomHasActiveBooking,
  roomPaymentSummary,
  roomStatusDisplay,
} from "@/utils/roomBooking.util";
import { statusClassName } from "@/models/hospitality.model";
import { decodeEventBookingNotes, encodeEventBookingNotes } from "@/utils/eventBookingNotes.util";
import { formatEventDateLong } from "@/utils/eventDate.util";
import {
  type EventBookingFormField,
  parseEventBookingFormFieldsFromNotes,
  sortEventBookingFormFieldsByDisplayOrder,
} from "@/utils/eventBookingFormFields.util";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { useIsMobile } from "@/hooks/use-mobile";
import { loyaltyService } from "@/services/loyalty.service";
import { resolveOrganisationId } from "@/utils/organisationContext.util";
import { ClientLoyaltyWallet } from "@/models/loyalty.model";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function loyaltyRewardLabel(type: string, value: number, maxDiscount = 0) {
  switch (type) {
    case "percentage_discount":
      return maxDiscount > 0 ? `${value}% off (max ₹${maxDiscount})` : `${value}% discount`;
    case "fixed_discount":
      return `₹${value} off`;
    case "loyalty_points":
      return `${value} points`;
    case "free_service":
      return "1 free service";
    case "cashback":
      return `₹${value} cashback`;
    case "coupon":
      return "Coupon";
    default:
      return type.replace(/_/g, " ");
  }
}

function clientInitials(name: string | undefined): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

const ClientManagement = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user } = useAuth();
  const { id: globalLocationId } = useGlobalId();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [loyaltyByUserId, setLoyaltyByUserId] = useState<Record<number, ClientLoyaltyWallet>>({});
  const [selectedLoyaltyWallet, setSelectedLoyaltyWallet] = useState<ClientLoyaltyWallet | null>(null);
  const [isLoadingLoyaltyDetails, setIsLoadingLoyaltyDetails] = useState(false);
  const [loadingLoyaltyUserId, setLoadingLoyaltyUserId] = useState<number | null>(null);
  const [clientAppointments, setClientAppointments] = useState<BookedAppoinmentRes[]>([]);
  const [appointmentRecords, setAppointmentRecords] = useState<AppointmentRecord[]>([]);
  const [clientEventBookings, setClientEventBookings] = useState<EventBooking[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<number, Event>>({});
  const [isLoadingClientData, setIsLoadingClientData] = useState(false);
  const [todayAppointment, setTodayAppointment] = useState<BookedAppoinmentRes | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isOnSpotDialogOpen, setIsOnSpotDialogOpen] = useState(false);
  const [mobileInput, setMobileInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  type CrmTabId = "today" | "history" | "timeline" | "events" | "rooms";
  const [crmTab, setCrmTab] = useState<CrmTabId>("today");
  const [clientRoomStays, setClientRoomStays] = useState<OrganisationRoom[]>([]);
  const [roomDetailsTarget, setRoomDetailsTarget] = useState<OrganisationRoom | null>(null);
  const [isRoomDetailsOpen, setIsRoomDetailsOpen] = useState(false);
  const [addRecordRequest, setAddRecordRequest] = useState(0);
  const mountCreateClientDialog = useMountWhenOpened(isCreateDialogOpen);
  const mountOnSpotDialog = useMountWhenOpened(isOnSpotDialogOpen);
  const mountRoomDetailsDialog = useMountWhenOpened(isRoomDetailsOpen);

  const appointmentService = useMemo(() => new AppoinmentService(), []);
  const appointmentRecordService = useMemo(() => new AppointmentRecordService(), []);
  const eventBookingService = useMemo(() => new EventBookingService(), []);
  const eventService = useMemo(() => new EventService(), []);
  const referenceTypeService = useMemo(() => new ReferenceTypeService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const hospitalityService = useMemo(() => new HospitalityService(), []);

  const mergeWalletIntoLoyaltyMap = useCallback((wallet: ClientLoyaltyWallet) => {
    if (wallet.client_user_id <= 0) return;
    setLoyaltyByUserId((prev) => ({ ...prev, [wallet.client_user_id]: wallet }));
  }, []);

  const loadLoyaltyForClient = useCallback(
    async (clientUserId: number, clientName?: string, clientMobile?: string) => {
      if (clientUserId <= 0) return null;
      const organisationId = resolveOrganisationId(user?.organisationid);
      if (organisationId <= 0) return null;

      setLoadingLoyaltyUserId(clientUserId);
      try {
        const wallets = await loyaltyService.selectCustomerWallets(organisationId, "", 0, clientUserId);
        const wallet = wallets?.[0];
        if (wallet) {
          mergeWalletIntoLoyaltyMap({
            ...wallet,
            client_name: wallet.client_name || clientName,
            client_mobile: wallet.client_mobile || clientMobile,
          });
          return wallet;
        }
        return null;
      } catch (loyaltyError) {
        console.error("Error loading loyalty for client", loyaltyError);
        return null;
      } finally {
        setLoadingLoyaltyUserId((current) => (current === clientUserId ? null : current));
      }
    },
    [mergeWalletIntoLoyaltyMap, user?.organisationid],
  );

  const openLoyaltyDetails = useCallback(
    async (clientUserId: number, clientName?: string, clientMobile?: string) => {
      if (clientUserId <= 0) return;
      const organisationId = resolveOrganisationId(user?.organisationid);
      if (organisationId <= 0) return;

      const cached = loyaltyByUserId[clientUserId];
      setSelectedLoyaltyWallet(
        cached ?
          { ...cached, client_name: cached.client_name || clientName, client_mobile: cached.client_mobile || clientMobile }
        : {
            client_user_id: clientUserId,
            client_name: clientName,
            client_mobile: clientMobile,
          } as ClientLoyaltyWallet,
      );
      setIsLoadingLoyaltyDetails(true);
      try {
        const [transactions, rewards] = await Promise.all([
          loyaltyService.selectTransactions(organisationId, clientUserId),
          loyaltyService.selectRewardGrants(organisationId, clientUserId),
        ]);
        setSelectedLoyaltyWallet((prev) =>
          prev ?
            {
              ...prev,
              ...cached,
              client_name: prev.client_name || clientName,
              client_mobile: prev.client_mobile || clientMobile,
              recent_transactions: transactions,
              available_rewards: rewards.filter((r) => r.status === "available"),
            }
          : null,
        );
      } catch (error) {
        console.error("Error loading loyalty wallet details", error);
        toast({
          title: "Could not load loyalty details",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingLoyaltyDetails(false);
      }
    },
    [loyaltyByUserId, toast, user?.organisationid],
  );

  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [eventDetailsBooking, setEventDetailsBooking] = useState<EventBooking | null>(null);
  const [eventDetailsFields, setEventDetailsFields] = useState<EventBookingFormField[]>([]);
  const [eventDetailsValues, setEventDetailsValues] = useState<Record<string, any>>({});
  const [isSavingEventDetails, setIsSavingEventDetails] = useState(false);

  // Only fetch loyalty details when the user opens that client's wallet.
  // Avoid preloading every wallet in a large organization because it creates
  // redundant backend work and expensive client-list render churn.

  const loadEventBookingFormFields = useCallback(
    async (evt: Event | undefined | null): Promise<EventBookingFormField[]> => {
      if (!evt?.id || !evt.organisation_id) return [];
      try {
        const typeReq = new ReferenceTypeSelectReq();
        typeReq.identifier = "EVENTBOOKINGFORM";
        const types = (await referenceTypeService.select(typeReq)) || [];
        const type =
          types.find((t) => Number(t.organizationid) === Number(evt.organisation_id)) ?? types[0];
        if (!type?.id) return [];

        const valueReq = new ReferenceValueSelectReq();
        valueReq.referencetypeid = Number(type.id);
        valueReq.organisationid = Number(evt.organisation_id);
        valueReq.identifier = `EVENT_${evt.id}`;
        const values = (await referenceValueService.select(valueReq)) || [];
        const notes = values?.[0]?.notes || "";
        const fields = parseEventBookingFormFieldsFromNotes(notes);
        return sortEventBookingFormFieldsByDisplayOrder(fields);
      } catch (e) {
        console.error("Error loading event booking form fields:", e);
        return [];
      }
    },
    [referenceTypeService, referenceValueService],
  );

  const openEventDetailsEditor = useCallback(
    async (booking: EventBooking) => {
      const evt = eventsMap[booking.event_id];
      const fields = await loadEventBookingFormFields(evt);
      const decoded = decodeEventBookingNotes(booking.notes);
      const existingForm =
        decoded.payload?.form && typeof decoded.payload.form === "object" ? decoded.payload.form : {};
      setEventDetailsBooking(booking);
      setEventDetailsFields(fields);
      setEventDetailsValues(existingForm);
      setIsEventDetailsOpen(true);
    },
    [eventsMap, loadEventBookingFormFields],
  );

  const saveEventDetails = useCallback(async () => {
    if (!eventDetailsBooking) return;
    setIsSavingEventDetails(true);
    try {
      const decoded = decodeEventBookingNotes(eventDetailsBooking.notes);
      const attendees =
        decoded.payload?.attendees && Array.isArray(decoded.payload.attendees)
          ? decoded.payload.attendees
          : decoded.attendeesText
              ? decoded.attendeesText.split(",").map((s) => s.trim()).filter(Boolean)
              : [];

      const updated = { ...eventDetailsBooking };
      updated.notes = encodeEventBookingNotes(attendees, eventDetailsValues);

      const saved = await eventBookingService.update(updated);
      // update local list
      setClientEventBookings((prev) =>
        prev.map((b) => (b.id === saved.id ? saved : b)),
      );

      toast({
        title: "Saved",
        description: "Event booking details updated.",
      });
      setIsEventDetailsOpen(false);
      setEventDetailsBooking(null);
      setEventDetailsFields([]);
      setEventDetailsValues({});
    } catch (e) {
      console.error("Error saving event details:", e);
      toast({ title: "Error", description: "Failed to save details.", variant: "destructive" });
    } finally {
      setIsSavingEventDetails(false);
    }
  }, [eventBookingService, eventDetailsBooking, eventDetailsValues, toast]);

  const loadRoomStaysForClient = useCallback(
    async (client: ClientInfoRes): Promise<OrganisationRoom[]> => {
      if (!client.is_room_customer) return [];
      const organisationlocationid = globalLocationId
        ? Number(globalLocationId)
        : (user?.locationid || 0);

      const rooms =
        (await hospitalityService.selectRooms({
          id: 0,
          organisation_id: user?.organisationid || 0,
          organisation_location_id: organisationlocationid,
          status: "",
        })) || [];

      const phoneDigits = (client.mobile || "").replace(/\D/g, "");
      return rooms.filter((room) => {
        if (!roomHasActiveBooking(room)) return false;
        if (client.room_id && room.id === client.room_id) return true;
        const guestPhone = (room.guest?.phone || "").replace(/\D/g, "");
        if (phoneDigits.length >= 6 && guestPhone.length >= 6 && guestPhone === phoneDigits) return true;
        return false;
      });
    },
    [globalLocationId, hospitalityService, user?.locationid, user?.organisationid],
  );

  const loadClientData = async (userId: number, organizationId: number) => {
    setIsLoadingClientData(true);
    try {
      // Load appointments by userid
      const appointmentReq = new AppoinmentSelectReq();
      appointmentReq.userid = userId;
      appointmentReq.organisationid = organizationId;
      const appointments = await appointmentService.SelectBookedAppoinment(appointmentReq);
      
      // Load appointment records by userid
      const recordReq = new AppointmentRecordSelectReq();
      recordReq.userid = userId;
      recordReq.organisationid = organizationId;
      const records = await appointmentRecordService.select(recordReq);

      // Load event bookings ONLY for events belonging to this organization
      const organisationlocationid = globalLocationId
        ? Number(globalLocationId)
        : (user?.locationid || 0);

      const orgEventsReq: EventSelectReq = {
        id: 0,
        organisation_id: organizationId,
        organisation_location_id: organisationlocationid,
        status: "",
        is_public: false,
        include_past: true,
      };
      const orgEvents = (await eventService.select(orgEventsReq)) || [];

      const nextEventsMap: Record<number, Event> = {};
      orgEvents.forEach((e) => {
        nextEventsMap[e.id] = e;
      });
      setEventsMap(nextEventsMap);

      const bookingReq: EventBookingSelectReq = {
        id: 0,
        event_id: 0,
        user_id: userId,
        organisation_id: organizationId,
        organisation_location_id: organisationlocationid,
        payment_status: "",
        check_in_status: "",
        confirmation_status: "",
      };
      const normalizedEventBookings = (await eventBookingService.select(bookingReq)) || [];
      setClientEventBookings(normalizedEventBookings);

      setClientAppointments(appointments || []);
      setAppointmentRecords(records || []);

      // Calculate stats
      const allAppointments = appointments || [];
      const totalAppointments = allAppointments.length;
      
      // Calculate total spent based on selected services' prices
      const totalSpent = allAppointments.reduce((sum, appt) => {
        const services = appt?.attributes?.servicelist || [];
        const servicesTotal = Array.isArray(services)
          ? services.reduce((s, svc) => s + (Number((svc as any)?.serviceprice) || 0), 0)
          : 0;
        return sum + servicesTotal;
      }, 0);
      
      // Get last visit date
      let lastVisit = new Date();
      if (allAppointments.length > 0) {
        const sortedDates = allAppointments
          .map(a => new Date(a.appoinmentdate))
          .sort((a, b) => b.getTime() - a.getTime());
        lastVisit = sortedDates[0];
      }

      // Find today's appointment
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAppt = allAppointments.find(apt => {
        const aptDate = new Date(apt.appoinmentdate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
      });
      setTodayAppointment(todayAppt || null);

      return { totalAppointments, lastVisit, totalSpent };
    } catch (error) {
      console.error('Error loading client data', error);
      setClientAppointments([]);
      setAppointmentRecords([]);
      setClientEventBookings([]);
      setEventsMap({});
      setTodayAppointment(null);
      return { totalAppointments: 0, lastVisit: new Date(), totalSpent: 0 };
    } finally {
      setIsLoadingClientData(false);
    }
  };

  const handleClientSearch = async (mobile: string) => {
    const digits = mobile.replace(/\D/g, "");
    if (!digits) {
      toast({
        title: "Mobile required",
        description: "Enter a mobile number to look up a customer.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const req = new SearchAppointmentByMobileReq();
      req.organisationid = user?.organisationid || 0;
      req.mobilenumber = digits;

      const results = await appointmentService.searchByMobile(req);

      if (results && results.length > 0) {
        const first = results[0] as BookedAppoinmentRes;
        const userId = first.userid;
        const displayMobile = first.mobile || digits;
        const displayName = first.username || "";

        setCrmTab("today");
        setSelectedClient({
          id: Number(userId),
          name: displayName,
          mobile: displayMobile,
          email: "",
          lastVisit: new Date(),
          totalAppointments: 0,
          totalSpent: 0,
        } as any);

        const roomLookup = {
          userid: userId,
          username: displayName,
          mobile: displayMobile,
          is_room_customer: true,
        } as ClientInfoRes;

        const loyaltyPromise = loadLoyaltyForClient(userId, displayName, displayMobile);
        const [stats, roomStays] = await Promise.all([
          loadClientData(userId, user?.organisationid || 0),
          loadRoomStaysForClient(roomLookup),
        ]);
        await loyaltyPromise;

        let nextStats = stats;
        if (stats.totalAppointments === 0 && roomStays.length > 0) {
          const checkInDates = roomStays
            .map((room) => getRoomBookingStartDate(room))
            .filter((date): date is Date => date instanceof Date);
          if (checkInDates.length > 0) {
            checkInDates.sort((a, b) => b.getTime() - a.getTime());
            nextStats = { ...stats, lastVisit: checkInDates[0] };
          }
        }

        setClientRoomStays(roomStays);
        setSelectedClient({
          id: Number(userId),
          name: displayName,
          mobile: displayMobile,
          email: "",
          lastVisit: nextStats.lastVisit,
          totalAppointments: nextStats.totalAppointments,
          totalSpent: nextStats.totalSpent,
          isRoomCustomer: roomStays.length > 0,
        } as any);

        if (roomStays.length > 0) {
          setCrmTab(nextStats.totalAppointments === 0 ? "rooms" : "today");
        }

        toast({
          title: "Customer found",
          description: `${displayName || digits} loaded with recent history.`,
        });
      } else {
        setSelectedClient(null);
        setClientAppointments([]);
        setAppointmentRecords([]);
        setClientEventBookings([]);
        setClientRoomStays([]);
        setEventsMap({});
        setTodayAppointment(null);
        toast({
          title: "Customer not found",
          description: "No customer found with this mobile number.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching client", error);
      toast({ title: "Error", description: "Search failed", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleClientCreated = () => {
    // No list to refresh — look up the new customer by mobile when needed.
  };

  const handleAddAppointmentRecord = () => {
    setCrmTab("timeline");
    setAddRecordRequest((count) => count + 1);
  };


  const pagePad = "px-4 sm:px-6";

  return (
    <div className={cn(org.page, "flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f8fafc]")}>
      <header className={cn("shrink-0 border-b border-[#e6eaf0] bg-white py-3", pagePad)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-[15px] font-semibold tracking-tight text-[#1a1a1a]">
                  Find customer
                </h1>
                <p className="mt-0.5 text-[12px] text-[#5b6572]">
                  Mobile number · press Enter
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsOnSpotDialogOpen(true)}
                className={cn(org.btnPrimary, "h-8 shrink-0 sm:hidden")}
              >
                <UserPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <form
              className="relative max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                void handleClientSearch(mobileInput);
              }}
            >
              <Phone
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9aa3af]"
                aria-hidden
              />
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={mobileInput}
                onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Mobile number"
                disabled={isSearching}
                className={cn(
                  org.input,
                  "h-9 rounded-md border-[#e6eaf0] pl-9 pr-11 text-[13px] tabular-nums shadow-none placeholder:text-[#9aa3af] focus-visible:border-[#2a5af5] focus-visible:ring-[#2a5af5]/15",
                )}
                aria-label="Customer mobile number"
              />
              {isSearching ? (
                <Loader2
                  className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-[#2a5af5]"
                  aria-hidden
                />
              ) : (
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-[#e6eaf0] bg-[#f8fafc] px-1.5 py-0.5 text-[10px] font-medium text-[#9aa3af] sm:inline">
                  Enter
                </kbd>
              )}
            </form>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsOnSpotDialogOpen(true)}
            className={cn(org.btnPrimary, "hidden h-9 shrink-0 sm:inline-flex")}
          >
            <UserPlus className="h-3.5 w-3.5 shrink-0" />
            On-Spot
          </Button>
        </div>
      </header>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[#f8fafc]">
        {selectedClient ? (
          <>
            <div className={cn("border-b border-[#e6eaf0] bg-white py-3", pagePad)}>
              {isMobile ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-ml-2 mb-2 h-8 gap-1.5 px-2 text-[#5b6572] hover:text-[#1a1a1a]"
                  onClick={() => {
                    setSelectedClient(null);
                    setMobileInput("");
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  New search
                </Button>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#e6eaf0] bg-[#eef2ff] text-sm font-semibold text-[#2a5af5]">
                    {clientInitials(selectedClient.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-[15px] font-semibold tracking-tight text-[#1a1a1a]">
                        {selectedClient.name}
                      </h2>
                      {selectedClient.isRoomCustomer ? (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                          Room guest
                        </Badge>
                      ) : null}
                      {selectedClient.bookingReference ? (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          Ref {selectedClient.bookingReference}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-[#5b6572]">
                      <Phone className="h-3 w-3 text-[#2a5af5]" aria-hidden />
                      <span className="tabular-nums">{selectedClient.mobile}</span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!selectedClient.isRoomOnly ? (
                    <Button
                      type="button"
                      onClick={() =>
                        navigate(`/organization/clients/${selectedClient.id}/book`, {
                          state: { name: selectedClient.name, mobile: selectedClient.mobile },
                        })
                      }
                      className={cn(org.btnPrimary, "h-8")}
                    >
                      <CalendarPlus className="h-3.5 w-3.5 shrink-0" />
                      Book
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAppointmentRecord}
                    className={cn(org.btnOutline, "h-8")}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    Add record
                  </Button>
                </div>
              </div>

              <div
                className={cn(
                  "mt-3 grid gap-2",
                  selectedClient.isRoomCustomer ? "grid-cols-3" : "grid-cols-2",
                  "sm:max-w-xl",
                )}
              >
                <div className="rounded-md border border-[#e6eaf0] bg-[#f8fafc] px-3 py-2">
                  <p className="text-[11px] font-medium text-[#5b6572]">
                    {selectedClient.isRoomCustomer ? "Service visits" : "Total visits"}
                  </p>
                  <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-[#1a1a1a]">
                    {selectedClient.totalAppointments}
                  </p>
                </div>
                <div className="rounded-md border border-[#e6eaf0] bg-[#f8fafc] px-3 py-2">
                  <p className="text-[11px] font-medium text-[#5b6572]">
                    {selectedClient.isRoomCustomer ? "Latest stay" : "Last visit"}
                  </p>
                  <p className="mt-0.5 text-[15px] font-semibold text-[#1a1a1a]">
                    {format(selectedClient.lastVisit, "MMM d, yyyy")}
                  </p>
                </div>
                {selectedClient.isRoomCustomer ? (
                  <div className="rounded-md border border-[#e6eaf0] bg-[#f8fafc] px-3 py-2">
                    <p className="text-[11px] font-medium text-[#5b6572]">Room stays</p>
                    <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-[#1a1a1a]">
                      {clientRoomStays.length}
                    </p>
                  </div>
                ) : null}
              </div>

              {!selectedClient.isRoomOnly && selectedClient.id > 0 ? (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/40 px-3 py-2.5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-amber-900">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      Loyalty
                      {loadingLoyaltyUserId === selectedClient.id ? (
                        <Loader2 className="h-3 w-3 animate-spin text-amber-700" aria-hidden />
                      ) : null}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 border-amber-300 bg-white px-2 text-[12px] hover:bg-amber-50"
                      disabled={loadingLoyaltyUserId === selectedClient.id}
                      onClick={() =>
                        void openLoyaltyDetails(
                          selectedClient.id,
                          selectedClient.name,
                          selectedClient.mobile,
                        )
                      }
                    >
                      Details
                    </Button>
                  </div>
                  {loadingLoyaltyUserId === selectedClient.id &&
                  !loyaltyByUserId[selectedClient.id] ? (
                    <div className="flex items-center gap-2 py-2 text-[12px] text-stone-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading…
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:max-w-2xl">
                      <div className="rounded-md border border-amber-200/80 bg-white px-2.5 py-2">
                        <p className="text-[11px] font-medium text-stone-500">Points</p>
                        <p className="mt-0.5 text-[14px] font-semibold tabular-nums text-[#1a1a1a]">
                          {(loyaltyByUserId[selectedClient.id]?.current_points ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-md border border-amber-200/80 bg-white px-2.5 py-2">
                        <p className="text-[11px] font-medium text-stone-500">Services</p>
                        <p className="mt-0.5 text-[14px] font-semibold tabular-nums text-[#1a1a1a]">
                          {loyaltyByUserId[selectedClient.id]?.completed_services_count ?? 0}
                        </p>
                      </div>
                      <div className="rounded-md border border-amber-200/80 bg-white px-2.5 py-2">
                        <p className="text-[11px] font-medium text-stone-500">Tier</p>
                        <p className="mt-0.5 truncate text-[14px] font-semibold text-[#1a1a1a]">
                          {loyaltyByUserId[selectedClient.id]?.current_tier_name || "—"}
                        </p>
                      </div>
                      <div className="rounded-md border border-amber-200/80 bg-white px-2.5 py-2">
                        <p className="text-[11px] font-medium text-stone-500">Spend</p>
                        <p className="mt-0.5 text-[14px] font-semibold tabular-nums text-[#1a1a1a]">
                          ₹{Number(loyaltyByUserId[selectedClient.id]?.total_spend ?? 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className={cn("border-b border-[#e6eaf0] bg-white", pagePad)}>
              <div className="-mx-1 flex overflow-x-auto">
                {(
                  [
                    { id: "today" as const, label: "Today" },
                    { id: "history" as const, label: "History" },
                    { id: "timeline" as const, label: "Timeline" },
                    { id: "events" as const, label: "Events" },
                    ...(selectedClient.isRoomCustomer
                      ? [{ id: "rooms" as const, label: "Room stays" }]
                      : []),
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCrmTab(tab.id)}
                    className={cn(
                      "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors sm:px-4",
                      crmTab === tab.id
                        ? "border-[#2a5af5] text-[#2a5af5]"
                        : "border-transparent text-[#5b6572] hover:text-[#1a1a1a]",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={cn("flex-1 py-3", pagePad)}>
              {(() => {
                const loadingEl = (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-[#e6eaf0] bg-white py-10 text-[13px] text-[#5b6572]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
                    Loading…
                  </div>
                );

                if (crmTab === "today") {
                  if (isLoadingClientData) return loadingEl;
                  if (todayAppointment) {
                    return (
                      <TodayAppointmentCard
                        appointment={{
                          id: Number(todayAppointment.id || 0),
                          clientName: selectedClient?.name || todayAppointment.username || "",
                          service:
                            Array.isArray((todayAppointment as any)?.attributes?.servicelist) &&
                            (todayAppointment as any).attributes.servicelist.length > 0
                              ? (todayAppointment as any).attributes.servicelist[0].servicename
                              : "Appointment",
                          time: String(todayAppointment.fromtime || ""),
                          duration:
                            Array.isArray((todayAppointment as any)?.attributes?.servicelist) &&
                            (todayAppointment as any).attributes.servicelist.length > 0
                              ? (todayAppointment as any).attributes.servicelist.reduce(
                                  (sum: number, svc: any) => sum + (Number(svc.servicetimetaken) || 0),
                                  0,
                                )
                              : 0,
                          status: todayAppointment.statuscode || "",
                          staff: todayAppointment.staffname || "",
                          price:
                            Array.isArray((todayAppointment as any)?.attributes?.servicelist) &&
                            (todayAppointment as any).attributes.servicelist.length > 0
                              ? (todayAppointment as any).attributes.servicelist.reduce(
                                  (sum: number, svc: any) => sum + (Number(svc.serviceprice) || 0),
                                  0,
                                )
                              : 0,
                        }}
                      />
                    );
                  }
                  return (
                    <div className="rounded-lg border border-[#e6eaf0] bg-white px-4 py-10 text-center">
                      <CalendarX className="mx-auto h-8 w-8 text-[#cfd6e0]" aria-hidden />
                      <p className="mt-3 text-[13px] font-medium text-[#1a1a1a]">No appointment today</p>
                      <p className="mt-1 text-[12px] text-[#5b6572]">
                        This customer has no booking scheduled for today.
                      </p>
                    </div>
                  );
                }

                if (crmTab === "history") {
                  if (isLoadingClientData) return loadingEl;
                  return <ClientServiceHistory appointments={clientAppointments} />;
                }

                if (crmTab === "timeline") {
                  if (isLoadingClientData) return loadingEl;
                  return (
                    <EnhancedTimeline
                      appointments={clientAppointments}
                      appointmentRecords={appointmentRecords}
                      userId={selectedClient?.id > 0 ? selectedClient.id : 0}
                      organizationId={user?.organisationid || 0}
                      clientMobile={selectedClient?.mobile || ""}
                      openAddRecordRequest={addRecordRequest}
                      onRequireClientRegistration={() => setIsOnSpotDialogOpen(true)}
                      onRecordAdded={async () => {
                        const clientId = selectedClient?.id;
                        if (clientId && clientId > 0) {
                          await loadClientData(clientId, user?.organisationid || 0);
                          return;
                        }
                        const mobile = (selectedClient?.mobile || "").trim();
                        if (!mobile) return;
                        try {
                          const req = new SearchAppointmentByMobileReq();
                          req.organisationid = user?.organisationid || 0;
                          req.mobilenumber = mobile;
                          const results = await appointmentService.searchByMobile(req);
                          if (results?.[0]?.userid) {
                            await loadClientData(Number(results[0].userid), user?.organisationid || 0);
                          }
                        } catch (error) {
                          console.error("Error refreshing client after record save", error);
                        }
                      }}
                    />
                  );
                }

                if (crmTab === "rooms") {
                  if (isLoadingClientData) return loadingEl;
                  if (clientRoomStays.length === 0) {
                    return (
                      <div className="rounded-lg border border-[#e6eaf0] bg-white px-4 py-10 text-center">
                        <BedDouble className="mx-auto h-8 w-8 text-[#cfd6e0]" aria-hidden />
                        <p className="mt-3 text-[13px] font-medium text-[#1a1a1a]">No room stays</p>
                        <p className="mt-1 text-[12px] text-[#5b6572]">
                          This guest has no active or recent room bookings.
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="overflow-hidden rounded-lg border border-[#e6eaf0] bg-white">
                      <div className="border-b border-[#e6eaf0] px-3 py-2.5 sm:px-4">
                        <p className="text-[13px] font-semibold text-[#1a1a1a]">Room stays</p>
                      </div>
                      <ul className="divide-y divide-[#e6eaf0]">
                        {clientRoomStays.map((room) => {
                          const checkIn = getRoomBookingStartDate(room);
                          const checkOut = getRoomBookingEndDate(room);
                          return (
                            <li
                              key={room.id}
                              className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-[#1a1a1a]">
                                  {roomBookingLabel(room)}
                                </p>
                                <p className="mt-0.5 text-[12px] text-[#5b6572]">
                                  {checkIn ? format(checkIn, "MMM d") : "—"}
                                  {" → "}
                                  {checkOut ? format(checkOut, "MMM d, yyyy") : "—"}
                                  <span className="text-[#cfd6e0]"> · </span>
                                  Ref {roomBookingReference(room)}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge className={cn(statusClassName(room.status), "h-5 text-[10px]")}>
                                  {roomStatusDisplay(room)}
                                </Badge>
                                <Badge variant="outline" className="h-5 text-[10px]">
                                  {roomPaymentSummary(room)}
                                </Badge>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className={cn(org.btnOutline, "h-7 px-2 text-[12px]")}
                                  onClick={() => {
                                    setRoomDetailsTarget(room);
                                    setIsRoomDetailsOpen(true);
                                  }}
                                >
                                  Details
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                }

                if (isLoadingClientData) return loadingEl;
                if (clientEventBookings.length === 0) {
                  return (
                    <div className="rounded-lg border border-[#e6eaf0] bg-white px-4 py-10 text-center">
                      <Calendar className="mx-auto h-8 w-8 text-[#cfd6e0]" aria-hidden />
                      <p className="mt-3 text-[13px] font-medium text-[#1a1a1a]">No event bookings</p>
                      <p className="mt-1 text-[12px] text-[#5b6572]">
                        This customer has not registered for any events yet.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-hidden rounded-lg border border-[#e6eaf0] bg-white">
                    <div className="border-b border-[#e6eaf0] px-3 py-2.5 sm:px-4">
                      <p className="text-[13px] font-semibold text-[#1a1a1a]">Events</p>
                      <p className="mt-0.5 text-[12px] text-[#5b6572]">
                        {clientEventBookings.length} booking
                        {clientEventBookings.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <ul className="divide-y divide-[#e6eaf0]">
                      {clientEventBookings.map((booking) => {
                        const event = eventsMap[booking.event_id];
                        const eventDate = event?.event_date
                          ? formatEventDateLong(event.event_date)
                          : "N/A";
                        const bookingDate = booking.created_at
                          ? format(new Date(booking.created_at), "MMM d, yyyy")
                          : "N/A";
                        const decoded = decodeEventBookingNotes(booking.notes);
                        const form =
                          decoded.payload?.form && typeof decoded.payload.form === "object"
                            ? decoded.payload.form
                            : null;
                        const hasFormValues =
                          !!form &&
                          Object.keys(form).some(
                            (k) =>
                              String((form as Record<string, unknown>)[k] ?? "").trim().length > 0,
                          );
                        return (
                          <li
                            key={booking.id}
                            className="flex flex-col gap-2.5 px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-4"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-[#1a1a1a]">
                                {event?.event_name || `Event #${booking.event_id}`}
                              </p>
                              <p className="mt-0.5 text-[12px] text-[#5b6572]">
                                {eventDate}
                                <span className="text-[#cfd6e0]"> · </span>
                                Booked {bookingDate}
                              </p>
                              {hasFormValues ? (
                                <div className="mt-1.5 grid gap-0.5 text-[12px] text-[#5b6572]">
                                  {Object.entries(form as Record<string, unknown>)
                                    .slice(0, 3)
                                    .map(([k, v]) => (
                                      <p key={k} className="truncate">
                                        <span className="font-medium text-[#1a1a1a]">{k}:</span>{" "}
                                        {String(v)}
                                      </p>
                                    ))}
                                </div>
                              ) : (
                                <p className="mt-1 text-[11px] italic text-[#9aa3af]">
                                  No form details yet
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline" className="h-5 text-[10px]">
                                {booking.number_of_people} people
                              </Badge>
                              <Badge variant="outline" className="h-5 text-[10px]">
                                {booking.payment_status || "pending"}
                              </Badge>
                              <Badge variant="outline" className="h-5 text-[10px]">
                                {booking.check_in_status || "not_checked_in"}
                              </Badge>
                              <Button
                                type="button"
                                size="sm"
                                className={cn(
                                  hasFormValues ? org.btnOutline : org.btnPrimary,
                                  "h-7 px-2 text-[12px]",
                                )}
                                onClick={() => openEventDetailsEditor(booking)}
                              >
                                {hasFormValues ? "Edit" : "Add details"}
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#e6eaf0] bg-white shadow-sm">
              <Search className="h-6 w-6 text-[#2a5af5]" aria-hidden />
            </div>
            <h3 className="mt-5 text-[15px] font-semibold text-[#1a1a1a]">Look up a customer</h3>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[#5b6572]">
              Type their mobile number above and press Enter to see appointments, history, and events.
            </p>
          </div>
        )}
      </main>

      {/* Event booking details dialog */}
      <Dialog
        open={isEventDetailsOpen}
        onOpenChange={(open) => {
          setIsEventDetailsOpen(open);
          if (!open) {
            setEventDetailsBooking(null);
            setEventDetailsFields([]);
            setEventDetailsValues({});
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-1rem)] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b bg-muted/25 px-4 py-3 text-left sm:px-6 sm:py-4">
            <DialogTitle className="text-lg sm:text-xl">Event booking details</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {eventDetailsBooking
                ? `Add / edit the form answers for Event #${eventDetailsBooking.event_id}.`
                : "Add / edit the form answers."}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {eventDetailsFields.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
                No booking form fields are configured for this event. Configure fields in{" "}
                <span className="font-medium">Organization → Reference Values → EVENTBOOKINGFORM</span>.
              </div>
            ) : (
              <div className="space-y-4">
                {eventDetailsFields.map((f) => {
                  const value = eventDetailsValues[f.key] ?? "";
                  const type = (f.type || "string").toLowerCase();
                  return (
                    <div key={f.key} className="space-y-2">
                      <Label htmlFor={`evdet-${f.key}`}>
                        {f.label || f.key}
                        {f.required ? " *" : ""}
                      </Label>
                      {type === "boolean" ? (
                        <div className="flex items-center gap-2">
                          <input
                            id={`evdet-${f.key}`}
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(e) =>
                              setEventDetailsValues((prev) => ({ ...prev, [f.key]: e.target.checked }))
                            }
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-muted-foreground">
                            {Boolean(value) ? "Yes" : "No"}
                          </span>
                        </div>
                      ) : (
                        <Input
                          id={`evdet-${f.key}`}
                          type={type === "number" ? "number" : type === "date" ? "date" : "text"}
                          value={value}
                          onChange={(e) =>
                            setEventDetailsValues((prev) => ({
                              ...prev,
                              [f.key]:
                                type === "number"
                                  ? e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                  : e.target.value,
                            }))
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 border-t bg-background px-4 py-3 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEventDetailsOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveEventDetails}
              disabled={!eventDetailsBooking || isSavingEventDetails}
              className={cn(org.btnPrimary, "w-full sm:w-auto")}
            >
              {isSavingEventDetails ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mountCreateClientDialog ? (
        <CreateClientDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onClientCreated={handleClientCreated}
        />
      ) : null}

      {/* On-Spot Registration Dialog - create user & book inline, no URL */}
      {mountOnSpotDialog ? (
        <OnSpotRegistrationDialog
          open={isOnSpotDialogOpen}
          onOpenChange={setIsOnSpotDialogOpen}
          onClientCreated={handleClientCreated}
        />
      ) : null}
      <Dialog
        open={!!selectedLoyaltyWallet}
        onOpenChange={(open) => !open && setSelectedLoyaltyWallet(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedLoyaltyWallet?.client_name || `Customer #${selectedLoyaltyWallet?.client_user_id}`}
            </DialogTitle>
            {selectedLoyaltyWallet?.client_mobile ? (
              <DialogDescription>{selectedLoyaltyWallet.client_mobile}</DialogDescription>
            ) : null}
          </DialogHeader>
          {selectedLoyaltyWallet ? (
            <div className="space-y-6">
              {isLoadingLoyaltyDetails ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-stone-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading loyalty details…
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-stone-500">Points</p>
                  <p className="text-lg font-bold tabular-nums">
                    {selectedLoyaltyWallet.current_points.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Services</p>
                  <p className="text-lg font-bold tabular-nums">
                    {selectedLoyaltyWallet.completed_services_count}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Tier</p>
                  <p className="text-lg font-bold">{selectedLoyaltyWallet.current_tier_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Spend</p>
                  <p className="text-lg font-bold tabular-nums">
                    ₹{Number(selectedLoyaltyWallet.total_spend).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-stone-500">Total earned</p>
                  <p className="text-base font-semibold tabular-nums">
                    {selectedLoyaltyWallet.total_points_earned.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Redeemed</p>
                  <p className="text-base font-semibold tabular-nums">
                    {selectedLoyaltyWallet.total_points_redeemed.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Available rewards</h4>
                {(selectedLoyaltyWallet.available_rewards ?? []).length === 0 ? (
                  <p className="text-sm text-stone-400">No available rewards</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedLoyaltyWallet.available_rewards.map((r) => (
                      <li
                        key={r.id}
                        className="flex justify-between gap-3 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      >
                        <span>
                          {loyaltyRewardLabel(r.reward_type, r.reward_value, r.max_discount_amount)}
                        </span>
                        {r.expires_at ? (
                          <span className="shrink-0 text-stone-400">
                            Expires {format(new Date(r.expires_at), "dd MMM yyyy")}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Points history</h4>
                {(selectedLoyaltyWallet.recent_transactions ?? []).length === 0 ? (
                  <p className="text-sm text-stone-400">No transactions yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedLoyaltyWallet.recent_transactions.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="text-xs">
                            {t.created_at ? format(new Date(t.created_at), "dd MMM yyyy HH:mm") : "—"}
                          </TableCell>
                          <TableCell className="capitalize">{t.transaction_type}</TableCell>
                          <TableCell className={t.points_delta >= 0 ? "text-emerald-600" : "text-red-600"}>
                            {t.points_delta >= 0 ? "+" : ""}
                            {t.points_delta}
                          </TableCell>
                          <TableCell>{t.balance_after}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {mountRoomDetailsDialog ? (
        <RoomBookingDetailsDialog
          room={roomDetailsTarget}
          open={isRoomDetailsOpen}
          onClose={() => {
            setIsRoomDetailsOpen(false);
            setRoomDetailsTarget(null);
          }}
        />
      ) : null}    </div>
  );
};

export default ClientManagement;
