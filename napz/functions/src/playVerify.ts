import { createHash } from 'crypto';
import { google } from 'googleapis';
import {
  ANDROID_PACKAGE,
  FREE_ENTITLEMENT,
  NapzEntitlement,
  isPlayLifetimeProduct,
  isPlaySubscriptionProduct,
} from './constants';

type AndroidPublisher = ReturnType<typeof google.androidpublisher>;

let publisherPromise: Promise<AndroidPublisher> | null = null;

function getServiceAccountJson(): Record<string, unknown> | null {
  const raw =
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT ??
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function getAndroidPublisher(): Promise<AndroidPublisher> {
  if (!publisherPromise) {
    publisherPromise = (async () => {
      const credentials = getServiceAccountJson();
      if (!credentials) {
        throw new Error(
          'GOOGLE_PLAY_SERVICE_ACCOUNT secret is not configured on Cloud Functions.'
        );
      }
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });
      return google.androidpublisher({ version: 'v3', auth });
    })();
  }
  return publisherPromise;
}

export function purchaseTokenDocId(purchaseToken: string): string {
  return createHash('sha256').update(purchaseToken).digest('hex').slice(0, 40);
}

function entitlementFromLifetime(
  productId: string,
  purchaseToken: string,
  orderId: string | null | undefined,
  startTime: string | null
): NapzEntitlement {
  return {
    premium: true,
    tier: 'lifetime',
    productId,
    startTime,
    purchaseToken,
    orderId: orderId ?? null,
    status: 'active',
    expiresAt: null,
    isLifetime: true,
    autoRenewing: false,
    gracePeriodUntil: null,
    accountHoldUntil: null,
    canceledAt: null,
    revokedAt: null,
    lastVerifiedAt: new Date().toISOString(),
    source: 'play_verify',
  };
}

function entitlementFromSubscription(
  productId: string,
  purchaseToken: string,
  subscription: {
    subscriptionState?: string | null;
    startTime?: string | null;
    lineItems?: Array<{
      expiryTime?: string | null;
      autoRenewingPlan?: { autoRenewEnabled?: boolean | null } | null;
    }> | null;
  }
): NapzEntitlement {
  const state = subscription.subscriptionState ?? '';
  const line = subscription.lineItems?.[0];
  const expiresAt = line?.expiryTime ?? null;
  const autoRenewing = line?.autoRenewingPlan?.autoRenewEnabled === true;

  let status: NapzEntitlement['status'] = 'expired';
  let premium = false;

  switch (state) {
    case 'SUBSCRIPTION_STATE_ACTIVE':
      status = 'active';
      premium = true;
      break;
    case 'SUBSCRIPTION_STATE_CANCELED':
      status = 'canceled';
      premium = expiresAt ? Date.parse(expiresAt) > Date.now() : false;
      break;
    case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD':
      status = 'grace_period';
      premium = true;
      break;
    case 'SUBSCRIPTION_STATE_ON_HOLD':
      status = 'on_hold';
      premium = false;
      break;
    case 'SUBSCRIPTION_STATE_PAUSED':
      status = 'paused';
      premium = false;
      break;
    case 'SUBSCRIPTION_STATE_EXPIRED':
      status = 'expired';
      premium = false;
      break;
    default:
      status = 'expired';
      premium = false;
  }

  return {
    premium,
    tier: premium ? 'premium' : 'free',
    productId,
    startTime: subscription.startTime ?? null,
    purchaseToken,
    orderId: null,
    status,
    expiresAt,
    isLifetime: false,
    autoRenewing,
    gracePeriodUntil: status === 'grace_period' ? expiresAt : null,
    accountHoldUntil: status === 'on_hold' ? expiresAt : null,
    canceledAt: status === 'canceled' ? new Date().toISOString() : null,
    revokedAt: null,
    lastVerifiedAt: new Date().toISOString(),
    source: 'play_verify',
  };
}

export async function verifyPlayPurchaseToken(
  productId: string,
  purchaseToken: string,
  packageName = ANDROID_PACKAGE
): Promise<NapzEntitlement> {
  if (!purchaseToken || !productId) {
    return FREE_ENTITLEMENT;
  }

  const publisher = await getAndroidPublisher();

  if (isPlayLifetimeProduct(productId)) {
    const res = await publisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });
    const purchaseState = res.data.purchaseState ?? 2;
    if (purchaseState !== 0) {
      return {
        ...FREE_ENTITLEMENT,
        productId,
        purchaseToken,
        status: purchaseState === 1 ? 'revoked' : 'expired',
        revokedAt: purchaseState === 1 ? new Date().toISOString() : null,
        lastVerifiedAt: new Date().toISOString(),
        source: 'play_verify',
      };
    }
    const purchaseTime = Number(res.data.purchaseTimeMillis);
    const startTime = Number.isFinite(purchaseTime)
      ? new Date(purchaseTime).toISOString()
      : null;
    return entitlementFromLifetime(productId, purchaseToken, res.data.orderId, startTime);
  }

  if (isPlaySubscriptionProduct(productId)) {
    const res = await publisher.purchases.subscriptionsv2.get({
      packageName,
      token: purchaseToken,
    });
    return entitlementFromSubscription(productId, purchaseToken, res.data);
  }

  throw new Error(`Unknown Play product ID: ${productId}`);
}
