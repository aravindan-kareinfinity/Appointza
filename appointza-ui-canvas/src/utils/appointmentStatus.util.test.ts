import { describe, expect, it } from "vitest";
import {
  countAppointmentsByStatus,
  isUpcomingAppointmentStatus,
  normalizeAppointmentStatusCode,
  toAppointmentStatusBucket,
} from "@/utils/appointmentStatus.util";

describe("normalizeAppointmentStatusCode", () => {
  it("trims and uppercases status codes", () => {
    expect(normalizeAppointmentStatusCode("  confirmed ")).toBe("CONFIRMED");
    expect(normalizeAppointmentStatusCode("Pending")).toBe("PENDING");
    expect(normalizeAppointmentStatusCode("cancelled")).toBe("CANCELLED");
    expect(normalizeAppointmentStatusCode("COMPLETED")).toBe("COMPLETED");
  });

  it("treats nullish / blank as empty", () => {
    expect(normalizeAppointmentStatusCode(null)).toBe("");
    expect(normalizeAppointmentStatusCode(undefined)).toBe("");
    expect(normalizeAppointmentStatusCode("   ")).toBe("");
  });
});

describe("toAppointmentStatusBucket", () => {
  it("maps known statuses case-insensitively", () => {
    expect(toAppointmentStatusBucket("confirmed")).toBe("CONFIRMED");
    expect(toAppointmentStatusBucket(" CANCELLED ")).toBe("CANCELLED");
    expect(toAppointmentStatusBucket("Completed")).toBe("COMPLETED");
    expect(toAppointmentStatusBucket("pending")).toBe("PENDING");
  });

  it("maps blank and unknown statuses to PENDING", () => {
    expect(toAppointmentStatusBucket("")).toBe("PENDING");
    expect(toAppointmentStatusBucket(null)).toBe("PENDING");
    expect(toAppointmentStatusBucket("BOOKED")).toBe("PENDING");
  });
});

describe("countAppointmentsByStatus", () => {
  it("counts mixed-case statuses into the four buckets", () => {
    const counts = countAppointmentsByStatus([
      { statuscode: "confirmed" },
      { statuscode: " PENDING" },
      { statuscode: "Cancelled" },
      { statuscode: "completed" },
      { statuscode: "confirmed" },
    ]);
    expect(counts).toEqual({
      total: 5,
      confirmed: 2,
      pending: 1,
      cancelled: 1,
      completed: 1,
    });
  });

  it("counts blank statuses as pending without changing total", () => {
    const counts = countAppointmentsByStatus([
      { statuscode: "" },
      { statuscode: null },
      { statuscode: "confirmed" },
    ]);
    expect(counts.total).toBe(3);
    expect(counts.confirmed).toBe(1);
    expect(counts.pending).toBe(2);
    expect(counts.cancelled + counts.completed).toBe(0);
    expect(
      counts.confirmed + counts.pending + counts.cancelled + counts.completed,
    ).toBe(counts.total);
  });
});

describe("isUpcomingAppointmentStatus", () => {
  it("accepts confirmed, pending, and blank", () => {
    expect(isUpcomingAppointmentStatus("Confirmed")).toBe(true);
    expect(isUpcomingAppointmentStatus("pending")).toBe(true);
    expect(isUpcomingAppointmentStatus("")).toBe(true);
    expect(isUpcomingAppointmentStatus("CANCELLED")).toBe(false);
  });
});
