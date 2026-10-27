import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  BedDouble,
  CalendarCheck,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EventBookingsPanel, {
  type EventBookingsPanelHandle,
} from "@/components/organization/EventBookingsPanel";
import UserAppointmentDetails from "@/components/organization/UserAppointmentDetails";
import RoomBookingDetailsDialog from "@/components/organization/RoomBookingDetailsDialog";
import { BookedAppoinmentRes, UpdateStatusReq } from "@/models/appoinment.model";
import { AppoinmentService } from "@/services/appoinment.service";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { useMountWhenOpened } from "@/hooks/useMountWhenOpened";
import {
  bookedAppointmentsQueryKey,
  fetchBookedAppointments,
  useBookedAppointments,
} from "@/hooks/useBookedAppointments";
import { useOrganisationLocations } from "@/hooks/useOrganisationLocations";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { REFERENCETYPE } from "@/models/users.model";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { sortReferenceValuesByDisplayOrder } from "@/utils/referencevalue.util";
import { cn } from "@/lib/utils";
import OrganizationPageShell from "@/components/layout/OrganizationPageShell";
import { org } from "@/lib/orgTheme";
import { hospitalityService } from "@/services/hospitality.service";
import { normalizeOrganisationRoom, OrganisationRoom } from "@/models/hospitality.model";
import type { OrganisationType } from "@/models/organisation.model";
import { useOrganisationCatalogOfferings } from "@/hooks/useOrganisationCatalogOfferings";
import { normalizeCatalogTab } from "@/utils/organisationCatalogOfferings.util";
import { OrganisationServiceTimingService } from "@/services/organisationservicetiming.service";
import {
  OrganisationServiceTimingSelectReq,
} from "@/models/organisationservicetiming.model";
import OrganizationCalendarRoomsView from "@/pages/organization/OrganizationCalendarRoomsView";
import OrganizationCalendarDayPanel, {
  TimingSlot,
} from "@/pages/organization/OrganizationCalendarDayPanel";
import {
  getAppointmentDayNumber,
  sendAppointmentDateToApi,
  toDateKey,
} from "@/utils/appointmentTime.util";

type CalendarKind = "services" | "rooms" | "events";

function parseCalendarKind(value: string | null): CalendarKind {
  if (value === "rooms" || value === "events") return value;
  return "services";
}

