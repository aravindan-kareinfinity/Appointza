import { format } from "date-fns";
import { BedDouble, Eye, Loader2 } from "lucide-react";
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
import { OrganisationRoom, ROOM_STATUSES } from "@/models/hospitality.model";
import { parseDateOnlyLocal, roomAvailabilityClassName } from "@/utils/roomAmenities.util";
import { roomGuestName, roomGuestPhone } from "@/utils/roomBooking.util";
import { Link } from "react-router-dom";

type OrganizationCalendarRoomsViewProps = {
  selectedDate: Date;
  locationLabel: string;
  rooms: OrganisationRoom[];
  isLoading: boolean;
  occupiedCount: number;
  availableCount: number;
  busyRoomId?: number | null;
  onViewDetails?: (room: OrganisationRoom) => void;
  onStatusChange?: (room: OrganisationRoom, status: string) => void;
  onCheckout?: (room: OrganisationRoom) => void;
  onMarkClean?: (room: OrganisationRoom) => void;
};

function formatStayDate(value?: string | null) {
  const date = parseDateOnlyLocal(value);
  if (!date) return null;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function OrganizationCalendarRoomsView({
  selectedDate,
  locationLabel,
  rooms,
  isLoading,
  occupiedCount,
  availableCount,
  busyRoomId = null,
  onViewDetails,
  onStatusChange,
  onCheckout,
  onMarkClean,
}: OrganizationCalendarRoomsViewProps) {
  return (
    <div className="min-w-0 space-y-4">
      <div className={cn(org.card, "p-4 sm:p-5")}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#eef1f5] pb-4">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a]">
            {format(selectedDate, "EEEE, d MMMM yyyy")}
          </h2>
          <div className="flex flex-wrap gap-2 text-[12px]">
            <Badge className="rounded-md border-transparent bg-[#ecfdf3] font-medium text-[#067647]">
              {availableCount} available
            </Badge>
            <Badge className="rounded-md border-transparent bg-[#fff4e5] font-medium text-[#b54708]">
              {occupiedCount} occupied / reserved
            </Badge>
            <Badge
              variant="outline"
              className="rounded-md border-[#e6eaf0] font-medium text-[#667085]"
            >
              {rooms.length} room{rooms.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        {locationLabel ? (
          <p className="mb-4 text-[13px] text-[#667085]">
            Location: <span className="font-medium text-[#344054]">{locationLabel}</span>
          </p>
        ) : null}

        {isLoading ? (
          <div className="flex items-center gap-2 py-12 text-[13px] text-[#667085]">
            <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
            Loading rooms…
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#e6eaf0] bg-[#f8fafc] px-4 py-10 text-center">
            <BedDouble className="mx-auto mb-3 h-10 w-10 text-[#d0d5dd]" />
            <p className="text-[13px] text-[#667085]">No rooms defined for this location.</p>
            <Button asChild variant="outline" className={cn(org.btnOutline, "mt-4")}>
              <Link to="/organization/hospitality?section=room-status">Add rooms</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => {
              const state = room.availability_state || "Available";
              const isBusy = busyRoomId === room.id;
              const canManage = room.can_manage;
              const guestName = room.guest?.name?.trim() ? roomGuestName(room) : null;
              const guestPhone = room.guest?.phone?.trim() ? roomGuestPhone(room) : null;
              const guestEmail = room.guest?.email?.trim() || "";
              const checkInLabel = formatStayDate(room.booking?.check_in);
              const checkOutLabel = formatStayDate(room.booking?.check_out);
              const nights = room.booking?.nights ?? 0;
              const bookingRef = room.booking?.booking_id?.trim() || "";

              return (
                <div
                  key={room.id}
                  className="rounded-lg border border-[#e6eaf0] bg-white p-4 shadow-none"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#1a1a1a]">
                        Room {room.room_number}
                      </p>
                      <p className="text-[13px] text-[#667085]">
                        {room.room_name || room.room_type} · Floor {room.floor_number}
                      </p>
                    </div>
                    <Badge className={cn("shrink-0 border", roomAvailabilityClassName(state))}>
                      {state}
                    </Badge>
                  </div>

                  {canManage ? (
                    <div className="mt-3 space-y-1.5 rounded-lg border border-[#eef1f5] bg-[#f8fafc] px-3 py-2.5">
                      <p className="text-[13px] font-semibold text-[#1a1a1a]">
                        {guestName || "Guest details"}
                      </p>
                      {guestPhone ? (
                        <p className="text-[13px] text-[#667085]">{guestPhone}</p>
                      ) : null}
                      {guestEmail ? (
                        <p className="text-[12px] text-[#98a2b3]">{guestEmail}</p>
                      ) : null}
                      {checkInLabel || checkOutLabel ? (
                        <p className="text-[12px] text-[#667085]">
                          Stay: {checkInLabel || "—"} – {checkOutLabel || "—"}
                          {(nights ?? 0) > 0
                            ? ` · ${nights} night${nights === 1 ? "" : "s"}`
                            : ""}
                        </p>
                      ) : null}
                      {bookingRef ? (
                        <p className="text-[12px] text-[#98a2b3]">Ref {bookingRef}</p>
                      ) : null}
                    </div>
                  ) : null}

                  {canManage ? (
                    <div className="mt-3 space-y-2">
                      {onStatusChange ? (
                        <Select
                          value={room.status || "available"}
                          onValueChange={(status) => onStatusChange(room, status)}
                          disabled={isBusy}
                        >
                          <SelectTrigger className={org.selectTrigger}>
                            <SelectValue placeholder="Room status" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROOM_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}

                      <div className="flex flex-col gap-2">
                        {onViewDetails ? (
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(org.btnOutline, "h-9 w-full")}
                            disabled={isBusy}
                            onClick={() => onViewDetails(room)}
                          >
                            {isBusy ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="mr-1.5 h-4 w-4" />
                            )}
                            View customer details
                          </Button>
                        ) : null}
                        <div className="flex gap-2">
                          {onCheckout ? (
                            <Button
                              type="button"
                              className={cn(org.btnPrimary, "h-9 w-full")}
                              disabled={isBusy}
                              onClick={() => onCheckout(room)}
                            >
                              Checkout — room available
                            </Button>
                          ) : null}
                          {onMarkClean ? (
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(org.btnOutline, "h-9 w-full")}
                              disabled={isBusy}
                              onClick={() => onMarkClean(room)}
                            >
                              Mark clean
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-[12px] text-[#98a2b3]">
          Reserved and occupied rooms show guest details for the selected date. Full board also
          available under{" "}
          <Link
            to="/organization/hospitality?section=room-status"
            className="font-medium text-[#2a5af5] hover:underline"
          >
            Hospitality → Room status
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default OrganizationCalendarRoomsView;
