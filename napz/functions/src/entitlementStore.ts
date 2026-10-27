import * as admin from 'firebase-admin';
import {
  billingMetaForPlan,
  FREE_ENTITLEMENT,
  NapzEntitlement,
  RAZORPAY_PACKAGES,
  RazorpayPackageId,
  RenewalStatus,
} from './constants';
import { purchaseTokenDocId } from './playVerify';

const db = () => admin.firestore();

export function entitlementRef(uid: string) {
  return db().doc(`users/${uid}/entitlement/current`);
}

function sourceEntitlementRef(uid: string, source: 'play_verify' | 'razorpay' | 'free_trial') {
  return db().doc(`users/${uid}/entitlementSources/${source}`);
}

function mapPremiumStatus(status: NapzEntitlement['status']): string {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'canceled':
      return 'CANCELED';
    case 'grace_period':
      return 'GRACE';
    case 'expired':
      return 'EXPIRED';
    case 'revoked':
      return 'REVOKED';
    case 'on_hold':
      return 'ON_HOLD';
    case 'paused':
      return 'PAUSED';
    default:
      return 'FREE';
  }
}

async function readLegacyEntitlement(uid: string): Promise<NapzEntitlement> {
  const userSnap = await db().doc(`users/${uid}`).get();
  const userData = userSnap.data();
  if (userData && typeof userData.premium === 'boolean') {
    return {
      premium: userData.premium === true,
      tier: userData.premium === true
        ? userData.premiumProductId === 'napz_premium_lifetime' ||
          userData.premiumProductId === 'napz_lifetime'
          ? 'lifetime'
          : 'premium'
        : 'free',
      productId: (userData.premiumProductId as string | null) ?? null,
      startTime: (userData.packageStartDate as string | null) ?? null,
      purchaseToken: null,
      orderId: null,
      status:
        userData.premiumStatus === 'CANCELED'
          ? 'canceled'
          : userData.premiumStatus === 'GRACE'
            ? 'grace_period'
            : userData.premium === true
              ? 'active'
              : 'free',
      expiresAt: (userData.premiumExpiresAt as string | null) ?? null,
      isLifetime:
        userData.premiumProductId === 'napz_premium_lifetime' ||
        userData.premiumProductId === 'napz_lifetime',
      autoRenewing: false,
      gracePeriodUntil: null,
      accountHoldUntil: null,
      canceledAt: null,
      revokedAt: null,
      lastVerifiedAt: new Date().toISOString(),
      source: 'play_verify',
    };
  }

  const snap = await entitlementRef(uid).get();
  if (!snap.exists) return FREE_ENTITLEMENT;
  return snap.data() as NapzEntitlement;
}

function entitlementIsActive(entitlement: NapzEntitlement, now = Date.now()): boolean {
  if (!entitlement.premium || entitlement.status === 'revoked' ||
      entitlement.status === 'expired' || entitlement.status === 'on_hold' ||
      entitlement.status === 'paused') return false;
  if (entitlement.isLifetime && entitlement.tier === 'lifetime') return true;
  if (entitlement.expiresAt) return Date.parse(entitlement.expiresAt) > now;
  return entitlement.status === 'active' || entitlement.status === 'canceled' ||
    entitlement.status === 'grace_period';
}

function combineEntitlements(entitlements: NapzEntitlement[]): NapzEntitlement {
  const active = entitlements.filter((item) => entitlementIsActive(item));
  if (active.length === 0) return FREE_ENTITLEMENT;

  const lifetime = active.find((item) => item.isLifetime && item.tier === 'lifetime');
  const chosen = lifetime ?? active.reduce((latest, item) => {
    const latestEnd = latest.expiresAt ? Date.parse(latest.expiresAt) : Number.POSITIVE_INFINITY;
    const itemEnd = item.expiresAt ? Date.parse(item.expiresAt) : Number.POSITIVE_INFINITY;
    return itemEnd > latestEnd ? item : latest;
  });
  const sources = new Set(active.map((item) => item.source).filter((source) => source !== 'combined'));
  return {
    ...chosen,
    premium: true,
    status: 'active',
    source: sources.size > 1 ? 'combined' : chosen.source,
    lastVerifiedAt: new Date().toISOString(),
  };
}

