import { Event } from "@/models/event.model";
import { compareDateOnly, formatEventDateOnly, todayDateOnlyString } from "@/utils/eventDate.util";

export type EventDateBucket = "past" | "today" | "future";

/** Normalize stored time to `HH:mm` for `<input type="time">`. */
export function toTimeInputValue(raw: string | undefined | null): string {
  if (!raw?.trim()) return "";
  const match = raw.trim().match(/(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function readTimingStartTime(timing?: Event.TimingConfigData): string {
  const tc = timing as { StartTime?: string; startTime?: string } | undefined;
  return toTimeInputValue(tc?.StartTime ?? tc?.startTime);
}

function readTimingEndTime(timing?: Event.TimingConfigData): string {
  const tc = timing as { EndTime?: string; endTime?: string } | undefined;
  return toTimeInputValue(tc?.EndTime ?? tc?.endTime);
}

export function readEventStartTime(ev: Event): string {
  return toTimeInputValue(ev.start_time) || readTimingStartTime(ev.timing_config);
}

export function readEventEndTime(ev: Event): string {
  return toTimeInputValue(ev.end_time) || readTimingEndTime(ev.timing_config);
}

export function parseTimeToMinutes(value: string): number | null {
  const normalized = toTimeInputValue(value);
  if (!normalized) return null;
  const [h, m] = normalized.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatTimeForDisplay(raw: string | undefined): string {
  const value = toTimeInputValue(raw);
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatEventTimeRange(ev: Event): string {
  const start = readEventStartTime(ev);
  const end = readEventEndTime(ev);
  if (!start && !end) return "";
  if (start && end) return `${formatTimeForDisplay(start)} – ${formatTimeForDisplay(end)}`;
  return formatTimeForDisplay(start || end);
}

/** Same date/location line pattern as `PublicBrowseEventsPage` for card consistency. */
export function formatOrganizationEventMetaLine(event: Event): string {
  const loc = event.location?.trim();
  let when = "";
  if (event.event_type === "single" && event.event_date) {
    when = formatEventDateOnly(event.event_date);
  } else if (event.event_type === "range" && event.from_date && event.to_date) {
    when = `${formatEventDateOnly(event.from_date)} – ${formatEventDateOnly(event.to_date)}`;
  } else if (event.event_type === "daily") {
    when = "Daily";
  }
  const timeRange = formatEventTimeRange(event);
  if (timeRange) {
    when = when ? `${when} • ${timeRange}` : timeRange;
  }
  return [when, loc].filter(Boolean).join(" • ");
}

export function getEventDateBucket(eventItem: Event, today: string = todayDateOnlyString()): EventDateBucket {
  if (eventItem.event_type === "range" && eventItem.from_date && eventItem.to_date) {
    if (compareDateOnly(eventItem.to_date, today) < 0) return "past";
    if (compareDateOnly(eventItem.from_date, today) > 0) return "future";
    return "today";
  }

  if (eventItem.event_type === "single" && eventItem.event_date) {
    const cmp = compareDateOnly(eventItem.event_date, today);
    if (cmp < 0) return "past";
    if (cmp > 0) return "future";
    return "today";
  }

  return "today";
}

export function eventWhenBadge(bucket: EventDateBucket): { label: string; className: string } {
  switch (bucket) {
    case "past":
      return { label: "Past", className: "bg-stone-100 text-stone-700 border border-stone-200" };
    case "today":
      return { label: "Today", className: "bg-sky-100 text-sky-800 border border-sky-200" };
    case "future":
      return { label: "Future", className: "bg-emerald-100 text-emerald-800 border border-emerald-200" };
  }
}
