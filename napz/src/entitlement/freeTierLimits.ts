/** Free-tier caps (client UX). Authority for Premium vs Free is Firestore entitlement, not this file. */
export const FREE_TIER_LIMITS = {
  MAX_SAVED_PLACES: 5,
  /** Destination alarms stay free — no weekly trip cap. */
  MAX_TRIPS_PER_ROLLING_WEEK: Number.POSITIVE_INFINITY,
  MIN_RADIUS_METERS: 500,
  MAX_RADIUS_METERS: 2000,
  PREMIUM_MIN_RADIUS_METERS: 50,
  PREMIUM_MAX_RADIUS_METERS: 5000,
  /** Free users: Classic + Gentle only. */
  FREE_SOUND_IDS: ['classic', 'gentle'] as const,
} as const;
