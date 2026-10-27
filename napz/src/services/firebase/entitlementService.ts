import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { napzFunctions } from './functionsClient';
import {
  FREE_ENTITLEMENT,
  type NapzEntitlement,
} from '../../entitlement/entitlementTypes';
import {
  entitlementNeedsServerVerify,
  hasLocalEntitlementSnapshot,
  readCachedEntitlement,
  writeCachedEntitlement,
} from '../../entitlement/entitlementStorage';
import { isPremium } from '../../entitlement/PremiumGate';
import type { NapzSubscriptionTier } from '../../subscription/subscriptionTier';

type ClientEntitlementPayload = {
  premium?: boolean;
  tier?: NapzSubscriptionTier;
  productId?: string | null;
  planId?: string | null;
  billingPeriod?: NapzEntitlement['billingPeriod'];
  billingPeriodMonths?: number | null;
  startTime?: string | null;
  status?: NapzEntitlement['status'];
  subscriptionStatus?: string | null;
  expiresAt?: string | null;
  isLifetime?: boolean;
  autoRenewing?: boolean;
  renewalStatus?: NapzEntitlement['renewalStatus'];
  lastVerifiedAt?: string | null;
};

function parseEntitlement(data: ClientEntitlementPayload | undefined): NapzEntitlement {
  if (!data) return FREE_ENTITLEMENT;

  let tier: NapzSubscriptionTier =
    data.tier === 'lifetime' || data.tier === 'premium' || data.tier === 'free'
      ? data.tier
      : data.premium === true
        ? 'premium'
        : 'free';

  // Never infer paid access from tier alone — only explicit premium from server.
  if (data.premium !== true) {
    tier = 'free';
  }

  const parsed: NapzEntitlement = {
    premium: data.premium === true,
    tier,
    productId: data.productId ?? data.planId ?? null,
    planId: data.planId ?? data.productId ?? null,
    billingPeriod: data.billingPeriod ?? null,
    billingPeriodMonths: data.billingPeriodMonths ?? null,
    startTime: data.startTime ?? null,
    status: data.status ?? (data.premium === true ? 'active' : 'free'),
    subscriptionStatus: data.subscriptionStatus ?? null,
    expiresAt: data.expiresAt ?? null,
    isLifetime: data.premium === true && (data.isLifetime === true || tier === 'lifetime'),
    autoRenewing: data.autoRenewing === true,
    renewalStatus: data.renewalStatus ?? (data.autoRenewing === true ? 'AUTO_RENEWING' : 'NONE'),
    lastVerifiedAt: data.lastVerifiedAt ?? null,
    freeTrialUsed:
      data.productId === 'napz_free_trial_10_days' || data.planId === 'napz_free_trial_10_days',
  };

  return normalizeClientEntitlement(parsed);
}

function normalizeClientEntitlement(raw: NapzEntitlement): NapzEntitlement {
  const premium = isPremium(raw);
  return {
    ...raw,
    premium,
    tier: premium ? tierFromEntitlement(raw) : 'free',
    freeTrialUsed: raw.freeTrialUsed === true,
  };
}

function entitlementPath(uid: string): string {
  return `users/${uid}/entitlement/current`;
}

function parseUserRootPremium(data: Record<string, unknown> | undefined): NapzEntitlement | null {
  if (!data) return null;
  const productId =
    (data.planId as string | null) ?? (data.premiumProductId as string | null) ?? null;
  const premiumStatus = String(
    data.subscriptionStatus ?? data.premiumStatus ?? (data.premium === true ? 'ACTIVE' : 'FREE')
  );
  const statusMap: Record<string, NapzEntitlement['status']> = {
    ACTIVE: 'active',
    CANCELED: 'canceled',
    GRACE: 'grace_period',
    EXPIRED: 'expired',
    REVOKED: 'revoked',
    ON_HOLD: 'on_hold',
    PAUSED: 'paused',
    FREE: 'free',
  };
  const isLifetime =
    productId === 'napz_premium_lifetime' || productId === 'napz_lifetime';
  return normalizeClientEntitlement({
    premium: data.premium === true,
    tier: data.premium === true ? (isLifetime ? 'lifetime' : 'premium') : 'free',
    productId,
    planId: productId,
    billingPeriod: (data.billingPeriod as NapzEntitlement['billingPeriod']) ?? null,
    billingPeriodMonths: (data.billingPeriodMonths as number | null) ?? null,
    startTime: (data.packageStartDate as string | null) ?? null,
    status: statusMap[premiumStatus] ?? (data.premium === true ? 'active' : 'free'),
    subscriptionStatus: (data.subscriptionStatus as string | null) ?? premiumStatus,
    expiresAt:
      (data.premiumExpiresAt as string | null) ?? (data.expiryTime as string | null) ?? null,
    isLifetime,
    autoRenewing: data.autoRenewing === true,
    renewalStatus: (data.renewalStatus as NapzEntitlement['renewalStatus']) ?? 'NONE',
    lastVerifiedAt: null,
    freeTrialUsed:
      data.freeTrialUsed === true ||
      String(data.freeTrialStatus ?? '') === 'NOT_ELIGIBLE' ||
      String(data.freeTrialStatus ?? '') === 'EXPIRED' ||
      String(data.freeTrialStatus ?? '') === 'ACTIVE' ||
      String(data.freeTrialStatus ?? '') === 'CONVERTED' ||
      productId === 'napz_free_trial_10_days',
  });
}

