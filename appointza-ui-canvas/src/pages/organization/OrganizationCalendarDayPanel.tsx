import { format } from "date-fns";
import { CalendarClock, Clock, Eye, FileText, Loader2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { AppoinmentFinal, BookedAppoinmentRes } from "@/models/appoinment.model";
import { ReferenceValue } from "@/models/referencevalue.model";
import {
  formatAppointmentTime,
  parseDotNetTimeSpanToMilliseconds,
} from "@/utils/appointmentTime.util";

export type TimingSlot = AppoinmentFinal & {
  statuscode?: string;
  notes?: string;
};

type OrganizationCalendarDayPanelProps = {
  selectedDate: Date;
  timeSlots: TimingSlot[];
  isLoadingSlots: boolean;
  selectedDayBookings: BookedAppoinmentRes[];
  isLoadingAppointments: boolean;
  appointmentStatusList?: ReferenceValue[];
  onViewDetails?: (appointment: BookedAppoinmentRes) => void;
  onManageRecord?: (appointment: BookedAppoinmentRes) => void;
  onStatusChange?: (appointmentId: number, status: string) => void;
};

export function OrganizationCalendarDayPanel({
  selectedDate,
  timeSlots,
  isLoadingSlots,
  selectedDayBookings,
  isLoadingAppointments,
  appointmentStatusList = [],
  onViewDetails,
  onManageRecord,
  onStatusChange,
}: OrganizationCalendarDayPanelProps) {
  const availableSeats = timeSlots.reduce((sum, s) => sum + Math.max(0, s.remaining ?? 0), 0);
  const totalCapacity = timeSlots.reduce((sum, s) => sum + Math.max(0, s.capacity ?? 0), 0);
  const bookedSeats = Math.max(0, totalCapacity - availableSeats);

  const sortedBookings = [...selectedDayBookings].sort((a, b) => {
    const ta = parseDotNetTimeSpanToMilliseconds(a.fromtime) ?? 0;
    const tb = parseDotNetTimeSpanToMilliseconds(b.fromtime) ?? 0;
    return ta - tb;
  });

  const canManage = Boolean(onViewDetails || onManageRecord || onStatusChange);

  return (
    <div className="min-w-0 space-y-6">
      <div className={cn(org.card, "p-4 sm:p-5")}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-appointza-navy">
            {format(selectedDate, "EEEE, d MMMM yyyy")}
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge className="border-transparent bg-emerald-50 text-emerald-700">
              {availableSeats} available
            </Badge>
            <Badge className="border-transparent bg-[#FFF0EB] text-[#E85D4C]">
              {bookedSeats} booked
            </Badge>
            <Badge variant="outline" className="text-stone-600">
              {sortedBookings.length} booking
              {sortedBookings.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-appointza-navy">
            <Clock className="h-4 w-4 text-[#E85D4C]" />
            Time slots
          </h3>
          {isLoadingSlots ? (
            <div className="flex items-center gap-2 py-8 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#E85D4C]" />
              Loading slots…
            </div>
          ) : timeSlots.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-8 text-center text-sm text-stone-500">
              No slots configured for this day. Set business hours under Settings → Business hours.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
              {timeSlots.map((slot, index) => {
                const remaining = Math.max(0, slot.remaining ?? 0);
                const capacity = Math.max(0, slot.capacity ?? 0);
                const isAvailable = remaining > 0;
                return (
                  <div
                    key={`${String(slot.fromtime)}-${index}`}
                    className={cn(
                      "rounded-2xl border px-3 py-2.5 text-center text-sm transition-colors",
                      isAvailable
                        ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                        : "border-stone-200 bg-stone-100 text-stone-600",
                    )}
                  >
                    <div className="font-semibold tabular-nums">
                      {formatAppointmentTime(slot.fromtime)}
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium">
                      {isAvailable
                        ? `${remaining} of ${capacity || remaining} left`
                        : slot.notes || "Fully booked"}
                    </div>
                    {slot.is_within_booking_window === false ? (
                      <div className="mt-0.5 text-[10px] text-amber-700">
                        Outside booking window
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-appointza-navy">
            <User className="h-4 w-4 text-[#E85D4C]" />
            Who booked this day
          </h3>
          {isLoadingAppointments ? (
            <div className="flex items-center gap-2 py-6 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#E85D4C]" />
              Loading bookings…
            </div>
          ) : sortedBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-500">
              <p>No customer bookings on this date.</p>
              <p className="mt-2 text-xs text-stone-400">
                Days with bookings show a coral dot on the calendar. Dashboard
                “Pending” counts today and future dates that still need action.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {sortedBookings.map((apt) => (
                <li
                  key={apt.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-appointza-navy">
                        {apt.username || "Customer"}
                      </p>
                      {apt.mobile ? (
                        <p className="mt-0.5 text-sm text-stone-500">{apt.mobile}</p>
                      ) : null}
                      {apt.attributes?.servicelist?.length ? (
                        <p className="mt-1 line-clamp-2 text-xs text-stone-600">
                          {apt.attributes.servicelist
                            .map((s) => s.servicename)
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm font-medium tabular-nums text-stone-700">
                        {formatAppointmentTime(apt.fromtime)}
                        {apt.totime ? <> – {formatAppointmentTime(apt.totime)}</> : null}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      {onStatusChange ? (
                        <Select
                          value={apt.statuscode || "PENDING"}
                          onValueChange={(value) => onStatusChange(apt.id, value)}
                        >
                          <SelectTrigger className="h-9 w-full rounded-xl border-stone-200 sm:w-[140px]">
                            <SelectValue>
                              <span className="text-xs font-medium capitalize">
                                {(apt.statuscode || "PENDING").toLowerCase()}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {appointmentStatusList.length > 0 ? (
                              appointmentStatusList.map((status) => (
                                <SelectItem key={status.id} value={status.identifier}>
                                  {status.displaytext}
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      ) : apt.statuscode ? (
                        <Badge variant="outline" className="text-xs capitalize">
                          {apt.statuscode}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {canManage ? (
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      {onViewDetails ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 flex-1 rounded-2xl border-stone-200"
                          onClick={() => onViewDetails(apt)}
                        >
                          <Eye className="mr-1.5 h-4 w-4" />
                          View details
                        </Button>
                      ) : null}
                      {onManageRecord ? (
                        <Button
                          type="button"
                          className="h-10 flex-1 rounded-2xl bg-gradient-coral text-white hover:opacity-95"
                          onClick={() => onManageRecord(apt)}
                        >
                          <FileText className="mr-1.5 h-4 w-4" />
                          Manage record
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-stone-500">
        <CalendarClock className="h-3.5 w-3.5" />
        Slot availability uses the same rules as your public booking page (capacity, events, and
        leave).
      </p>
    </div>
  );
}

export default OrganizationCalendarDayPanel;