const OrganizationBookings = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { id: globalLocationId, setId: setGlobalLocationId } = useGlobalId();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const organizationId = user?.organisationid || 1;
  const {
    offerings: catalogOfferings,
    offersServices,
    offersEvents,
    offersRooms,
  } = useOrganisationCatalogOfferings(organizationId);
  const eventBookingsRef = useRef<EventBookingsPanelHandle>(null);
  const [eventFiltersHost, setEventFiltersHost] = useState<HTMLDivElement | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [calendarKind, setCalendarKind] = useState<CalendarKind>(() =>
    parseCalendarKind(searchParams.get("kind")),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allRooms, setAllRooms] = useState<OrganisationRoom[]>([]);
  const [roomOccupancyByDay, setRoomOccupancyByDay] = useState<Record<string, number>>({});
  const [selectedDayRoomStats, setSelectedDayRoomStats] = useState({ available: 0, occupied: 0 });
  const [organisationType, setOrganisationType] = useState<OrganisationType>("service");
  const [timeSlots, setTimeSlots] = useState<TimingSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [appointmentStatusList, setAppointmentStatusList] = useState<ReferenceValue[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<BookedAppoinmentRes | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRoomBooking, setSelectedRoomBooking] = useState<OrganisationRoom | null>(null);
  const [isRoomDetailsOpen, setIsRoomDetailsOpen] = useState(false);
  const [busyRoomId, setBusyRoomId] = useState<number | null>(null);
  const mountRoomDetailsDialog = useMountWhenOpened(isRoomDetailsOpen);

  const appointmentService = useMemo(() => new AppoinmentService(), []);
  const timingService = useMemo(() => new OrganisationServiceTimingService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);

  const organisationLocationId = globalLocationId
    ? Number(globalLocationId)
    : user?.locationid || 0;

  const showRoomsCalendar = offersRooms;

  useEffect(() => {
    if (catalogOfferings.length === 0) return;
    const normalized = normalizeCatalogTab(searchParams.get("kind"), catalogOfferings);
    setCalendarKind((prev) => (prev === normalized ? prev : normalized));
    const urlKind = searchParams.get("kind");
    const expectedUrlKind = normalized === "services" ? null : normalized;
    if (urlKind !== expectedUrlKind && (urlKind || expectedUrlKind)) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (normalized === "services") next.delete("kind");
          else next.set("kind", normalized);
          return next;
        },
        { replace: true },
      );
    }
  }, [catalogOfferings, searchParams, setSearchParams]);

  const [bookingCountByDay, setBookingCountByDay] = useState<Map<string, number>>(
    () => new Map(),
  );

  const { data: locationsData } = useOrganisationLocations({
    organisationId: user?.organisationid || 0,
    staffLocationId: user?.locationid || 0,
    enabled: isAuthenticated && (!!user?.organisationid || !!user?.locationid),
  });
  const locations = locationsData ?? [];

  const locationLabel = useMemo(() => {
    if (!organisationLocationId) return "";
    const loc = locations.find((l) => l.id === organisationLocationId);
    if (!loc) return "";
    return (
      loc.name?.trim() ||
      [loc.city, loc.state].filter(Boolean).join(", ") ||
      `Location #${loc.id}`
    );
  }, [locations, organisationLocationId]);

  const appointmentDateKey = sendAppointmentDateToApi(selectedDate);
  const {
    data: appointmentsData,
    isLoading: isAppointmentsLoading,
    isFetching: isAppointmentsFetching,
    refetch: refetchAppointments,
  } = useBookedAppointments({
    organisationId: organizationId,
    organisationLocationId,
    appointmentDate: appointmentDateKey,
    enabled: isAuthenticated && calendarKind === "services",
  });
  const appointments = appointmentsData ?? [];
  const isLoadingAppointments = isAppointmentsLoading || isAppointmentsFetching;
  const isLoading = calendarKind === "services" && isAppointmentsLoading;

  const fetchOrgProfile = useCallback(async () => {
    if (!isAuthenticated || !organizationId) return;
    try {
      const profile = await hospitalityService.getProfile(organizationId);
      setOrganisationType(profile.organisation_type ?? "service");
    } catch (error) {
      console.error("❌ Error fetching hospitality profile:", error);
      setOrganisationType("service");
    }
  }, [isAuthenticated, organizationId]);

  const fetchRoomBookings = useCallback(async () => {
    if (!isAuthenticated || !organizationId) return [] as OrganisationRoom[];

    const organisationlocationid = globalLocationId
      ? Number(globalLocationId)
      : (user?.locationid || 0);

    try {
      if (!organisationlocationid) {
        setAllRooms([]);
        setRoomOccupancyByDay({});
        setSelectedDayRoomStats({ available: 0, occupied: 0 });
        return [];
      }

      const board = await hospitalityService.getStatusBoard({
        organisation_id: organizationId,
        organisation_location_id: organisationlocationid,
        date: toDateKey(selectedDate),
        occupancy_month: format(calendarMonth, "yyyy-MM"),
      });
      const normalized = (board?.rooms || []).map((room) => normalizeOrganisationRoom(room));
      setAllRooms(normalized);
      setRoomOccupancyByDay(board?.occupancy_by_day || {});
      setSelectedDayRoomStats({
        available: board?.available_count ?? 0,
        occupied: board?.occupied_count ?? 0,
      });
      return normalized;
    } catch (error) {
      console.error("❌ Error fetching room bookings:", error);
      setAllRooms([]);
      setRoomOccupancyByDay({});
      setSelectedDayRoomStats({ available: 0, occupied: 0 });
      return [];
    }
  }, [
    isAuthenticated,
    organizationId,
    globalLocationId,
    user?.locationid,
    selectedDate,
    calendarMonth,
  ]);

  // Initialize location from shared locations list when not already set
  useEffect(() => {
    if (!isAuthenticated || globalLocationId) return;
    if (locations.length > 0) {
      setGlobalLocationId(locations[0].id);
    }
  }, [isAuthenticated, globalLocationId, locations, setGlobalLocationId]);

  const fetchStatusReferenceTypes = useCallback(async () => {
    try {
      const req = new ReferenceValueSelectReq();
      req.referencetypeid = REFERENCETYPE.APPOINTMENTSTATUS;
      req.organisationid = organizationId;
      const response = await referenceValueService.select(req);
      setAppointmentStatusList(sortReferenceValuesByDisplayOrder(response || []));
    } catch (error) {
      console.error("❌ Error fetching status types:", error);
    }
  }, [referenceValueService, organizationId]);

  const fetchSlotsForDate = useCallback(
    async (date: Date) => {
      if (!organizationId || !organisationLocationId) {
        setTimeSlots([]);
        return;
      }
      setIsLoadingSlots(true);
      try {
        const req = new OrganisationServiceTimingSelectReq();
        req.organisationid = organizationId;
        req.organisationlocationid = organisationLocationId;
        req.day_of_week = getAppointmentDayNumber(date);
        req.appointmentdate = sendAppointmentDateToApi(date);
        const response = await timingService.selecttimingslot(req);
        setTimeSlots((response as TimingSlot[]) || []);
      } catch (error) {
        console.error("Error loading time slots", error);
        toast({
          title: "Error",
          description: "Failed to load time slots for this date",
          variant: "destructive",
        });
        setTimeSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [organizationId, organisationLocationId, timingService, toast],
  );

  useEffect(() => {
    void fetchOrgProfile();
  }, [fetchOrgProfile]);

  // Clear day markers when location changes
  useEffect(() => {
    setBookingCountByDay(new Map());
  }, [organisationLocationId]);

  // Load month-wide booking dots so pending/total from the dashboard can be found on the calendar
  useEffect(() => {
    if (calendarKind !== "services" || !organizationId || !organisationLocationId) return;
    let cancelled = false;
    (async () => {
      try {
        const monthAppointments = await fetchBookedAppointments({
          organisationId: organizationId,
          organisationLocationId,
        });
        if (cancelled) return;
        const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
        const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
        const next = new Map<string, number>();
        for (const appt of monthAppointments) {
          const raw = appt.appoinmentdate;
          if (!raw) continue;
          const d = new Date(raw);
          if (Number.isNaN(d.getTime())) continue;
          if (d < monthStart || d > monthEnd) continue;
          const key = toDateKey(d);
          next.set(key, (next.get(key) ?? 0) + 1);
        }
        // Keep today's selected-day count accurate if the day query already returned
        next.set(toDateKey(selectedDate), appointments.length);
        setBookingCountByDay(next);
      } catch (error) {
        console.error("Error loading month booking markers:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    calendarKind,
    organizationId,
    organisationLocationId,
    calendarMonth,
    selectedDate,
    appointments.length,
  ]);

  useEffect(() => {
    if (calendarKind !== "services" || !organizationId) return;
    void fetchStatusReferenceTypes();
  }, [calendarKind, organizationId, fetchStatusReferenceTypes]);

  useEffect(() => {
    if (calendarKind !== "services") return;
    void fetchSlotsForDate(selectedDate);
  }, [calendarKind, selectedDate, fetchSlotsForDate]);

  useEffect(() => {
    if (calendarKind === "rooms") {
      void fetchRoomBookings();
    }
  }, [calendarKind, fetchRoomBookings, organisationLocationId]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (calendarKind === "events") {
        await eventBookingsRef.current?.refresh();
        return;
      }
      if (calendarKind === "rooms") {
        await fetchOrgProfile();
        await fetchRoomBookings();
        return;
      }
      await Promise.all([
        refetchAppointments(),
        fetchStatusReferenceTypes(),
        fetchSlotsForDate(selectedDate),
      ]);
    } catch (error) {
      console.error("❌ Error refreshing appointments:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCalendarKindChange = (kind: CalendarKind) => {
    if (!catalogOfferings.includes(kind)) return;
    setCalendarKind(kind);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (kind === "services") {
          next.delete("kind");
        } else {
          next.set("kind", kind);
        }
        return next;
      },
      { replace: true },
    );
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    if (
      date.getFullYear() !== calendarMonth.getFullYear() ||
      date.getMonth() !== calendarMonth.getMonth()
    ) {
      setCalendarMonth(date);
    }
  };

  const handleViewDetails = (appointment: BookedAppoinmentRes) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const handleManageRecord = (appointment: BookedAppoinmentRes) => {
    navigate(`/organization/appointments/${appointment.id}/record`);
  };

  const handleStatusChange = async (appointmentId: number, status: string) => {
    const organisationlocationid = globalLocationId
      ? Number(globalLocationId)
      : user?.locationid || 0;

    if (!organisationlocationid) {
      toast({
        title: "Error",
        description: "No location selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const req = new UpdateStatusReq();
      req.appoinmentid = appointmentId;
      req.statuscode = status;
      req.organisationid = organizationId;
      req.organisationlocationid = organisationlocationid;
      await appointmentService.UpdateStatus(req);
      await Promise.all([
        refetchAppointments(),
        fetchSlotsForDate(selectedDate),
      ]);
      toast({
        title: "Status updated",
        description: `Appointment status changed to ${status}.`,
      });
    } catch (error) {
      console.error("❌ Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

  const handleViewRoomDetails = (room: OrganisationRoom) => {
    setSelectedRoomBooking(room);
    setIsRoomDetailsOpen(true);
  };

  const runRoomAction = async (
    room: OrganisationRoom,
    action: () => Promise<boolean>,
    successMessage: string,
    optimistic?: Partial<OrganisationRoom>,
  ) => {
    setBusyRoomId(room.id);
    try {
      const ok = await action();
      if (!ok) throw new Error("Action failed");
      if (optimistic && selectedRoomBooking?.id === room.id) {
        setSelectedRoomBooking({ ...selectedRoomBooking, ...optimistic });
      }
      toast({ title: successMessage });
      const rooms = await fetchRoomBookings();
      if (selectedRoomBooking?.id === room.id || isRoomDetailsOpen) {
        const next = rooms.find((r) => r.id === room.id);
        if (next) setSelectedRoomBooking(next);
      }
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyRoomId(null);
    }
  };

  const handleRoomStatusChange = (room: OrganisationRoom, status: string) => {
    void runRoomAction(
      room,
      () =>
        hospitalityService.updateRoomStatus({
          id: room.id,
          organisation_id: organizationId,
          status,
        }),
      `Room ${room.room_number} updated to ${status}.`,
      { status },
    );
  };

  const handleRoomCheckout = (room: OrganisationRoom) => {
    void runRoomAction(
      room,
      () =>
        hospitalityService.checkoutRoom({
          id: room.id,
          organisation_id: organizationId,
        }),
      `Room ${room.room_number} is available now.`,
    );
  };

  const handleRoomMarkClean = (room: OrganisationRoom) => {
    void runRoomAction(
      room,
      () =>
        hospitalityService.markRoomClean({
          id: room.id,
          organisation_id: organizationId,
        }),
      `Room ${room.room_number} marked clean.`,
    );
  };

  const selectedDayBookings = appointments;

  const calendarControls = (
    <div className="space-y-3">
      <div className={cn(org.segmentGroup, "w-full flex-wrap")}>
        {offersServices ? (
        <button
          type="button"
          onClick={() => handleCalendarKindChange("services")}
          className={cn(
            "inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 px-2.5 text-[13px] font-medium transition-colors sm:flex-none",
            calendarKind === "services" ? org.segmentActive : org.segmentInactive,
          )}
        >
          <Clock className="h-4 w-4" />
          Services
        </button>
        ) : null}
        {showRoomsCalendar ? (
          <button
            type="button"
            onClick={() => handleCalendarKindChange("rooms")}
            className={cn(
              "inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 px-2.5 text-[13px] font-medium transition-colors sm:flex-none",
              calendarKind === "rooms" ? org.segmentActive : org.segmentInactive,
            )}
          >
            <BedDouble className="h-4 w-4" />
            Rooms
          </button>
        ) : null}
        {offersEvents ? (
        <button
          type="button"
          onClick={() => handleCalendarKindChange("events")}
          className={cn(
            "inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 px-2.5 text-[13px] font-medium transition-colors sm:flex-none",
            calendarKind === "events" ? org.segmentActive : org.segmentInactive,
          )}
        >
          <CalendarCheck className="h-4 w-4" />
          Events
        </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(org.btnOutline, "h-9 shrink-0")}
        >
          {isRefreshing ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>
    </div>
  );

  const monthCalendarPanel = (
    <div className={cn(org.card, "p-4")}>
      {calendarControls}
      <div className="mt-4 border-t border-[#eef1f5] pt-4">
        {locationLabel ? (
          <p className="mb-3 text-[13px] text-[#667085]">
            <span className="font-medium text-[#1a1a1a]">{locationLabel}</span>
            <span className="text-[#98a2b3]"> · </span>
            {format(selectedDate, "EEE, d MMM yyyy")}
          </p>
        ) : (
          <p className="mb-3 text-[13px] font-medium text-[#1a1a1a]">
            {format(selectedDate, "EEEE, d MMMM yyyy")}
          </p>
        )}
        {calendarKind === "events" ? (
          <div ref={setEventFiltersHost} className="space-y-3" />
        ) : (
          <>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && handleSelectDate(d)}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              className="pointer-events-auto rounded-lg border border-[#e6eaf0] p-2"
              modifiers={{
                hasBookings: (date) => (bookingCountByDay.get(toDateKey(date)) ?? 0) > 0,
                hasRoomActivity: (date) => (roomOccupancyByDay[toDateKey(date)] ?? 0) > 0,
              }}
              modifiersClassNames={{
                hasBookings:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-[#528ff0]",
                hasRoomActivity:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-[#f79009]",
              }}
            />
            <p className="mt-3 text-[12px] text-[#98a2b3]">
              Blue dot = day has service bookings
              {showRoomsCalendar ? "; amber = room occupancy" : ""}. Select a
              dotted day to see those appointments (dashboard pending can be on
              other dates).
            </p>
          </>
        )}
      </div>
    </div>
  );

  const roomsViewPanel = (
    <OrganizationCalendarRoomsView
      selectedDate={selectedDate}
      locationLabel={locationLabel}
      rooms={allRooms}
      isLoading={false}
      availableCount={selectedDayRoomStats.available}
      occupiedCount={selectedDayRoomStats.occupied}
      busyRoomId={busyRoomId}
      onViewDetails={handleViewRoomDetails}
      onStatusChange={handleRoomStatusChange}
      onCheckout={handleRoomCheckout}
      onMarkClean={handleRoomMarkClean}
    />
  );

  const locationEmptyPanel = (
    <div className={cn(org.card, "p-6 text-[13px] text-[#667085]")}>
      <p className="font-medium text-[#1a1a1a]">Select a location first</p>
      <p className="mt-1">
        Choose a location on the{" "}
        <Link to="/organization/dashboard" className="font-medium text-[#2a5af5] hover:underline">
          dashboard
        </Link>{" "}
        to view slots and rooms for that branch.
      </p>
    </div>
  );

  const centerPanel =
    !organisationLocationId ? (
      locationEmptyPanel
    ) : calendarKind === "rooms" ? (
      roomsViewPanel
    ) : (
      <OrganizationCalendarDayPanel
        selectedDate={selectedDate}
        timeSlots={timeSlots}
        isLoadingSlots={isLoadingSlots}
        selectedDayBookings={selectedDayBookings}
        isLoadingAppointments={isLoadingAppointments}
        appointmentStatusList={appointmentStatusList}
        onViewDetails={handleViewDetails}
        onManageRecord={handleManageRecord}
        onStatusChange={handleStatusChange}
      />
    );

  return (
    <OrganizationPageShell className="min-w-0 bg-[#f5f7f9] p-3 md:p-4 lg:p-5">
      {calendarKind === "events" ? (
        <div className={cn(org.pageSection, "pt-0 pb-2")}>
          <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
            <div className="min-w-0">{monthCalendarPanel}</div>
            <div className="min-w-0">
              <EventBookingsPanel
                ref={eventBookingsRef}
                embedded
                hideRefreshButton
                filtersHost={eventFiltersHost}
              />
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className={org.loading}>
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#528ff0]" />
            <p className="text-[13px] text-[#667085]">Loading bookings…</p>
          </div>
        </div>
      ) : (
        <div className={cn(org.pageSection, "pt-0 pb-2")}>
          <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
            <div className="min-w-0">{monthCalendarPanel}</div>
            <div className="min-w-0">{centerPanel}</div>
          </div>
        </div>
      )}

      {selectedAppointment ? (
        <UserAppointmentDetails
          appointment={selectedAppointment}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedAppointment(null);
          }}
          onAppointmentUpdate={(updatedAppointment) => {
            setSelectedAppointment(updatedAppointment);
            queryClient.setQueryData(
              bookedAppointmentsQueryKey({
                organisationId: organizationId,
                organisationLocationId,
                appointmentDate: appointmentDateKey,
              }),
              (prev: BookedAppoinmentRes[] | undefined) =>
                (prev || []).map((app) =>
                  app.id === updatedAppointment.id ? updatedAppointment : app,
                ),
            );
          }}
          onRefresh={handleRefresh}
        />
      ) : null}

      {mountRoomDetailsDialog ? (
        <RoomBookingDetailsDialog
          room={selectedRoomBooking}
          open={isRoomDetailsOpen}
          busy={busyRoomId != null && busyRoomId === selectedRoomBooking?.id}
          onClose={() => {
            setIsRoomDetailsOpen(false);
            setSelectedRoomBooking(null);
          }}
          onStatusChange={handleRoomStatusChange}
          onCheckout={handleRoomCheckout}
          onMarkClean={handleRoomMarkClean}
        />
      ) : null}    </OrganizationPageShell>
  );
};

export default OrganizationBookings;

