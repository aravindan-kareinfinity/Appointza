import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  Check,
  Loader2,
  BedDouble,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { getServiceEffectivePriceForDate } from "@/utils/servicePricing.util";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { OrganisationServicesService } from "@/services/organisationservices.service";
import { OrganisationServiceTimingService } from "@/services/organisationservicetiming.service";
import { EventService } from "@/services/event.service";
import { EventBookingService } from "@/services/eventbooking.service";
import { FilesService } from "@/services/files.service";
import {
  OrganisationServices,
  OrganisationServicesSelectReq,
} from "@/models/organisationservices.model";
import { OrganisationServiceTimingSelectReq, Weeks } from "@/models/organisationservicetiming.model";
import { Event, EventSelectReq } from "@/models/event.model";
import { EventBooking } from "@/models/eventbooking.model";
import { AppoinmentFinal, SelectedSerivice } from "@/models/appoinment.model";
import { encodeEventBookingNotes } from "@/utils/eventBookingNotes.util";
import { hospitalityService } from "@/services/hospitality.service";
import type { OrganisationType } from "@/models/organisation.model";
import { ClientHospitalityBookingPanel } from "@/components/organization/ClientHospitalityBookingPanel";

const ClientBookAppointment = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { id: globalLocationId } = useGlobalId();

  const organisationId = user?.organisationid || 0;
  const organisationLocationId = globalLocationId
    ? Number(globalLocationId)
    : user?.locationid || 0;

  const clientUserId = clientId ? parseInt(clientId) : 0;
  const clientInfo = (location.state as any) || {};
  const clientName = clientInfo.name || "Client";
  const clientMobile = clientInfo.mobile || "";

  const organisationServicesService = useMemo(
    () => new OrganisationServicesService(),
    []
  );
  const organisationServiceTimingService = useMemo(
    () => new OrganisationServiceTimingService(),
    []
  );
  const eventService = useMemo(() => new EventService(), []);
  const eventBookingService = useMemo(() => new EventBookingService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  const sendToApi = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  };

  type BookingType = "service" | "event" | "stay";
  const [bookingType, setBookingType] = useState<BookingType>("service");
  const [organisationType, setOrganisationType] = useState<OrganisationType>("service");

  const showHospitalityBooking =
    organisationType === "hospitality" || organisationType === "both";

  // Service booking state
  const [services, setServices] = useState<OrganisationServices[]>([]);
  const [timeSlots, setTimeSlots] = useState<AppoinmentFinal[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AppoinmentFinal | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedSerivice[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBookingService, setIsBookingService] = useState(false);

  // Event booking state
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [attendeeNames, setAttendeeNames] = useState<string[]>([""]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isBookingEvent, setIsBookingEvent] = useState(false);

  useEffect(() => {
    if (!clientUserId) {
      toast({
        title: "Error",
        description: "Client ID is missing",
        variant: "destructive",
      });
      navigate("/organization/clients");
      return;
    }
  }, [clientUserId, navigate, toast]);

  useEffect(() => {
    if (organisationId === 0) return;
    void hospitalityService.getProfile(organisationId).then((profile) => {
      setOrganisationType(profile.organisation_type ?? "service");
    });
  }, [organisationId]);

  const loadServices = useCallback(async () => {
    if (organisationId === 0) return;
    setIsLoadingServices(true);
    try {
      const req = new OrganisationServicesSelectReq();
      req.organisationid = organisationId;
      req.organisationlocationid = organisationLocationId;
      req.id = 0;
      const response = await organisationServicesService.select(req);
      const active = (response || []).filter((s) => s.isactive);
      setServices(active);
    } catch (error) {
      console.error("Error loading services:", error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setIsLoadingServices(false);
    }
  }, [organisationId, organisationLocationId, organisationServicesService, toast]);

  const loadTimeSlots = useCallback(async () => {
    if (organisationId === 0 || organisationLocationId === 0) return;
    setIsLoadingSlots(true);
    try {
      const req = new OrganisationServiceTimingSelectReq();
      req.organisationid = organisationId;
      req.organisationlocationid = organisationLocationId;
      const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
      const dayNumber = Weeks[dayName as keyof typeof Weeks];
      req.day_of_week = dayNumber;
      req.appointmentdate = sendToApi(selectedDate);
      const response = await organisationServiceTimingService.selecttimingslot(req);
      setTimeSlots(response || []);
      setSelectedTimeSlot(null);
    } catch (error) {
      console.error("Error loading time slots:", error);
      toast({
        title: "Error",
        description: "Failed to load time slots",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSlots(false);
    }
  }, [
    organisationId,
    organisationLocationId,
    selectedDate,
    organisationServiceTimingService,
    toast,
  ]);

  const loadEvents = useCallback(async () => {
    if (organisationId === 0) return;
    setIsLoadingEvents(true);
    try {
      const req: EventSelectReq = {
        id: 0,
        organisation_id: organisationId,
        organisation_location_id: organisationLocationId,
        status: "active",
        is_public: true,
      };
      const response = await eventService.select(req);
      const publicEvents = (response || []).filter((e) => e.is_public === true);
      setEvents(publicEvents);
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEvents(false);
    }
  }, [organisationId, organisationLocationId, eventService, toast]);

  useEffect(() => {
    if (bookingType === "service") {
      loadServices();
    } else {
      loadEvents();
    }
  }, [bookingType, loadServices, loadEvents]);

  useEffect(() => {
    if (selectedEvent && numberOfPeople > 0) {
      setAttendeeNames((prev) =>
        Array(numberOfPeople)
          .fill("")
          .map((_, i) => prev[i] || "")
      );
    }
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (bookingType === "service") {
      loadTimeSlots();
    }
  }, [bookingType, selectedDate, loadTimeSlots]);

  const handleServiceToggle = (service: OrganisationServices) => {
    const item = new SelectedSerivice();
    item.id = service.id;
    item.servicename = service.Servicename || service.servicename || "";
    item.serviceprice = getServiceEffectivePriceForDate(service, selectedDate).effectivePrice;
    item.servicetimetaken = service.timetaken || 0;
    item.iscombo = service.Iscombo || false;

    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === item.id);
      if (exists) return prev.filter((s) => s.id !== item.id);
      return [...prev, item];
    });
  };

  const handleBookService = async () => {
    if (selectedServices.length === 0 || !selectedTimeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select at least one service and a time slot",
        variant: "destructive",
      });
      return;
    }

    setIsBookingService(true);
    try {
      const appointment = new AppoinmentFinal();
      appointment.userid = clientUserId;
      appointment.organisationlocationid = organisationLocationId;
      appointment.organizationid = organisationId;
      appointment.appoinmentdate = sendToApi(selectedDate);
      appointment.fromtime = selectedTimeSlot.fromtime;
      appointment.totime = selectedTimeSlot.totime;
      appointment.attributes = { servicelist: selectedServices };
      // Bypass payment - org admin booking on behalf of client (payment collected in person or separately)
      appointment.ispaid = true;

      const response = await organisationServiceTimingService.Bookappoinment(appointment);

      if (
        response === "Successfully booked." ||
        response === "Successfully booked"
      ) {
        toast({
          title: "Appointment Booked",
          description: `Appointment created for ${clientName}`,
        });
        navigate("/organization/clients", {
          state: { selectedClientId: clientUserId },
        });
      } else {
        toast({
          title: "Booking Error",
          description: response || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error booking:", error);
      toast({
        title: "Booking Failed",
        description: error?.response?.data?.message || error?.message || "Failed to book",
        variant: "destructive",
      });
    } finally {
      setIsBookingService(false);
    }
  };

  const handleNumberOfPeopleChange = (newCount: number) => {
    setNumberOfPeople(newCount);
    setAttendeeNames((prev) => {
      if (newCount > 1) {
        return Array(newCount)
          .fill("")
          .map((_, i) => prev[i] || "");
      }
      return [""];
    });
  };

  const handleAttendeeNameChange = (index: number, value: string) => {
    setAttendeeNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleBookEvent = async () => {
    if (!selectedEvent) {
      toast({
        title: "Missing Information",
        description: "Please select an event",
        variant: "destructive",
      });
      return;
    }

    if (selectedEvent.remainingslot < numberOfPeople) {
      toast({
        title: "Not enough slots",
        description: `Only ${selectedEvent.remainingslot} slot(s) available`,
        variant: "destructive",
      });
      return;
    }

    if (numberOfPeople >= 1) {
      const validNames = attendeeNames.filter((n) => n.trim().length > 0);
      if (validNames.length !== numberOfPeople) {
        toast({
          title: "Validation Error",
          description: `Please enter names for all ${numberOfPeople} attendee(s)`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsBookingEvent(true);
    try {
      const booking = new EventBooking();
      booking.event_id = selectedEvent.id;
      booking.user_id = clientUserId;
      booking.number_of_people = numberOfPeople;
      const totalAmount =
        (selectedEvent.entry_amount || 0) * numberOfPeople;
      if (totalAmount > 0) {
        booking.total_amount = totalAmount;
      }
      if (numberOfPeople >= 1) {
        booking.notes = encodeEventBookingNotes(
          attendeeNames.filter((n) => n.trim().length > 0),
          {}
        );
      }

      await eventBookingService.insert(booking);

      toast({
        title: "Event Booked",
        description: `Booked ${numberOfPeople} slot(s) for ${clientName}`,
      });
      navigate("/organization/clients", {
        state: { selectedClientId: clientUserId },
      });
    } catch (error: any) {
      console.error("Error booking event:", error);
      toast({
        title: "Booking Failed",
        description: error?.response?.data?.message || error?.message || "Failed to book event",
        variant: "destructive",
      });
    } finally {
      setIsBookingEvent(false);
    }
  };

  const bookingTabs: { id: BookingType; label: string; icon: typeof CalendarIcon }[] = [
    { id: "service", label: "Service", icon: CalendarIcon },
    { id: "event", label: "Event", icon: CalendarDays },
    ...(showHospitalityBooking
      ? [{ id: "stay" as const, label: "Stay", icon: BedDouble }]
      : []),
  ];

  const selectRowClass = (selected: boolean) =>
    cn(
      "flex w-full cursor-pointer items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors",
      selected
        ? "border-[#2a5af5] bg-[#eef2ff]"
        : "border-[#e6eaf0] bg-white hover:border-[#cfd6e0] hover:bg-[#f8fafc]",
    );

  return (
    <div
      className={cn(
        org.pageSection,
        "mx-auto w-full max-w-5xl space-y-3 px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 sm:space-y-4 sm:px-4 sm:pt-4 md:px-6",
      )}
    >
      <header className="flex items-center gap-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-[#5b6572] hover:text-[#1a1a1a]"
          onClick={() => navigate("/organization/clients")}
          aria-label="Back to clients"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-semibold tracking-tight text-[#1a1a1a]">Book</h1>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[12px] text-[#5b6572]">
            <User className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate font-medium text-[#1a1a1a]">{clientName}</span>
            {clientMobile ? (
              <>
                <span className="text-[#cfd6e0]" aria-hidden>
                  ·
                </span>
                <Phone className="h-3 w-3 shrink-0" aria-hidden />
                <span className="tabular-nums">{clientMobile}</span>
              </>
            ) : null}
          </p>
        </div>
      </header>

      <div
        className={cn(
          org.segmentGroup,
          "grid w-full",
          showHospitalityBooking ? "grid-cols-3" : "grid-cols-2",
        )}
        role="tablist"
        aria-label="Booking type"
      >
        {bookingTabs.map((tab) => {
          const Icon = tab.icon;
          const active = bookingType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setBookingType(tab.id)}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-1.5 px-2 text-[12px] font-medium transition-colors sm:text-[13px]",
                active ? org.segmentActive : org.segmentInactive,
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e6eaf0] bg-white">
        {bookingType === "service" ? (
          isLoadingServices ? (
            <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[#5b6572]">
              <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
              Loading services…
            </div>
          ) : services.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-[#5b6572]">No services available</p>
          ) : (
            <div className="grid lg:grid-cols-[minmax(0,1fr)_min(20rem,38%)]">
              <section className="border-b border-[#e6eaf0] p-3 sm:p-4 lg:border-b-0 lg:border-r">
                <p className={cn(org.label, "mb-2")}>Services</p>
                <div className="grid max-h-[min(22rem,45vh)] gap-1.5 overflow-y-auto overscroll-contain sm:max-h-none lg:max-h-[min(28rem,60vh)]">
                  {services.map((s) => {
                    const isSelected = selectedServices.some((x) => x.id === s.id);
                    const imageId = s.attributes?.ImageIds?.find((id) => (id ?? 0) > 0) ?? 0;
                    const imageUrl = imageId ? filesService.getImageUrl(imageId) : "";
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleServiceToggle(s)}
                        className={selectRowClass(isSelected)}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-md border border-[#e6eaf0] object-cover"
                            loading="lazy"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-[#1a1a1a]">
                            {s.Servicename || s.servicename}
                          </p>
                          <p className="text-[12px] text-[#5b6572]">
                            {s.timetaken} min · ₹{s.offerprize > 0 ? s.offerprize : s.prize}
                          </p>
                        </div>
                        {isSelected ? (
                          <Check className="h-4 w-4 shrink-0 text-[#2a5af5]" aria-hidden />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="flex flex-col gap-3 p-3 sm:p-4">
                <div>
                  <p className={cn(org.label, "mb-1.5")}>Date</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(org.btnOutline, "h-9 w-full justify-start font-normal")}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-[#5b6572]" />
                        {format(selectedDate, "EEE, MMM d")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => d && setSelectedDate(d)}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="min-h-0 flex-1">
                  <p className={cn(org.label, "mb-1.5")}>Time</p>
                  {isLoadingSlots ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-[13px] text-[#5b6572]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
                      Loading slots…
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <p className="py-4 text-center text-[12px] text-[#5b6572]">
                      No slots for this date
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-3">
                      {timeSlots.map((slot) => {
                        const isSelected = selectedTimeSlot?.fromtime === slot.fromtime;
                        return (
                          <button
                            key={slot.fromtime}
                            type="button"
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={cn(
                              "inline-flex h-8 items-center justify-center gap-1 rounded-md border text-[12px] font-medium tabular-nums transition-colors",
                              isSelected
                                ? "border-[#2a5af5] bg-[#2a5af5] text-white"
                                : "border-[#e6eaf0] bg-white text-[#1a1a1a] hover:border-[#cfd6e0]",
                            )}
                          >
                            <Clock className="h-3 w-3 opacity-70" aria-hidden />
                            {slot.fromtime?.slice(0, 5)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={() => void handleBookService()}
                  disabled={
                    selectedServices.length === 0 || !selectedTimeSlot || isBookingService
                  }
                  className={cn(org.btnPrimary, "mt-auto h-9 w-full")}
                >
                  {isBookingService ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Booking…
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="h-3.5 w-3.5" />
                      Create appointment
                      {selectedServices.length > 0 ? ` (${selectedServices.length})` : ""}
                    </>
                  )}
                </Button>
              </section>
            </div>
          )
        ) : null}

        {bookingType === "event" ? (
          isLoadingEvents ? (
            <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[#5b6572]">
              <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
              Loading events…
            </div>
          ) : events.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-[#5b6572]">No events available</p>
          ) : (
            <div className="grid lg:grid-cols-[minmax(0,1fr)_min(20rem,38%)]">
              <section className="border-b border-[#e6eaf0] p-3 sm:p-4 lg:border-b-0 lg:border-r">
                <p className={cn(org.label, "mb-2")}>Events</p>
                <div className="grid gap-1.5">
                  {events.map((e) => {
                    const isSelected = selectedEvent?.id === e.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedEvent(e)}
                        className={selectRowClass(isSelected)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-[#1a1a1a]">
                            {e.event_name}
                          </p>
                          <p className="text-[12px] text-[#5b6572]">
                            {e.remainingslot} slots ·{" "}
                            {e.entry_amount > 0 ? `₹${e.entry_amount}/person` : "Free"}
                          </p>
                        </div>
                        {isSelected ? (
                          <Check className="h-4 w-4 shrink-0 text-[#2a5af5]" aria-hidden />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="flex flex-col gap-3 p-3 sm:p-4">
                {selectedEvent ? (
                  <>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <p className={org.label}>People</p>
                        <span className="text-[11px] text-[#5b6572]">
                          Max {selectedEvent.remainingslot}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleNumberOfPeopleChange(Math.max(1, numberOfPeople - 1))
                          }
                          disabled={numberOfPeople <= 1}
                        >
                          −
                        </Button>
                        <span className="w-8 text-center text-[15px] font-semibold tabular-nums text-[#1a1a1a]">
                          {numberOfPeople}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleNumberOfPeopleChange(
                              Math.min(selectedEvent.remainingslot, numberOfPeople + 1),
                            )
                          }
                          disabled={numberOfPeople >= selectedEvent.remainingslot}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className={org.label}>Attendee names</p>
                      {attendeeNames.map((name, index) => (
                        <Input
                          key={index}
                          id={`attendee-${index}`}
                          type="text"
                          placeholder={`Person ${index + 1}`}
                          value={name}
                          onChange={(e) => handleAttendeeNameChange(index, e.target.value)}
                          disabled={isBookingEvent}
                          className={cn(org.input, "h-9")}
                          aria-label={`Person ${index + 1} name`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="py-6 text-center text-[12px] text-[#5b6572]">
                    Select an event to continue
                  </p>
                )}

                <Button
                  type="button"
                  onClick={() => void handleBookEvent()}
                  disabled={
                    !selectedEvent ||
                    isBookingEvent ||
                    (numberOfPeople >= 1 &&
                      attendeeNames.filter((n) => n.trim().length > 0).length !== numberOfPeople)
                  }
                  className={cn(org.btnPrimary, "mt-auto h-9 w-full")}
                >
                  {isBookingEvent ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Booking…
                    </>
                  ) : (
                    <>
                      <CalendarDays className="h-3.5 w-3.5" />
                      Book event
                    </>
                  )}
                </Button>
              </section>
            </div>
          )
        ) : null}

        {bookingType === "stay" && showHospitalityBooking ? (
          <div className="p-3 sm:p-4">
            <ClientHospitalityBookingPanel
              organisationId={organisationId}
              organisationLocationId={organisationLocationId}
              clientName={clientName}
              clientMobile={clientMobile}
              onSuccess={() =>
                navigate("/organization/clients", {
                  state: { selectedClientId: clientUserId },
                })
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ClientBookAppointment;
