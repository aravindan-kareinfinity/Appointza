import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import {
  applyVerifiedEntitlement,
  findUidByPurchaseToken,
  readEntitlement,
} from './entitlementStore';
import { verifyPlayPurchaseToken } from './playVerify';

type PlayDeveloperNotification = {
  version?: string;
  packageName?: string;
  eventTimeMillis?: string;
  subscriptionNotification?: {
    version?: string;
    notificationType?: number;
    purchaseToken?: string;
    subscriptionId?: string;
  };
  oneTimeProductNotification?: {
    version?: string;
    notificationType?: number;
    purchaseToken?: string;
    sku?: string;
  };
};

/**
 * Google Play RTDN → Pub/Sub topic (configure in Play Console).
 * Topic name default: play-rtdn
 */
export const playRtdnHandler = onMessagePublished('play-rtdn', async (event) => {
  const data = event.data.message.data;
  if (!data) return;

  let notification: PlayDeveloperNotification;
  try {
    notification = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
  } catch {
    console.warn('RTDN: invalid payload');
    return;
  }

  const sub = notification.subscriptionNotification;
  const oneTime = notification.oneTimeProductNotification;
  const purchaseToken = sub?.purchaseToken ?? oneTime?.purchaseToken;
  const productId = sub?.subscriptionId ?? oneTime?.sku;

  if (!purchaseToken || !productId) {
    console.warn('RTDN: missing token or productId');
    return;
  }

  let uid = await findUidByPurchaseToken(purchaseToken);
  if (!uid) {
    console.warn('RTDN: no user found for purchase token');
    return;
  }

  try {
    const verified = await verifyPlayPurchaseToken(productId, purchaseToken);
    await applyVerifiedEntitlement(uid, verified);
  } catch (e) {
    console.error('RTDN verify failed:', e);
    const current = await readEntitlement(uid);
    if (sub?.notificationType === 12 || sub?.notificationType === 13) {
      await applyVerifiedEntitlement(uid, {
        ...current,
        premium: false,
        tier: 'free',
        status: 'expired',
        lastVerifiedAt: new Date().toISOString(),
        source: 'play_verify',
      });
    }
  }
});
