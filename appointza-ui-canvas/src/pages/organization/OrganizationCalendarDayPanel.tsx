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
    <div className="min-w-0 space-y-4">
      <div className={cn(org.card, "p-4 sm:p-5")}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#eef1f5] pb-4">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a]">
            {format(selectedDate, "EEEE, d MMMM yyyy")}
          </h2>
          <div className="flex flex-wrap gap-2 text-[12px]">
            <Badge className="rounded-md border-transparent bg-[#ecfdf3] font-medium text-[#067647]">
              {availableSeats} available
            </Badge>
            <Badge className="rounded-md border-transparent bg-[#eef4ff] font-medium text-[#3538cd]">
              {bookedSeats} booked
            </Badge>
            <Badge
              variant="outline"
              className="rounded-md border-[#e6eaf0] font-medium text-[#667085]"
            >
              {sortedBookings.length} booking
              {sortedBookings.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#1a1a1a]">
            <Clock className="h-4 w-4 text-[#2a5af5]" />
            Time slots
          </h3>
          {isLoadingSlots ? (
            <div className="flex items-center gap-2 py-8 text-[13px] text-[#667085]">
              <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
              Loading slots…
            </div>
          ) : timeSlots.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#e6eaf0] bg-[#f8fafc] px-4 py-8 text-center text-[13px] text-[#667085]">
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
                      "rounded-lg border px-3 py-2.5 text-center text-[13px] transition-colors",
                      isAvailable
                        ? "border-[#abefc6] bg-[#ecfdf3] text-[#067647]"
                        : "border-[#e6eaf0] bg-[#f2f4f7] text-[#667085]",
                    )}
                  >
                    <div className="font-semibold tabular-nums text-[#1a1a1a]">
                      {formatAppointmentTime(slot.fromtime)}
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium">
                      {isAvailable
                        ? `${remaining} of ${capacity || remaining} left`
                        : slot.notes || "Fully booked"}
                    </div>
                    {slot.is_within_booking_window === false ? (
                      <div className="mt-0.5 text-[10px] text-[#b54708]">
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
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#1a1a1a]">
            <User className="h-4 w-4 text-[#2a5af5]" />
            Who booked this day
          </h3>
          {isLoadingAppointments ? (
            <div className="flex items-center gap-2 py-6 text-[13px] text-[#667085]">
              <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
              Loading bookings…
            </div>
          ) : sortedBookings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#e6eaf0] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#667085]">
              <p>No customer bookings on this date.</p>
              <p className="mt-2 text-[12px] text-[#98a2b3]">
                Days with bookings show a blue dot on the calendar. Dashboard
                “Pending” counts today and future dates that still need action.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#eef1f5] rounded-lg border border-[#e6eaf0] bg-white">
              {sortedBookings.map((apt) => (
                <li key={apt.id} className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-[#1a1a1a]">
                        {apt.username || "Customer"}
                      </p>
                      {apt.mobile ? (
                        <p className="mt-0.5 text-[13px] text-[#667085]">{apt.mobile}</p>
                      ) : null}
                      {apt.attributes?.servicelist?.length ? (
                        <p className="mt-1 line-clamp-2 text-[12px] text-[#667085]">
                          {apt.attributes.servicelist
                            .map((s) => s.servicename)
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      ) : null}
                      <p className="mt-2 text-[13px] font-medium tabular-nums text-[#344054]">
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
                          <SelectTrigger className={cn(org.selectTrigger, "sm:w-[140px]")}>
                            <SelectValue>
                              <span className="text-[12px] font-medium capitalize">
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
                        <Badge
                          variant="outline"
                          className="rounded-md border-[#e6eaf0] text-[12px] capitalize text-[#667085]"
                        >
                          {apt.statuscode}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {canManage ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      {onViewDetails ? (
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(org.btnOutline, "h-9 flex-1")}
                          onClick={() => onViewDetails(apt)}
                        >
                          <Eye className="mr-1.5 h-4 w-4" />
                          View details
                        </Button>
                      ) : null}
                      {onManageRecord ? (
                        <Button
                          type="button"
                          className={cn(org.btnPrimary, "h-9 flex-1")}
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

      <p className="flex items-center gap-1.5 text-[12px] text-[#98a2b3]">
        <CalendarClock className="h-3.5 w-3.5" />
        Slot availability uses the same rules as your public booking page (capacity, events, and
        leave).
      </p>
    </div>
  );
}

export default OrganizationCalendarDayPanel;