function mergeRazorpayOrderFields(
  entitlement: NapzEntitlement,
  order: Record<string, unknown> | undefined
): NapzEntitlement {
  if (!order) return entitlement;
  const productId =
    String(order.productId ?? order.planId ?? entitlement.productId ?? '') || null;
  const subscriptionStatus =
    String(order.subscriptionStatus ?? order.status ?? entitlement.subscriptionStatus ?? '') ||
    entitlement.subscriptionStatus;
  return {
    ...entitlement,
    productId: productId || entitlement.productId,
    planId: String(order.planId ?? productId ?? entitlement.planId ?? '') || entitlement.planId,
    subscriptionStatus,
  };
}

export async function fetchEntitlementFromFirestore(): Promise<NapzEntitlement> {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    return readCachedEntitlement();
  }
  try {
    const userSnap = await firestore().doc(`users/${uid}`).get();
    const userData = userSnap.data() as Record<string, unknown> | undefined;
    let entitlement =
      parseUserRootPremium(userData) ??
      parseEntitlement(
        (await firestore().doc(entitlementPath(uid)).get()).data() as
          | ClientEntitlementPayload
          | undefined
      );

    const currentSub = await firestore().doc(`users/${uid}/subscriptions/current`).get();
    entitlement = mergeRazorpayOrderFields(
      entitlement,
      currentSub.data() as Record<string, unknown> | undefined
    );

    const orderId = String(userData?.lastRazorpayOrderId ?? '');
    if (orderId.startsWith('order_')) {
      const userOrder = await firestore().doc(`users/${uid}/subscriptions/${orderId}`).get();
      entitlement = mergeRazorpayOrderFields(
        entitlement,
        userOrder.data() as Record<string, unknown> | undefined
      );
    }

    const trialSnap = await firestore().doc(`users/${uid}/trials/free_10_day`).get();
    entitlement = {
      ...entitlement,
      freeTrialUsed:
        entitlement.freeTrialUsed === true ||
        trialSnap.exists ||
        userData?.freeTrialUsed === true,
    };

    entitlement.lastVerifiedAt = new Date().toISOString();
    await writeCachedEntitlement(entitlement);
    return entitlement;
  } catch {
    return readCachedEntitlement();
  }
}

export async function refreshEntitlementOnServer(): Promise<NapzEntitlement> {
  const callable = napzFunctions().httpsCallable('refreshEntitlement');
  const result = await callable({});
  const entitlement = parseEntitlement(result.data as ClientEntitlementPayload);
  await writeCachedEntitlement(entitlement);
  return entitlement;
}

export async function startFreeTrialOnServer(): Promise<NapzEntitlement> {
  const callable = napzFunctions().httpsCallable('startFreeTrial');
  const result = await callable({});
  const entitlement = {
    ...parseEntitlement(result.data as ClientEntitlementPayload),
    freeTrialUsed: true,
  };
  await writeCachedEntitlement(entitlement);
  return entitlement;
}

export function tierFromEntitlement(entitlement: NapzEntitlement): NapzSubscriptionTier {
  if (entitlement.premium && entitlement.tier !== 'free') {
    return entitlement.tier;
  }
  if (entitlement.premium) {
    return entitlement.isLifetime ? 'lifetime' : 'premium';
  }
  return 'free';
}

export async function loadEntitlement(options?: {
  refreshFromServer?: boolean;
}): Promise<NapzEntitlement> {
  const cached = await readCachedEntitlement();
  if (options?.refreshFromServer) {
    return fetchEntitlementFromFirestore();
  }
  if (hasLocalEntitlementSnapshot(cached) && !entitlementNeedsServerVerify(cached)) {
    return cached;
  }
  return fetchEntitlementFromFirestore();
}
