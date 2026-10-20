import { memo } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppoinmentFinal } from "@/models/appoinment.model";

type LeaveInfo = {
  isfullday?: boolean;
  start_time: string;
  end_time: string;
};

type BookingTimeSlotPickerProps = {
  timeSlots: AppoinmentFinal[];
  selectedFromTime: string;
  selectedDate: Date;
  hasLeaveRequests: boolean;
  leaveInfo: LeaveInfo | null;
  formatTime: (timeString: string) => string;
  isTimeSlotBlocked: (date: Date, fromtime: string) => boolean;
  isTimeSlotBlockedByLeave: (date: Date, fromtime: string) => boolean;
  isTimeSlotInPastForToday: (date: Date, fromtime: string) => boolean;
  onSelect: (slot: AppoinmentFinal) => void;
};

function BookingTimeSlotPickerInner({
  timeSlots,
  selectedFromTime,
  selectedDate,
  hasLeaveRequests,
  leaveInfo,
  formatTime,
  isTimeSlotBlocked,
  isTimeSlotBlockedByLeave,
  isTimeSlotInPastForToday,
  onSelect,
}: BookingTimeSlotPickerProps) {
  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
        <Clock className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">No time slots available for this date</p>
      </div>
    );
  }

  return (
    <>
      {hasLeaveRequests && leaveInfo ? (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 shrink-0" />
            <span className="text-sm font-medium text-orange-800">Leave Request Active</span>
          </div>
          <p className="text-xs text-orange-700 mt-1 pl-6">
            {leaveInfo.isfullday
              ? "Full day leave - All time slots unavailable"
              : `Half day leave: ${leaveInfo.start_time.slice(0, 5)} - ${leaveInfo.end_time.slice(0, 5)}`}
          </p>
        </div>
      ) : null}

      {/* Full-width mobile: 2–3 cols. Narrow desktop sidebar: 2 cols, 3 at xl. */}
      <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-2 xl:grid-cols-3">
        {timeSlots.map((slot, index) => {
          const remaining = Math.max(0, slot.remaining ?? (slot.statuscode === "Booked" ? 0 : 1));
          const capacity = Math.max(0, slot.capacity ?? remaining);
          const isSelected = selectedFromTime === slot.fromtime;
          const isBooked = remaining <= 0 || slot.statuscode === "Booked";
          const isOutsideWindow = slot.is_within_booking_window === false;
          const isBlocked = isTimeSlotBlocked(selectedDate, slot.fromtime);
          const isBlockedByLeave = isTimeSlotBlockedByLeave(selectedDate, slot.fromtime);
          const isPastSlot = isTimeSlotInPastForToday(selectedDate, slot.fromtime);
          const disabled =
            isBooked || isBlocked || isBlockedByLeave || isPastSlot || isOutsideWindow;

          return (
            <Button
              key={`${slot.fromtime}-${index}`}
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => onSelect(slot)}
              className={cn(
                "h-auto min-h-[3rem] w-full min-w-0 whitespace-normal rounded-2xl border-gray-200 px-2 py-2.5 text-center text-sm font-medium shadow-none transition sm:min-h-[3.25rem] sm:px-3 sm:py-3.5",
                !disabled && !isSelected && "hover:border-orange-500 hover:bg-orange-50",
                isSelected &&
                  "border-orange-500 bg-orange-500 text-white hover:bg-orange-600 hover:text-white",
                isBooked && "cursor-not-allowed opacity-50",
                isBlocked && "border-yellow-300 bg-yellow-50 text-yellow-900",
                isBlockedByLeave && "border-orange-300 bg-orange-100 text-orange-900",
                isPastSlot &&
                  "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500 opacity-55",
              )}
            >
              <div className="mx-auto flex w-full min-w-0 flex-col items-center gap-0.5 text-center">
                <div className="w-full break-words tabular-nums leading-snug">
                  {formatTime(slot.fromtime)}
                </div>
                {isBooked && <div className="text-xs leading-tight text-red-600">Booked</div>}
                {!isBooked && !isOutsideWindow && capacity > 0 && (
                  <div className="text-xs leading-tight opacity-80">
                    {remaining}/{capacity}
                  </div>
                )}
                {isOutsideWindow && (
                  <div className="max-w-full break-words text-[11px] leading-tight sm:text-xs">
                    Outside window
                  </div>
                )}
                {isBlocked && <div className="text-xs leading-tight">Holiday</div>}
                {isBlockedByLeave && <div className="text-xs leading-tight">Leave</div>}
                {isPastSlot && !isBooked && !isBlocked && !isBlockedByLeave && (
                  <div className="text-xs leading-tight text-zinc-500">Past</div>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </>
  );
}

export const BookingTimeSlotPicker = memo(BookingTimeSlotPickerInner);
