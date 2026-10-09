import { describe, expect, it } from "vitest";
import type { Event } from "@/models/event.model";
import {
  formatOrganizationEventMetaLine,
  getEventDateBucket,
  parseTimeToMinutes,
  readEventStartTime,
  toTimeInputValue,
} from "@/utils/organizationEventDisplay.util";

const ev = (patch: Partial<Event>) => patch as Event;

describe("organizationEventDisplay", () => {
  it("normalises times for <input type=time>", () => {
    expect(toTimeInputValue("9:05")).toBe("09:05");
    expect(toTimeInputValue("18:30:00")).toBe("18:30");
    expect(toTimeInputValue("")).toBe("");
    expect(toTimeInputValue("nope")).toBe("");
  });

  it("parses times to minutes", () => {
    expect(parseTimeToMinutes("01:30")).toBe(90);
    expect(parseTimeToMinutes("")).toBeNull();
  });

  it("falls back to timing_config when start_time is empty", () => {
    expect(readEventStartTime(ev({ start_time: "", timing_config: { StartTime: "10:00" } as never }))).toBe("10:00");
  });

  it("buckets events relative to today", () => {
    const today = "2026-10-03";
    expect(getEventDateBucket(ev({ event_type: "single", event_date: "2026-10-01" }), today)).toBe("past");
    expect(getEventDateBucket(ev({ event_type: "single", event_date: "2026-10-03" }), today)).toBe("today");
    expect(getEventDateBucket(ev({ event_type: "single", event_date: "2026-10-09" }), today)).toBe("future");
    expect(
      getEventDateBucket(ev({ event_type: "range", from_date: "2026-10-01", to_date: "2026-10-05" }), today),
    ).toBe("today");
    expect(getEventDateBucket(ev({ event_type: "daily" }), today)).toBe("today");
  });

  it("builds the card meta line with proper separators", () => {
    expect(formatOrganizationEventMetaLine(ev({ event_type: "daily", location: "Chennai" }))).toBe(
      "Daily • Chennai",
    );
  });
});
