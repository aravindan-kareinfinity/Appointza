import type { NapzSubscriptionTier } from '../subscription/subscriptionTier';

export type EntitlementStatus =
  | 'active'
  | 'canceled'
  | 'grace_period'
  | 'on_hold'
  | 'paused'
  | 'expired'
  | 'revoked'
  | 'free';

/** Server-written document at users/{uid}/entitlement/current */
export type NapzEntitlement = {
  premium: boolean;
  tier: NapzSubscriptionTier;
  productId: string | null;
  planId?: string | null;
  billingPeriod?: 'trial' | 'daily' | 'monthly' | 'six_months' | 'yearly' | 'lifetime' | 'none' | null;
  billingPeriodMonths?: number | null;
  startTime?: string | null;
  status: EntitlementStatus;
  subscriptionStatus?: string | null;
  expiresAt: string | null;
  isLifetime: boolean;
  autoRenewing: boolean;
  renewalStatus?: 'NONE' | 'AUTO_RENEWING' | 'CANCELED' | 'EXPIRED' | null;
  lastVerifiedAt: string | null;
  freeTrialUsed?: boolean;
};

export const FREE_ENTITLEMENT: NapzEntitlement = {
  premium: false,
  tier: 'free',
  productId: null,
  status: 'free',
  expiresAt: null,
  isLifetime: false,
  autoRenewing: false,
  lastVerifiedAt: null,
  freeTrialUsed: false,
};
