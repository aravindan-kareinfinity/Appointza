/** Canonical appointment status codes shown on the user dashboard. */
export type AppointmentStatusBucket =
  | "CONFIRMED"
  | "PENDING"
  | "CANCELLED"
  | "COMPLETED";

/**
 * Normalize API statuscode for comparisons (trim + uppercase).
 * Empty / whitespace-only values become "".
 */
export function normalizeAppointmentStatusCode(
  statuscode: string | null | undefined,
): string {
  return String(statuscode ?? "").trim().toUpperCase();
}

/**
 * Map a raw API status into one of the four dashboard buckets.
 * Matches org dashboard logic: anything that is not confirmed / completed /
 * cancelled (including blank status on new bookings) counts as pending.
 */
export function toAppointmentStatusBucket(
  statuscode: string | null | undefined,
): AppointmentStatusBucket {
  const code = normalizeAppointmentStatusCode(statuscode);
  switch (code) {
    case "CONFIRMED":
      return "CONFIRMED";
    case "CANCELLED":
      return "CANCELLED";
    case "COMPLETED":
      return "COMPLETED";
    case "PENDING":
    default:
      return "PENDING";
  }
}

export type AppointmentStatusCounts = {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
};

/**
 * Count appointments by status. `total` is always `appointments.length`
 * and equals the sum of the four bucket counts.
 */
export function countAppointmentsByStatus(
  appointments: Array<{ statuscode?: string | null }>,
): AppointmentStatusCounts {
  const counts: AppointmentStatusCounts = {
    total: appointments.length,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    completed: 0,
  };

  for (const appointment of appointments) {
    switch (toAppointmentStatusBucket(appointment.statuscode)) {
      case "CONFIRMED":
        counts.confirmed += 1;
        break;
      case "CANCELLED":
        counts.cancelled += 1;
        break;
      case "COMPLETED":
        counts.completed += 1;
        break;
      case "PENDING":
      default:
        counts.pending += 1;
        break;
    }
  }

  return counts;
}

/** Upcoming list: confirmed or pending (case-insensitive; blank → pending). */
export function isUpcomingAppointmentStatus(
  statuscode: string | null | undefined,
): boolean {
  const bucket = toAppointmentStatusBucket(statuscode);
  return bucket === "CONFIRMED" || bucket === "PENDING";
}
