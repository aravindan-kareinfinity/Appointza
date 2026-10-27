import {
  RAZORPAY_PACKAGES,
  type RazorpayPackageId,
} from '../billing/razorpayPackages';

/** Single source of truth for Napz plan: free, paid subscription, or lifetime. */
export type NapzSubscriptionTier = 'free' | 'premium' | 'lifetime';

export const FREE_TRIAL_PLAN_ID = 'napz_free_trial_10_days';

export const DEFAULT_SUBSCRIPTION_TIER: NapzSubscriptionTier = 'free';

export const SUBSCRIPTION_TIER_LABELS: Record<NapzSubscriptionTier, string> = {
  free: 'Free',
  premium: 'Napz Premium',
  lifetime: 'Lifetime Premium',
};

/** Human-readable active plan, e.g. "10 days free trial" or "10 days". */
export function activePlanLabel(
  productId: string | null | undefined,
  tier: NapzSubscriptionTier
): string {
  if (tier === 'free') return SUBSCRIPTION_TIER_LABELS.free;
  if (productId === FREE_TRIAL_PLAN_ID) return '10 days free trial';
  if (productId && Object.prototype.hasOwnProperty.call(RAZORPAY_PACKAGES, productId)) {
    return RAZORPAY_PACKAGES[productId as RazorpayPackageId].name;
  }
  return SUBSCRIPTION_TIER_LABELS[tier];
}

const TIER_RANK: Record<NapzSubscriptionTier, number> = {
  free: 0,
  premium: 1,
  lifetime: 2,
};

export function normalizeSubscriptionTier(
  raw: unknown,
  legacyPremium?: unknown
): NapzSubscriptionTier {
  if (raw === 'free' || raw === 'premium' || raw === 'lifetime') {
    return raw;
  }
  if (legacyPremium === true) {
    return 'premium';
  }
  return DEFAULT_SUBSCRIPTION_TIER;
}

/** Never downgrade when merging local + cloud (e.g. lifetime must win over free). */
export function mergeSubscriptionTier(
  ...tiers: NapzSubscriptionTier[]
): NapzSubscriptionTier {
  return tiers.reduce(
    (best, tier) => (TIER_RANK[tier] > TIER_RANK[best] ? tier : best),
    DEFAULT_SUBSCRIPTION_TIER
  );
}

/** Premium + lifetime unlock paid features (maps, no ads, unlimited — when gated). */
export function hasPremiumAccess(tier: NapzSubscriptionTier): boolean {
  return tier === 'premium' || tier === 'lifetime';
}

export function isLifetimeTier(tier: NapzSubscriptionTier): boolean {
  return tier === 'lifetime';
}
