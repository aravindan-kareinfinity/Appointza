import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  OrganisationRoom,
  OrganisationRoomStatusBoardRes,
  ROOM_STATUSES,
  statusClassName,
  statusLabel,
} from "@/models/hospitality.model";
import { hospitalityService } from "@/services/hospitality.service";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

type RoomStatusPanelProps = {
  locationId: number;
  locationName?: string;
  selectedRoomId?: number;
  onEditRoom?: (roomId: number) => void;
};

export function RoomStatusPanel({
  locationId,
  locationName,
  selectedRoomId,
  onEditRoom,
}: RoomStatusPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const organisationId = user?.organisationid ?? 0;

  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<OrganisationRoomStatusBoardRes | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<OrganisationRoom | null>(null);
  const [busy, setBusy] = useState(false);

  const loadBoard = useCallback(async () => {
    if (organisationId <= 0 || locationId <= 0) {
      setBoard(null);
      setSelectedRoom(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await hospitalityService.getStatusBoard({
        organisation_id: organisationId,
        organisation_location_id: locationId,
        room_id: selectedRoomId,
      });
      setBoard(data);
      setSelectedRoom(data?.selected_room ?? null);
    } catch (error) {
      toast({
        title: "Could not load room status",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [locationId, organisationId, selectedRoomId, toast]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const runAction = async (action: () => Promise<boolean>, successMessage: string) => {
    setBusy(true);
    try {
      const ok = await action();
      if (!ok) throw new Error("Action failed");
      toast({ title: successMessage });
      await loadBoard();
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = (room: OrganisationRoom, status: string) =>
    void runAction(
      () =>
        hospitalityService.updateRoomStatus({
          id: room.id,
          organisation_id: organisationId,
          status,
        }),
      `Room ${room.room_number} updated.`,
    );

  if (organisationId <= 0) {
    return <p className="text-[13px] text-[#667085]">Sign in with an organisation account.</p>;
  }

  if (locationId <= 0) {
    return (
      <div className="rounded-lg border border-[#e6eaf0] bg-white px-4 py-12 text-center">
        <MapPin className="mx-auto mb-3 h-9 w-9 text-[#d0d5dd]" />
        <p className="text-[13px] text-[#667085]">
          Select a business location above to view room status for that property.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-[13px] text-[#667085]">
        <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
        Loading status board…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {locationName ? (
        <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-[#667085]">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#2a5af5]" />
          Status for <span className="font-medium text-[#1a1a1a]">{locationName}</span>
          {board?.as_of ? <span className="text-[#98a2b3]">· {board.as_of}</span> : null}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(board?.status_summary ?? []).map((item) => (
          <span
            key={item.value}
            className={cn(
              "inline-flex items-center rounded-md border border-[#e6eaf0] bg-white px-2.5 py-1 text-[12px] font-medium",
              statusClassName(item.value),
            )}
          >
            {item.label}: {item.count}
          </span>
        ))}
      </div>

      {(board?.floors ?? []).map((floor) => (
        <div key={floor.floor_number} className="space-y-2.5">
          <h2 className="text-[14px] font-semibold text-[#1a1a1a]">{floor.label}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {floor.rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoom(room)}
                className={cn(
                  "rounded-lg border border-[#e6eaf0] bg-white p-3.5 text-left shadow-none transition-colors hover:border-[#cfd8f0] hover:bg-[#fafbff]",
                  selectedRoom?.id === room.id && "border-[#2a5af5] ring-1 ring-[#2a5af5]/30",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-semibold text-[#1a1a1a]">{room.room_number}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-transparent px-2 py-0.5 text-[11px] font-medium",
                      statusClassName(room.status),
                    )}
                  >
                    {statusLabel(room.status)}
                  </Badge>
                </div>
                {room.room_name ? (
                  <p className="mt-1 text-[12px] text-[#667085]">{room.room_name}</p>
                ) : null}
                <p className="mt-2 text-[12px] text-[#667085]">
                  {room.guest?.name ? (
                    <>
                      Guest: <span className="font-medium text-[#344054]">{room.guest.name}</span>
                    </>
                  ) : (
                    <span className="text-[#98a2b3]">No guest assigned</span>
                  )}
                </p>
              </button>
            ))}
          </div>
        </div>
      ))}

      {selectedRoom ? (
        <div className="rounded-lg border border-[#e6eaf0] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#eef2ff] text-[#2a5af5]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-[#1a1a1a]">
                Room {selectedRoom.room_number}
              </h3>
              {selectedRoom.room_name ? (
                <p className="text-[12px] text-[#667085]">{selectedRoom.room_name}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2.5">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa3b2]">
                Set status
              </p>
              <Select
                value={selectedRoom.status}
                onValueChange={(status) => updateStatus(selectedRoom, status)}
                disabled={busy}
              >
                <SelectTrigger className={cn(org.selectTrigger, "w-[200px]")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              disabled={busy}
              className={org.btnOutline}
              onClick={() => onEditRoom?.(selectedRoom.id)}
            >
              Edit room
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              className={org.btnOutline}
              onClick={() =>
                void runAction(
                  () =>
                    hospitalityService.checkoutRoom({
                      id: selectedRoom.id,
                      organisation_id: organisationId,
                    }),
                  "Room is available now.",
                )
              }
            >
              Checkout — available
            </Button>
            <Button
              disabled={busy}
              className={org.btnPrimary}
              onClick={() =>
                void runAction(
                  () =>
                    hospitalityService.markRoomClean({
                      id: selectedRoom.id,
                      organisation_id: organisationId,
                    }),
                  "Room marked clean and available.",
                )
              }
            >
              Mark clean
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