async function readSourceEntitlements(uid: string): Promise<NapzEntitlement[]> {
  const [play, razorpay, freeTrial] = await Promise.all([
    sourceEntitlementRef(uid, 'play_verify').get(),
    sourceEntitlementRef(uid, 'razorpay').get(),
    sourceEntitlementRef(uid, 'free_trial').get(),
  ]);
  return [play, razorpay]
    .concat(freeTrial)
    .filter((snap) => snap.exists)
    .map((snap) => snap.data() as NapzEntitlement);
}

export async function readEntitlement(uid: string): Promise<NapzEntitlement> {
  const sources = await readSourceEntitlements(uid);
  if (sources.length) return combineEntitlements(sources);
  return readLegacyEntitlement(uid);
}

function renewalStatusFor(entitlement: NapzEntitlement): RenewalStatus {
  if (entitlement.isLifetime) return 'NONE';
  if (!entitlement.premium) return 'EXPIRED';
  if (entitlement.autoRenewing) return 'AUTO_RENEWING';
  if (entitlement.status === 'canceled') return 'CANCELED';
  if (entitlement.status === 'expired') return 'EXPIRED';
  return 'NONE';
}

export function userSubscriptionSummary(
  entitlement: NapzEntitlement,
  payment?: {
    paymentId?: string | null;
    paymentLinkId?: string | null;
    orderId?: string | null;
    amount?: number | null;
  }
) {
  const billing = billingMetaForPlan(entitlement.productId);
  const status = mapPremiumStatus(entitlement.status);
  const summary: Record<string, unknown> = {
    premium: entitlement.premium,
    premiumStatus: status,
    subscriptionStatus: status,
    planId: billing.planId,
    planName: billing.planName,
    premiumProductId: entitlement.productId,
    billingPeriod: billing.billingPeriod,
    billingPeriodMonths: billing.billingPeriodMonths,
    premiumExpiresAt: entitlement.expiresAt,
    expiryTime: entitlement.expiresAt,
    packageName: entitlement.productId,
    packageStartDate: entitlement.startTime,
    packageEndDate: entitlement.expiresAt,
    autoRenewing: entitlement.autoRenewing === true,
    renewalStatus: renewalStatusFor(entitlement),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (payment) {
    summary.lastPaymentId = payment.paymentId ?? entitlement.orderId ?? null;
    summary.lastPaymentLinkId = payment.paymentLinkId ?? null;
    summary.lastOrderId = payment.orderId ?? null;
    summary.lastPaymentAmount = payment.amount ?? null;
    summary.lastPaymentCurrency = payment.amount != null ? 'INR' : null;
    summary.lastPaidAt = admin.firestore.FieldValue.serverTimestamp();
  }
  return summary;
}

function subscriptionDocument(
  entitlement: NapzEntitlement,
  extras: Record<string, unknown>
) {
  const billing = billingMetaForPlan(entitlement.productId);
  return {
    status: mapPremiumStatus(entitlement.status),
    isPremium: entitlement.premium,
    planId: billing.planId,
    planName: billing.planName,
    productId: entitlement.productId,
    billingPeriod: billing.billingPeriod,
    billingPeriodMonths: billing.billingPeriodMonths,
    startTime: entitlement.startTime,
    expiryTime: entitlement.expiresAt,
    autoRenewing: entitlement.autoRenewing === true,
    renewalStatus: renewalStatusFor(entitlement),
    isLifetime: entitlement.isLifetime,
    provider: entitlement.source ?? 'razorpay',
    lastVerifiedAt: entitlement.lastVerifiedAt,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...extras,
  };
}

async function writeUserPremiumSummary(
  uid: string,
  entitlement: NapzEntitlement,
  payment?: {
    paymentId?: string | null;
    paymentLinkId?: string | null;
    orderId?: string | null;
    amount?: number | null;
  }
): Promise<void> {
  await db()
    .doc(`users/${uid}`)
    .set(userSubscriptionSummary(entitlement, payment), { merge: true });
}

async function writeSubscriptionRecord(uid: string, entitlement: NapzEntitlement): Promise<void> {
  if (!entitlement.purchaseToken || !entitlement.productId) return;

  const subId = purchaseTokenDocId(entitlement.purchaseToken);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const record = subscriptionDocument(entitlement, {
    purchaseToken: entitlement.purchaseToken,
    paymentId: entitlement.orderId,
    createdAt: now,
  });

  await db().doc(`users/${uid}/subscriptions/${subId}`).set(record, { merge: true });
  await db().doc(`users/${uid}/subscriptions/current`).set(record, { merge: true });

  await db()
    .doc(`users/${uid}/purchases/${subId}`)
    .set(
      {
        productId: entitlement.productId,
        planId: entitlement.productId,
        purchaseToken: entitlement.purchaseToken,
        paymentId: entitlement.orderId,
        verifiedAt: now,
        status: entitlement.status,
        subscriptionStatus: mapPremiumStatus(entitlement.status),
        billingPeriod: billingMetaForPlan(entitlement.productId).billingPeriod,
        expiryTime: entitlement.expiresAt,
        renewalStatus: renewalStatusFor(entitlement),
        tier: entitlement.tier,
      },
      { merge: true }
    );
}

export async function writePendingRazorpayCheckout(params: {
  uid: string;
  paymentLinkId: string;
  productId: string;
  amount: number;
  orderId?: string | null;
}): Promise<void> {
  const billing = billingMetaForPlan(params.productId);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const checkoutId = params.orderId || params.paymentLinkId;
  const pending = {
    status: 'PENDING',
    subscriptionStatus: 'PENDING',
    isPremium: false,
    planId: billing.planId,
    planName: billing.planName,
    productId: params.productId,
    billingPeriod: billing.billingPeriod,
    billingPeriodMonths: billing.billingPeriodMonths,
    startTime: null,
    expiryTime: null,
    autoRenewing: false,
    renewalStatus: 'NONE' as const,
    isLifetime: billing.billingPeriod === 'lifetime',
    provider: 'razorpay',
    paymentLinkId: params.paymentLinkId,
    orderId: params.orderId ?? null,
    paymentId: null,
    amount: params.amount,
    currency: 'INR',
    createdAt: now,
    updatedAt: now,
  };
  await db().doc(`users/${params.uid}/subscriptions/${checkoutId}`).set(pending, { merge: true });
  await db().doc(`users/${params.uid}/payments/${checkoutId}`).set(
    {
      paymentLinkId: params.paymentLinkId,
      orderId: params.orderId ?? null,
      paymentId: null,
      productId: params.productId,
      planId: billing.planId,
      billingPeriod: billing.billingPeriod,
      amount: params.amount,
      currency: 'INR',
      status: 'created',
      renewalStatus: 'NONE',
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );
}

export async function writeEntitlement(uid: string, entitlement: NapzEntitlement): Promise<void> {
  const billing = billingMetaForPlan(entitlement.productId);
  await entitlementRef(uid).set(
    {
      ...entitlement,
      planId: billing.planId,
      planName: billing.planName,
      billingPeriod: billing.billingPeriod,
      billingPeriodMonths: billing.billingPeriodMonths,
      subscriptionStatus: mapPremiumStatus(entitlement.status),
      renewalStatus: renewalStatusFor(entitlement),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await writeUserPremiumSummary(uid, entitlement);
}

/** Grant one 10-day trial to a Firebase UID, with eligibility and writes enforced server-side. */
export async function startFreeTrialEntitlement(uid: string): Promise<NapzEntitlement> {
  const database = db();
  const userRef = database.doc(`users/${uid}`);
  const trialRef = database.doc(`users/${uid}/trials/free_10_day`);
  const trialSourceRef = sourceEntitlementRef(uid, 'free_trial');
  const playRef = sourceEntitlementRef(uid, 'play_verify');
  const razorpayRef = sourceEntitlementRef(uid, 'razorpay');
  const currentRef = entitlementRef(uid);

  await database.runTransaction(async (transaction) => {
    const [trialSnap, userSnap, playSnap, razorpaySnap, currentSnap] = await Promise.all([
      transaction.get(trialRef),
      transaction.get(userRef),
      transaction.get(playRef),
      transaction.get(razorpayRef),
      transaction.get(currentRef),
    ]);
    if (trialSnap.exists) return;

    const userData = userSnap.data();
    const existingSources: NapzEntitlement[] = [];
    if (playSnap.exists) existingSources.push(playSnap.data() as NapzEntitlement);
    if (razorpaySnap.exists) existingSources.push(razorpaySnap.data() as NapzEntitlement);
    const legacy = existingSources.length === 0
      ? (currentSnap.exists
        ? currentSnap.data() as NapzEntitlement
        : entitlementFromUserSummary(userData))
      : null;
    if (legacy?.premium) existingSources.push(legacy);

    // Existing paid accounts do not receive a trial after a previous plan ends.
    const hadPaidPlan = playSnap.exists || razorpaySnap.exists || Boolean(
      typeof userData?.premiumProductId === 'string' &&
      userData.premiumProductId !== 'napz_free_trial_10_days'
    );
    const existing = combineEntitlements(existingSources);
    const now = new Date();
    const usedAt = admin.firestore.Timestamp.fromDate(now);
    if (hadPaidPlan || existing.premium) {
      transaction.create(trialRef, {
        used: true,
        granted: false,
        reason: 'existing_paid_plan',
        usedAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      transaction.set(userRef, {
        freeTrialUsed: true,
        freeTrialStatus: 'NOT_ELIGIBLE',
        freeTrialUsedAt: usedAt,
      }, { merge: true });
      return;
    }

    const expiresAt = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const trial: NapzEntitlement = {
      premium: true,
      tier: 'premium',
      productId: 'napz_free_trial_10_days',
      startTime: now.toISOString(),
      purchaseToken: null,
      orderId: null,
      status: 'active',
      expiresAt,
      isLifetime: false,
      autoRenewing: false,
      gracePeriodUntil: null,
      accountHoldUntil: null,
      canceledAt: null,
      revokedAt: null,
      lastVerifiedAt: now.toISOString(),
      source: 'free_trial',
    };
    const billing = billingMetaForPlan(trial.productId);
    const trialEnd = admin.firestore.Timestamp.fromDate(new Date(expiresAt));
    const nowServer = admin.firestore.FieldValue.serverTimestamp();
    transaction.create(trialRef, {
      used: true,
      granted: true,
      planId: trial.productId,
      planName: billing.planName,
      startTime: usedAt,
      expiryTime: trialEnd,
      autoRenewing: false,
      createdAt: nowServer,
    });
    transaction.set(trialSourceRef, trial);
    transaction.set(currentRef, {
      ...trial,
      planId: billing.planId,
      planName: billing.planName,
      billingPeriod: billing.billingPeriod,
      billingPeriodMonths: billing.billingPeriodMonths,
      subscriptionStatus: 'ACTIVE',
      renewalStatus: 'NONE',
      updatedAt: nowServer,
    }, { merge: true });
    const summary = userSubscriptionSummary(trial);
    transaction.set(userRef, {
      ...summary,
      freeTrialUsed: true,
      freeTrialStatus: 'ACTIVE',
      freeTrialUsedAt: usedAt,
      freeTrialEndsAt: trialEnd,
    }, { merge: true });
    const trialSubscription = subscriptionDocument(trial, {
      trial: true,
      trialDays: 10,
      createdAt: nowServer,
    });
    transaction.set(database.doc(`users/${uid}/subscriptions/trial_10_day`), trialSubscription);
    transaction.set(database.doc(`users/${uid}/subscriptions/current`), trialSubscription, { merge: true });
  });

  const entitlement = await readEntitlement(uid);
  const trialSnap = await trialRef.get();
  const trialData = trialSnap.data();
  if (trialData?.granted === true && trialData.expiryTime instanceof admin.firestore.Timestamp &&
      trialData.expiryTime.toMillis() <= Date.now()) {
    await trialRef.set({ status: 'EXPIRED', expiredAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    await userRef.set({ freeTrialStatus: 'EXPIRED' }, { merge: true });
  }
  await writeEntitlement(uid, entitlement);
  return entitlement;
}

export async function applyVerifiedEntitlement(
  uid: string,
  verified: NapzEntitlement
): Promise<NapzEntitlement> {
  await sourceEntitlementRef(uid, 'play_verify').set(
    { ...verified, source: 'play_verify' },
    { merge: true }
  );
  const sources = await readSourceEntitlements(uid);
  const merged = combineEntitlements(sources);
  await writeEntitlement(uid, merged);
  await writeSubscriptionRecord(uid, verified);
  return merged;
}

export type VerifiedRazorpayPayment = {
  eventId: string;
  paymentId: string;
  amount: number;
  checkoutId: string;
  sourceCollection: 'razorpayPaymentLinks' | 'razorpayOrders';
};

function entitlementFromUserSummary(data: Record<string, unknown> | undefined): NapzEntitlement | null {
  if (!data || data.premium !== true) return null;
  const productId = typeof data.premiumProductId === 'string' ? data.premiumProductId : null;
  const isLifetime = productId === 'napz_premium_lifetime' || productId === 'napz_lifetime';
  return {
    premium: true,
    tier: isLifetime ? 'lifetime' : 'premium',
    productId,
    startTime: (data.packageStartDate as string | null) ?? null,
    purchaseToken: null,
    orderId: null,
    status: data.premiumStatus === 'CANCELED' ? 'canceled' : 'active',
    expiresAt: (data.premiumExpiresAt as string | null) ?? null,
    isLifetime,
    autoRenewing: false,
    gracePeriodUntil: null,
    accountHoldUntil: null,
    canceledAt: null,
    revokedAt: null,
    lastVerifiedAt: new Date().toISOString(),
    source: 'play_verify',
  };
}

function addUtcMonths(start: Date, months: number): Date {
  const result = new Date(start);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

function addUtcDays(start: Date, days: number): Date {
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

function packageExpiryIso(
  start: Date,
  selectedPackage: (typeof RAZORPAY_PACKAGES)[RazorpayPackageId]
): string | null {
  if (selectedPackage.lifetime) return null;
  if (selectedPackage.days) return addUtcDays(start, selectedPackage.days).toISOString();
  if (selectedPackage.months) return addUtcMonths(start, selectedPackage.months).toISOString();
  return null;
}

export async function applyVerifiedRazorpayPayment(
  payment: VerifiedRazorpayPayment
): Promise<'applied' | 'duplicate'> {
  const database = db();
  const eventRef = database.doc(`razorpayWebhookEvents/${payment.eventId}`);
  const linkRef = database.doc(`${payment.sourceCollection}/${payment.checkoutId}`);

  return database.runTransaction(async (transaction) => {
    const [eventSnap, linkSnap] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(linkRef),
    ]);
    if (eventSnap.exists) return 'duplicate';
    if (!linkSnap.exists) throw new Error('No matching Napz checkout record.');

    const link = linkSnap.data() ?? {};
    const uid = String(link.uid ?? '');
    const productId = String(link.productId ?? '');
    const amount = Number(link.amount);
    if (!uid || !productId || amount !== payment.amount || link.status === 'paid') {
      transaction.create(eventRef, {
        processed: false,
        reason: link.status === 'paid' ? 'checkout-already-processed' : 'payment-mismatch',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return 'duplicate';
    }

    const userRef = database.doc(`users/${uid}`);
    const currentRef = entitlementRef(uid);
    const playRef = sourceEntitlementRef(uid, 'play_verify');
    const razorpayRef = sourceEntitlementRef(uid, 'razorpay');
    const freeTrialRef = sourceEntitlementRef(uid, 'free_trial');
    const paymentRef = database.doc(`users/${uid}/payments/${payment.checkoutId}`);
    const [userSnap, currentSnap, playSnap, razorpaySnap, freeTrialSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(currentRef),
      transaction.get(playRef),
      transaction.get(razorpayRef),
      transaction.get(freeTrialRef),
    ]);

    const existingSources: NapzEntitlement[] = [];
    if (playSnap.exists) existingSources.push(playSnap.data() as NapzEntitlement);
    if (razorpaySnap.exists) existingSources.push(razorpaySnap.data() as NapzEntitlement);
    if (freeTrialSnap.exists) existingSources.push(freeTrialSnap.data() as NapzEntitlement);
    if (existingSources.length === 0) {
      const legacy = currentSnap.exists
        ? (currentSnap.data() as NapzEntitlement)
        : entitlementFromUserSummary(userSnap.data());
      if (legacy?.premium) existingSources.push({ ...legacy, source: 'play_verify' });
    }

    const existing = combineEntitlements(existingSources);
    const packageId = productId as RazorpayPackageId;
    const selectedPackage = RAZORPAY_PACKAGES[packageId];
    if (!selectedPackage || selectedPackage.amount !== amount) {
      throw new Error('Checkout package does not match the server catalog.');
    }

    const now = new Date();
    const start = existing.premium && !existing.isLifetime && existing.expiresAt &&
        Date.parse(existing.expiresAt) > now.getTime()
      ? new Date(existing.expiresAt)
      : now;
    const end = packageExpiryIso(start, selectedPackage);
    const razorpayEntitlement: NapzEntitlement = {
      premium: true,
      tier: selectedPackage.lifetime ? 'lifetime' : 'premium',
      productId,
      startTime: start.toISOString(),
      purchaseToken: null,
      orderId: payment.checkoutId.startsWith('order_') ? payment.checkoutId : payment.paymentId,
      status: 'active',
      expiresAt: end,
      isLifetime: selectedPackage.lifetime,
      autoRenewing: false,
      gracePeriodUntil: null,
      accountHoldUntil: null,
      canceledAt: null,
      revokedAt: null,
      lastVerifiedAt: now.toISOString(),
      source: 'razorpay',
    };
    const merged = combineEntitlements([
      ...existingSources.filter((item) => item.source === 'play_verify' || item.source === 'free_trial'),
      razorpayEntitlement,
    ]);
    const nowServer = admin.firestore.FieldValue.serverTimestamp();

    const billing = billingMetaForPlan(merged.productId);
    const subRecord = subscriptionDocument(razorpayEntitlement, {
      paymentId: payment.paymentId,
      paymentLinkId: payment.sourceCollection === 'razorpayPaymentLinks' ? payment.checkoutId : null,
      orderId: payment.sourceCollection === 'razorpayOrders' ? payment.checkoutId : null,
      amount,
      currency: 'INR',
    });
    const subscriptionRef = database.doc(`users/${uid}/subscriptions/${payment.checkoutId}`);
    const currentSubRef = database.doc(`users/${uid}/subscriptions/current`);

    transaction.set(razorpayRef, razorpayEntitlement, { merge: true });
    transaction.set(
      currentRef,
      {
        ...merged,
        planId: billing.planId,
        planName: billing.planName,
        billingPeriod: billing.billingPeriod,
        billingPeriodMonths: billing.billingPeriodMonths,
        subscriptionStatus: mapPremiumStatus(merged.status),
        renewalStatus: renewalStatusFor(merged),
        lastPaymentId: payment.paymentId,
        lastPaymentLinkId:
          payment.sourceCollection === 'razorpayPaymentLinks' ? payment.checkoutId : null,
        lastOrderId: payment.sourceCollection === 'razorpayOrders' ? payment.checkoutId : null,
        updatedAt: nowServer,
      },
      { merge: true }
    );
    transaction.set(
      userRef,
      {
        ...userSubscriptionSummary(merged, {
          paymentId: payment.paymentId,
          paymentLinkId:
            payment.sourceCollection === 'razorpayPaymentLinks' ? payment.checkoutId : null,
          orderId: payment.sourceCollection === 'razorpayOrders' ? payment.checkoutId : null,
          amount,
        }),
        ...(freeTrialSnap.exists ? { freeTrialStatus: 'CONVERTED' } : {}),
      },
      { merge: true }
    );
    if (freeTrialSnap.exists) {
      transaction.set(database.doc(`users/${uid}/trials/free_10_day`), {
        status: 'CONVERTED',
        convertedAt: nowServer,
      }, { merge: true });
    }
    transaction.set(subscriptionRef, subRecord, { merge: true });
    transaction.set(currentSubRef, subRecord, { merge: true });
    transaction.set(
      paymentRef,
      {
        paymentLinkId:
          payment.sourceCollection === 'razorpayPaymentLinks' ? payment.checkoutId : null,
        orderId: payment.sourceCollection === 'razorpayOrders' ? payment.checkoutId : null,
        paymentId: payment.paymentId,
        productId,
        planId: productId,
        billingPeriod: billingMetaForPlan(productId).billingPeriod,
        amount,
        currency: 'INR',
        status: 'paid',
        subscriptionStatus: mapPremiumStatus(merged.status),
        renewalStatus: renewalStatusFor(merged),
        expiryTime: merged.expiresAt,
        paidAt: nowServer,
        updatedAt: nowServer,
      },
      { merge: true }
    );
    transaction.update(linkRef, {
      status: 'paid',
      paymentId: payment.paymentId,
      subscriptionStatus: mapPremiumStatus(merged.status),
      planId: productId,
      billingPeriod: billingMetaForPlan(productId).billingPeriod,
      expiryTime: merged.expiresAt,
      renewalStatus: renewalStatusFor(merged),
      paidAt: nowServer,
    });
    transaction.create(eventRef, {
      processed: true,
      uid,
      checkoutId: payment.checkoutId,
      paymentId: payment.paymentId,
      createdAt: nowServer,
    });

    return 'applied';
  });
}

export async function findUidByPurchaseToken(purchaseToken: string): Promise<string | null> {
  const snap = await db()
    .collectionGroup('subscriptions')
    .where('purchaseToken', '==', purchaseToken)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const path = snap.docs[0].ref.path;
  const match = path.match(/^users\/([^/]+)\/subscriptions\//);
  return match?.[1] ?? null;
}

export function entitlementForClient(entitlement: NapzEntitlement) {
  const billing = billingMetaForPlan(entitlement.productId);
  return {
    premium: entitlement.premium,
    tier: entitlement.tier,
    productId: entitlement.productId,
    planId: billing.planId,
    planName: billing.planName,
    billingPeriod: billing.billingPeriod,
    billingPeriodMonths: billing.billingPeriodMonths,
    startTime: entitlement.startTime,
    status: entitlement.status,
    premiumStatus: mapPremiumStatus(entitlement.status),
    subscriptionStatus: mapPremiumStatus(entitlement.status),
    expiresAt: entitlement.expiresAt,
    expiryTime: entitlement.expiresAt,
    isLifetime: entitlement.isLifetime,
    autoRenewing: entitlement.autoRenewing === true,
    renewalStatus: renewalStatusFor(entitlement),
    lastVerifiedAt: entitlement.lastVerifiedAt,
  };
}
