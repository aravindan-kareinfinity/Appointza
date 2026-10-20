import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BedDouble, Check, Loader2, Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import {
  GuestHospitalityBookingService,
  type HospitalityBookingQuote,
} from "@/services/guestHospitalityBooking.service";
import { formatRoomTypeLabel } from "@/utils/roomAmenities.util";
import { useToast } from "@/hooks/use-toast";
import type { HospitalityPackage } from "@/models/hospitality.model";

function todayIsoLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pickRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null) return String(val);
  }
  return "";
}

function pickNum(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== "") return Number(val);
  }
  return 0;
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function normalizeTime(value: string, fallback: string): string {
  const trimmed = (value || fallback).trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed.slice(0, 5);
  return fallback;
}

function normalizePackage(item: unknown): HospitalityPackage {
  const r = pickRecord(item);
  const includes = (r.includes as unknown[]) ?? [];
  const addOns = (r.add_ons as unknown[]) ?? r.addOns as unknown[] ?? [];
  return {
    id: pickStr(r, "id"),
    name: pickStr(r, "name"),
    price: pickStr(r, "price"),
    description: pickStr(r, "description"),
    badge: pickStr(r, "badge") || undefined,
    kind: pickStr(r, "kind") || "stay",
    is_active: r.is_active !== false && r.isActive !== false,
    sort_order: pickNum(r, "sort_order", "sortOrder"),
    image_url: pickStr(r, "image_url", "imageUrl"),
    includes: includes.map(String),
    add_ons: addOns.map(String),
    valid_from: pickStr(r, "valid_from", "validFrom"),
    valid_to: pickStr(r, "valid_to", "validTo"),
    minimum_nights: pickNum(r, "minimum_nights", "minimumNights") || 1,
    max_guests: pickNum(r, "max_guests", "maxGuests") || 2,
    included_guests: pickNum(r, "included_guests", "includedGuests"),
    extra_guest_charge: pickNum(r, "extra_guest_charge", "extraGuestCharge"),
    room_type: pickStr(r, "room_type", "roomType"),
  };
}

type PublicRoom = {
  id: string;
  room_number: string;
  room_name: string;
  room_type: string;
  capacity?: { total_guests?: number; extra_beds_allowed?: number };
  pricing?: { price_per_night?: number; price_per_hour?: number };
};

const nativeSelectClass = cn(
  org.selectTrigger,
  "flex h-9 w-full appearance-none px-3 py-2",
);

const selectRowClass = (selected: boolean) =>
  cn(
    "flex w-full cursor-pointer items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors",
    selected
      ? "border-[#2a5af5] bg-[#eef2ff]"
      : "border-[#e6eaf0] bg-white hover:border-[#cfd6e0] hover:bg-[#f8fafc]",
  );

type ClientHospitalityBookingPanelProps = {
  organisationId: number;
  organisationLocationId: number;
  clientName: string;
  clientMobile: string;
  onSuccess: (bookingCode: string) => void;
};

