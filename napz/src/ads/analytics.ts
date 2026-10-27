import analytics from '@react-native-firebase/analytics';
import type { PaidEvent } from 'react-native-google-mobile-ads';
import { RAZORPAY_PACKAGES, type RazorpayPackageId } from '../billing/razorpayPackages';

function microsToValue(event: PaidEvent): number {
  if (event.value > 1000) return event.value / 1_000_000;
  return event.value;
}

export async function logAdPaid(event: PaidEvent): Promise<void> {
  try {
    const value = microsToValue(event);
    await analytics().logEvent('ad_impression', {
      ad_platform: 'AdMob',
      ad_format: 'banner',
      ad_source: 'google',
      currency: event.currency || 'USD',
      value,
    });
  } catch {
    /* analytics optional */
  }
}

export async function logAdImpression(): Promise<void> {
  try {
    await analytics().logEvent('ad_impression', {
      ad_platform: 'AdMob',
      ad_format: 'banner',
      ad_source: 'google',
    });
  } catch {
    /* analytics optional */
  }
}

export async function logSubscriptionConversion(
  packageId: RazorpayPackageId
): Promise<void> {
  try {
    const plan = RAZORPAY_PACKAGES[packageId];
    const value = plan.amountPaise / 100;
    await analytics().logEvent('purchase', {
      currency: 'INR',
      value,
      transaction_id: packageId,
      items: [{ item_id: packageId, item_name: plan.name, price: value, quantity: 1 }],
    });
    await analytics().logEvent('subscribe', {
      item_id: packageId,
      value,
      currency: 'INR',
    });
  } catch {
    /* analytics optional */
  }
}

export async function logTrialClaimed(): Promise<void> {
  try {
    await analytics().logEvent('start_trial', {
      item_name: '10 days free trial',
    });
  } catch {
    /* analytics optional */
  }
}

export async function setSubscriptionAnalyticsProperty(
  tier: string,
  productId: string | null
): Promise<void> {
  try {
    await analytics().setUserProperty('subscription_tier', tier.slice(0, 36));
    await analytics().setUserProperty('plan_id', (productId || 'free').slice(0, 36));
  } catch {
    /* analytics optional */
  }
}
