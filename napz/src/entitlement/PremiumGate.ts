/**
 * Client-side access control — reads NapzEntitlement from Firestore (via SubscriptionTierContext).
 *
 * Flow: Razorpay payment → Cloud Functions webhook → Firestore users/{uid}.premium* → PremiumGate → UI limits
 *
 * PremiumGate and freeTierLimits are app logic only; they are NOT stored in Firestore.
 */
import type { NapzEntitlement } from './entitlementTypes';
import { FREE_TIER_LIMITS } from './freeTierLimits';

/** Maps server status to Play-style label for UI / Firestore premiumStatus. */
export function premiumStatusLabel(
  entitlement: NapzEntitlement
): 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'GRACE' | 'FREE' | 'REVOKED' {
  if (entitlement.status === 'revoked') return 'REVOKED';
  if (entitlement.status === 'free' || entitlement.tier === 'free') return 'FREE';
  if (entitlement.status === 'grace_period') return 'GRACE';
  if (entitlement.status === 'canceled') return 'CANCELED';
  if (entitlement.status === 'expired') return 'EXPIRED';
  if (entitlement.status === 'active') return 'ACTIVE';
  return entitlement.premium ? 'ACTIVE' : 'FREE';
}

/**
 * Central Premium access check — use everywhere (ads, maps, limits).
 * CANCELED still grants access until expiryTime (server sets premium=true until then).
 */
export function isPremium(entitlement: NapzEntitlement): boolean {
  if (entitlement.status === 'revoked') return false;
  if (entitlement.status === 'on_hold' || entitlement.status === 'paused') return false;
  if (entitlement.status === 'expired') return false;

  if (entitlement.isLifetime && entitlement.tier === 'lifetime') {
    return entitlement.premium === true;
  }

  if (!entitlement.premium) return false;

  if (entitlement.expiresAt) {
    return Date.parse(entitlement.expiresAt) > Date.now();
  }

  return (
    entitlement.status === 'active' ||
    entitlement.status === 'canceled' ||
    entitlement.status === 'grace_period'
  );
}

export function shouldShowAds(entitlement: NapzEntitlement): boolean {
  return !isPremium(entitlement);
}

export function canUsePremiumMaps(entitlement: NapzEntitlement): boolean {
  return isPremium(entitlement);
}

/** Free: basic OSM search. Premium: Google / more results. */
export function searchResultLimit(entitlement: NapzEntitlement): number {
  return isPremium(entitlement) ? 8 : 3;
}

export function getRadiusBounds(entitlement: NapzEntitlement): {
  min: number;
  max: number;
} {
  if (isPremium(entitlement)) {
    return {
      min: FREE_TIER_LIMITS.PREMIUM_MIN_RADIUS_METERS,
      max: FREE_TIER_LIMITS.PREMIUM_MAX_RADIUS_METERS,
    };
  }
  return {
    min: FREE_TIER_LIMITS.MIN_RADIUS_METERS,
    max: FREE_TIER_LIMITS.MAX_RADIUS_METERS,
  };
}

export function clampRadiusForEntitlement(
  entitlement: NapzEntitlement,
  meters: number
): number {
  const { min, max } = getRadiusBounds(entitlement);
  return Math.min(Math.max(Math.round(meters), min), max);
}

export function canUseCloudBackup(entitlement: NapzEntitlement): boolean {
  return isPremium(entitlement);
}

/** Cloud/local saved-place cap for the active plan. */
export function maxSavedPlaces(entitlement: NapzEntitlement): number {
  if (!isPremium(entitlement)) return FREE_TIER_LIMITS.MAX_SAVED_PLACES;
  if (entitlement.isLifetime) return 500;
  const id = entitlement.productId ?? entitlement.planId ?? '';
  if (id === 'napz_yearly' || id.includes('yearly')) return 200;
  if (id === 'napz_monthly' || id.includes('monthly') || id.includes('six')) return 50;
  return 10;
}

export function canAddSavedPlace(
  entitlement: NapzEntitlement,
  currentCount: number
): boolean {
  return currentCount < maxSavedPlaces(entitlement);
}

type PlaceWithCreatedAt = { createdAt?: string };

/** After Premium ends, still keep extra places in storage/cloud — only show the plan cap. */
export function visibleSavedPlaces<T extends PlaceWithCreatedAt>(
  places: T[],
  entitlement: NapzEntitlement
): T[] {
  const max = maxSavedPlaces(entitlement);
  return [...places]
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    .slice(0, max);
}

export function hiddenSavedPlaceCount(
  totalCount: number,
  entitlement: NapzEntitlement
): number {
  return Math.max(0, totalCount - maxSavedPlaces(entitlement));
}

export function canUseCustomSound(entitlement: NapzEntitlement): boolean {
  return isPremium(entitlement);
}

export function canUseBuiltInSound(
  entitlement: NapzEntitlement,
  soundId: string
): boolean {
  if (soundId === 'custom') return canUseCustomSound(entitlement);
  if (isPremium(entitlement)) return true;
  return (FREE_TIER_LIMITS.FREE_SOUND_IDS as readonly string[]).includes(soundId);
}

export function resolveAllowedAlarmSound(
  entitlement: NapzEntitlement,
  soundKey: string
): string {
  if (canUseBuiltInSound(entitlement, soundKey)) return soundKey;
  return FREE_TIER_LIMITS.FREE_SOUND_IDS[0];
}

export function canStartNewTrip(
  _entitlement: NapzEntitlement,
  _tripsStartedThisWeek: number
): boolean {
  return true;
}

export function freeTripLimitRemaining(
  _entitlement: NapzEntitlement,
  _tripsStartedThisWeek: number
): number | null {
  return null;
}