export function ClientHospitalityBookingPanel({
  organisationId,
  organisationLocationId,
  clientName,
  clientMobile,
  onSuccess,
}: ClientHospitalityBookingPanelProps) {
  const bookingService = useMemo(() => new GuestHospitalityBookingService(), []);
  const { toast } = useToast();

  const scopeReady = organisationId > 0 && organisationLocationId > 0;

  const [roomId, setRoomId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [persons, setPersons] = useState(2);
  const [extraBeds, setExtraBeds] = useState(0);
  const [quote, setQuote] = useState<HospitalityBookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hydratedRef = useRef(false);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "client-hospitality-booking-index",
      organisationId,
      organisationLocationId,
      selectedPackageId,
      checkIn,
      checkOut,
    ],
    enabled: scopeReady,
    queryFn: () =>
      bookingService.index({
        organisationId,
        organisationLocationId,
        packageId: selectedPackageId || undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        checkInTime,
        checkOutTime,
      }),
  });

  const page = useMemo(() => pickRecord(data), [data]);
  const organisation = useMemo(() => pickRecord(page.organisation), [page.organisation]);
  const isHourlyBooking =
    pickStr(organisation, "booking_type", "bookingType").toLowerCase() === "hourly";

  const rooms = useMemo(() => {
    const raw = (page.rooms as unknown[]) ?? [];
    return raw.map((item) => {
      const r = pickRecord(item);
      const cap = pickRecord(r.capacity);
      const pricing = pickRecord(r.pricing);
      return {
        id: pickStr(r, "id"),
        room_number: pickStr(r, "room_number", "roomNumber"),
        room_name: pickStr(r, "room_name", "roomName"),
        room_type: pickStr(r, "room_type", "roomType"),
        capacity: {
          total_guests: pickNum(cap, "total_guests", "totalGuests") || 2,
          extra_beds_allowed: pickNum(cap, "extra_beds_allowed", "extraBedsAllowed"),
        },
        pricing: {
          price_per_night: pickNum(pricing, "price_per_night", "pricePerNight"),
          price_per_hour: pickNum(pricing, "price_per_hour", "pricePerHour"),
        },
      } satisfies PublicRoom;
    });
  }, [page.rooms]);

  const packages = useMemo(() => {
    const raw = (page.packages as unknown[]) ?? [];
    return raw
      .map(normalizePackage)
      .filter((p) => p.is_active && p.kind.toLowerCase() !== "addon")
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [page.packages]);

  const selectedRoom = rooms.find((r) => r.id === roomId) ?? null;
  const selectedPackage = packages.find((p) => p.id === selectedPackageId) ?? null;
  const minBookingDate = todayIsoLocal();
  const minCheckOutDate = checkIn && checkIn >= minBookingDate ? checkIn : minBookingDate;

  useEffect(() => {
    if (isLoading || hydratedRef.current) return;
    hydratedRef.current = true;

    const policyCheckIn = normalizeTime(
      pickStr(organisation, "check_in_time", "checkInTime"),
      "14:00",
    );
    const policyCheckOut = normalizeTime(
      pickStr(organisation, "check_out_time", "checkOutTime"),
      "11:00",
    );
    const defaultCheckIn = pickStr(page, "check_in", "checkIn") || minBookingDate;
    const defaultCheckOut =
      pickStr(page, "check_out", "checkOut") ||
      (() => {
        const d = new Date(defaultCheckIn);
        d.setDate(d.getDate() + 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })();

    setCheckIn(defaultCheckIn);
    setCheckOut(defaultCheckOut);
    setCheckInTime(policyCheckIn);
    setCheckOutTime(policyCheckOut);
    if (rooms.length === 1) setRoomId(rooms[0].id);
  }, [isLoading, organisation, page, rooms, minBookingDate]);

  const refreshQuote = useCallback(async () => {
    if (!scopeReady || !checkIn || !checkOut || !roomId) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const result = await bookingService.quote({
        organisationId,
        organisationLocationId,
        checkIn,
        checkOut,
        roomId,
        persons,
        extraBeds,
        packageIds: selectedPackageId ? [selectedPackageId] : [],
        checkInTime,
        checkOutTime,
      });
      setQuote(result);
    } catch (err) {
      setQuote(null);
      setQuoteError(err instanceof Error ? err.message : "Could not calculate price.");
    } finally {
      setQuoteLoading(false);
    }
  }, [
    scopeReady,
    checkIn,
    checkOut,
    selectedPackageId,
    roomId,
    bookingService,
    organisationId,
    organisationLocationId,
    persons,
    extraBeds,
    checkInTime,
    checkOutTime,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshQuote();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [refreshQuote]);

  const handleSubmit = async () => {
    if (!roomId) {
      toast({
        title: "Select a room",
        description: "Choose a room before confirming.",
        variant: "destructive",
      });
      return;
    }
    if (!clientName.trim() || !clientMobile.trim()) {
      toast({
        title: "Client details missing",
        description: "Client name and phone are required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await bookingService.create({
        organisation_id: organisationId,
        organisation_location_id: organisationLocationId,
        room_id: roomId,
        guest_name: clientName.trim(),
        phone: clientMobile.trim(),
        check_in: checkIn,
        check_out: checkOut,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        persons,
        extra_beds: extraBeds,
        package_ids: selectedPackageId ? [selectedPackageId] : [],
        guest_service_ids: [],
      });

      if (!result?.booking_code) throw new Error("Booking failed.");

      toast({
        title: selectedPackageId ? "Stay booked" : "Room booked",
        description: `Reference ${result.booking_code}`,
      });
      onSuccess(result.booking_code);
    } catch (err) {
      toast({
        title: "Booking failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!scopeReady) {
    return (
      <p className="py-8 text-center text-[13px] text-[#5b6572]">
        Select an organization location to book rooms or packages.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-[#5b6572]">
        <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
        Loading rooms…
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-8 text-center text-[13px] text-destructive">
        Could not load rooms and packages. Check hospitality settings.
      </p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_min(18rem,36%)] lg:gap-0">
      <div className="space-y-4 lg:border-r lg:border-[#e6eaf0] lg:pr-4">
        {packages.length > 0 ? (
          <section>
            <p className={cn(org.label, "mb-1.5")}>Package</p>
            <div className="grid gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedPackageId("")}
                className={selectRowClass(!selectedPackageId)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#1a1a1a]">Room only</p>
                  <p className="text-[12px] text-[#5b6572]">No package</p>
                </div>
                {!selectedPackageId ? (
                  <Check className="h-4 w-4 shrink-0 text-[#2a5af5]" aria-hidden />
                ) : null}
              </button>
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <button
                    key={pkg.id || pkg.name}
                    type="button"
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={selectRowClass(isSelected)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[#1a1a1a]">{pkg.name}</p>
                      <p className="text-[12px] text-[#5b6572]">
                        {pkg.price}
                        {pkg.minimum_nights > 1 ? ` · min ${pkg.minimum_nights} nights` : ""}
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
        ) : null}

        <section className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className={org.label}>Room</p>
            {selectedPackage?.room_type ? (
              <span className="truncate text-[11px] text-[#5b6572]">
                {formatRoomTypeLabel(selectedPackage.room_type)}
              </span>
            ) : null}
          </div>
          {rooms.length === 0 ? (
            <p className="py-3 text-center text-[12px] text-[#5b6572]">No rooms for these dates</p>
          ) : (
            <>
              <select
                className={nativeSelectClass}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              >
                <option value="">Select a room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room {room.room_number}
                    {room.room_name ? ` — ${room.room_name}` : ""} (
                    {formatRoomTypeLabel(room.room_type)})
                  </option>
                ))}
              </select>
              {selectedRoom ? (
                <p className="text-[12px] text-[#5b6572]">
                  Up to {selectedRoom.capacity?.total_guests ?? 2} guests
                  {selectedRoom.pricing?.price_per_night
                    ? ` · ${formatInr(selectedRoom.pricing.price_per_night)}/night`
                    : null}
                </p>
              ) : null}
            </>
          )}
        </section>

        <section className="space-y-2">
          <p className={org.label}>{isHourlyBooking ? "Date & time" : "Stay dates"}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className={org.label}>{isHourlyBooking ? "Start" : "Check-in"}</Label>
              <Input
                type="date"
                min={minBookingDate}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className={cn(org.input, "h-9")}
              />
            </div>
            <div className="space-y-1">
              <Label className={org.label}>{isHourlyBooking ? "End" : "Check-out"}</Label>
              <Input
                type="date"
                min={minCheckOutDate}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className={cn(org.input, "h-9")}
              />
            </div>
            <div className="space-y-1">
              <Label className={org.label}>In time</Label>
              <Input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className={cn(org.input, "h-9")}
              />
            </div>
            <div className="space-y-1">
              <Label className={org.label}>Out time</Label>
              <Input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className={cn(org.input, "h-9")}
              />
            </div>
          </div>
        </section>

        <section className="space-y-1.5">
          <p className={org.label}>Guests</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-md border border-[#e6eaf0] px-2.5 py-1.5">
              <Users className="h-3.5 w-3.5 text-[#5b6572]" aria-hidden />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPersons(Math.max(1, persons - 1))}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-6 text-center text-[13px] font-medium tabular-nums">{persons}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPersons(persons + 1)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {(selectedRoom?.capacity?.extra_beds_allowed ?? 0) > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-md border border-[#e6eaf0] px-2.5 py-1.5">
                <span className="text-[12px] text-[#5b6572]">Extra beds</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setExtraBeds(Math.max(0, extraBeds - 1))}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-6 text-center text-[13px] font-medium tabular-nums">{extraBeds}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    setExtraBeds(
                      Math.min(selectedRoom?.capacity?.extra_beds_allowed ?? 0, extraBeds + 1),
                    )
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-3 lg:pl-4">
        <p className={org.label}>Summary</p>
        <div className="rounded-md border border-[#e6eaf0] bg-[#f8fafc] p-3 text-[13px]">
          {quoteLoading ? (
            <div className="flex items-center gap-2 text-[#5b6572]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2a5af5]" /> Calculating…
            </div>
          ) : quoteError ? (
            <p className="text-destructive">{quoteError}</p>
          ) : quote ? (
            <div className="space-y-1.5">
              {quote.duration_label ? (
                <p className="text-[12px] text-[#5b6572]">{quote.duration_label}</p>
              ) : null}
              {(quote.room_total ?? 0) > 0 ? (
                <div className="flex justify-between gap-2">
                  <span className="text-[#5b6572]">Room</span>
                  <span className="tabular-nums">{formatInr(quote.room_total ?? 0)}</span>
                </div>
              ) : null}
              {(quote.extra_bed_total ?? 0) > 0 ? (
                <div className="flex justify-between gap-2">
                  <span className="text-[#5b6572]">Extra beds</span>
                  <span className="tabular-nums">{formatInr(quote.extra_bed_total ?? 0)}</span>
                </div>
              ) : null}
              {(quote.packages_total ?? 0) > 0 ? (
                <div className="flex justify-between gap-2">
                  <span className="text-[#5b6572]">Package</span>
                  <span className="tabular-nums">{formatInr(quote.packages_total ?? 0)}</span>
                </div>
              ) : null}
              {(quote.extra_guest_total ?? 0) > 0 ? (
                <div className="flex justify-between gap-2">
                  <span className="text-[#5b6572]">Extra guests</span>
                  <span className="tabular-nums">{formatInr(quote.extra_guest_total ?? 0)}</span>
                </div>
              ) : null}
              <div className="flex justify-between gap-2 border-t border-[#e6eaf0] pt-2 font-semibold text-[#1a1a1a]">
                <span>Total</span>
                <span className="tabular-nums">{formatInr(quote.total ?? 0)}</span>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-[#5b6572]">Select a room and dates for pricing.</p>
          )}
        </div>

        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting || quoteLoading || !quote || !roomId || rooms.length === 0}
          className={cn(org.btnPrimary, "mt-auto h-9 w-full")}
        >
          {submitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Booking…
            </>
          ) : (
            <>
              <BedDouble className="h-3.5 w-3.5" />
              Confirm booking
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
