import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { ANDROID_PACKAGE } from './constants';
import {
  applyVerifiedEntitlement,
  entitlementForClient,
  readEntitlement,
  startFreeTrialEntitlement,
} from './entitlementStore';
import { verifyPlayPurchaseToken } from './playVerify';

export { playRtdnHandler } from './rtdn';
export {
  confirmAppointzaPayment,
  confirmRazorpayOrder,
  confirmRazorpayPaymentLink,
  createRazorpayOrder,
  createRazorpayPaymentLink,
  razorpayCheckout,
  razorpayPaymentReturn,
  razorpayWebhook,
  rememberRazorpayOrder,
} from './razorpay';
export { estimateTransitJourney } from './rideEstimate';
export {
  uberAuthStart,
  uberConnectionStatus,
  uberDisconnect,
  uberOAuthCallback,
  uberRideCatalog,
} from './uberOAuth';
export { olaRideCatalog } from './olaRide';
export {
  blaBlaCarProLogin,
  blaBlaCarProLogout,
  blaBlaCarProSearch,
  blaBlaCarProStatus,
} from './blaBlaCarPro';
export { nammaYatriOnSearch, nammaYatriRideCatalog } from './nammaYatri';
export { narrateTrip } from './tripNarrate';

export const startFreeTrial = onCall({ region: 'asia-south1' }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to start your free trial.');
  const entitlement = await startFreeTrialEntitlement(uid);
  return entitlementForClient(entitlement);
});

admin.initializeApp();
setGlobalOptions({ region: 'asia-south1' });

type VerifyPayload = {
  productId?: string;
  purchaseToken?: string;
  packageName?: string;
};

type RestorePayload = {
  purchases?: Array<{ productId?: string; purchaseToken?: string }>;
  packageName?: string;
};

export const verifyPlayPurchase = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  const data = (request.data ?? {}) as VerifyPayload;
  const productId = String(data.productId ?? '').trim();
  const purchaseToken = String(data.purchaseToken ?? '').trim();
  const packageName = String(data.packageName ?? ANDROID_PACKAGE).trim();

  if (!productId || !purchaseToken) {
    throw new HttpsError('invalid-argument', 'productId and purchaseToken are required.');
  }

  try {
    const verified = await verifyPlayPurchaseToken(productId, purchaseToken, packageName);
    const entitlement = await applyVerifiedEntitlement(uid, verified);
    return entitlementForClient(entitlement);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new HttpsError('failed-precondition', message);
  }
});

export const refreshEntitlement = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  const current = await readEntitlement(uid);
  if (!current.purchaseToken || !current.productId) {
    return entitlementForClient(current);
  }
  if (current.source === 'razorpay') {
    return entitlementForClient(current);
  }

  try {
    const verified = await verifyPlayPurchaseToken(
      current.productId,
      current.purchaseToken
    );
    const entitlement = await applyVerifiedEntitlement(uid, verified);
    return entitlementForClient(entitlement);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new HttpsError('failed-precondition', message);
  }
});

export const restorePlayPurchases = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  const data = (request.data ?? {}) as RestorePayload;
  const purchases = Array.isArray(data.purchases) ? data.purchases : [];
  const packageName = String(data.packageName ?? ANDROID_PACKAGE).trim();

  if (purchases.length === 0) {
    return entitlementForClient(await readEntitlement(uid));
  }

  let best = await readEntitlement(uid);
  for (const item of purchases) {
    const productId = String(item.productId ?? '').trim();
    const purchaseToken = String(item.purchaseToken ?? '').trim();
    if (!productId || !purchaseToken) continue;
    try {
      const verified = await verifyPlayPurchaseToken(productId, purchaseToken, packageName);
      best = await applyVerifiedEntitlement(uid, verified);
    } catch {
      /* try remaining tokens */
    }
  }

  return entitlementForClient(best);
});
