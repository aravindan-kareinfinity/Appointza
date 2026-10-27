export const ANDROID_PACKAGE = 'com.wakemethere';

/** Appointza Payment API used by the Napz app for Razorpay Checkout. */
export const APPOINTZA_PAYMENT_API = {
  baseUrl: 'https://appointza.com',
  organizationId: 1,
  organisationLocationId: 1,
};

export const PLAY_PRODUCTS = {
  PREMIUM_DAILY: 'napz_premium_daily',
  PREMIUM_MONTHLY: 'napz_premium_monthly',
  PREMIUM_YEARLY: 'napz_premium_yearly',
  PREMIUM_LIFETIME: 'napz_premium_lifetime',
} as const;

export const PLAY_SUBSCRIPTION_PRODUCTS = [
  PLAY_PRODUCTS.PREMIUM_MONTHLY,
  PLAY_PRODUCTS.PREMIUM_YEARLY,
] as const;

export const PLAY_ONE_TIME_PRODUCTS = [
  PLAY_PRODUCTS.PREMIUM_DAILY,
  PLAY_PRODUCTS.PREMIUM_LIFETIME,
] as const;

export function isPlayLifetimeProduct(productId: string): boolean {
  return productId === PLAY_PRODUCTS.PREMIUM_LIFETIME;
}

export function isPlaySubscriptionProduct(productId: string): boolean {
  return (PLAY_SUBSCRIPTION_PRODUCTS as readonly string[]).includes(productId);
}

export type RazorpayPackageId =
  | 'napz_daily'
  | 'napz_10_days'
  | 'napz_monthly'
  | 'napz_six_months'
  | 'napz_yearly'
  | 'napz_lifetime';

export const RAZORPAY_PACKAGES: Record<
  RazorpayPackageId,
  { name: string; amount: number; months: number | null; days: number | null; lifetime: boolean }
> = {
  napz_daily: { name: '1 Day Premium', amount: 900, months: null, days: 1, lifetime: false },
  napz_10_days: { name: '10-Day Premium', amount: 2900, months: null, days: 10, lifetime: false },
  napz_monthly: { name: '1 Month Premium', amount: 4900, months: 1, days: null, lifetime: false },
  napz_six_months: { name: '6-Month Premium', amount: 19900, months: 6, days: null, lifetime: false },
  napz_yearly: { name: '1 Year Premium', amount: 39900, months: 12, days: null, lifetime: false },
  napz_lifetime: { name: 'Lifetime Premium', amount: 399900, months: null, days: null, lifetime: true },
};

export type BillingPeriod = 'trial' | 'daily' | 'monthly' | 'six_months' | 'yearly' | 'lifetime' | 'none';
export type RenewalStatus = 'NONE' | 'AUTO_RENEWING' | 'CANCELED' | 'EXPIRED';

export function billingMetaForPlan(planId: string | null | undefined): {
  planId: string | null;
  planName: string | null;
  billingPeriod: BillingPeriod;
  billingPeriodMonths: number | null;
} {
  if (!planId) {
    return { planId: null, planName: null, billingPeriod: 'none', billingPeriodMonths: null };
  }
  if (planId === 'napz_free_trial_10_days') {
    return { planId, planName: 'Napz 10-Day Free Trial', billingPeriod: 'trial', billingPeriodMonths: null };
  }
  if (Object.prototype.hasOwnProperty.call(RAZORPAY_PACKAGES, planId)) {
    const selected = RAZORPAY_PACKAGES[planId as RazorpayPackageId];
    const billingPeriod: BillingPeriod = selected.lifetime
      ? 'lifetime'
      : selected.days
        ? 'daily'
        : selected.months === 1
          ? 'monthly'
          : selected.months === 6
            ? 'six_months'
            : 'yearly';
    return {
      planId,
      planName: selected.name,
      billingPeriod,
      billingPeriodMonths: selected.months,
    };
  }
  if (planId.includes('daily') || planId.includes('oneday') || planId.includes('one_day')) {
    return { planId, planName: planId, billingPeriod: 'daily', billingPeriodMonths: null };
  }
  if (planId.includes('monthly')) {
    return { planId, planName: planId, billingPeriod: 'monthly', billingPeriodMonths: 1 };
  }
  if (planId.includes('6month') || planId.includes('six')) {
    return { planId, planName: planId, billingPeriod: 'six_months', billingPeriodMonths: 6 };
  }
  if (planId.includes('lifetime')) {
    return { planId, planName: planId, billingPeriod: 'lifetime', billingPeriodMonths: null };
  }
  if (planId.includes('yearly')) {
    return { planId, planName: planId, billingPeriod: 'yearly', billingPeriodMonths: 12 };
  }
  return { planId, planName: planId, billingPeriod: 'none', billingPeriodMonths: null };
}

export type NapzTier = 'free' | 'premium' | 'lifetime';

export type EntitlementStatus =
  | 'active'
  | 'canceled'
  | 'grace_period'
  | 'on_hold'
  | 'paused'
  | 'expired'
  | 'revoked'
  | 'free';

export type NapzEntitlement = {
  premium: boolean;
  tier: NapzTier;
  productId: string | null;
  startTime: string | null;
  purchaseToken: string | null;
  orderId: string | null;
  status: EntitlementStatus;
  expiresAt: string | null;
  isLifetime: boolean;
  autoRenewing: boolean;
  gracePeriodUntil: string | null;
  accountHoldUntil: string | null;
  canceledAt: string | null;
  revokedAt: string | null;
  lastVerifiedAt: string;
  source?: 'play_verify' | 'razorpay' | 'free_trial' | 'combined' | 'free';
};

export const FREE_ENTITLEMENT: NapzEntitlement = {
  premium: false,
  tier: 'free',
  productId: null,
  startTime: null,
  purchaseToken: null,
  orderId: null,
  status: 'free',
  expiresAt: null,
  isLifetime: false,
  autoRenewing: false,
  gracePeriodUntil: null,
  accountHoldUntil: null,
  canceledAt: null,
  revokedAt: null,
  lastVerifiedAt: new Date().toISOString(),
  source: 'free',
};

const TIER_RANK: Record<NapzTier, number> = {
  free: 0,
  premium: 1,
  lifetime: 2,
};

export function mergeEntitlements(a: NapzEntitlement, b: NapzEntitlement): NapzEntitlement {
  return TIER_RANK[b.tier] > TIER_RANK[a.tier] ? b : a;
}
