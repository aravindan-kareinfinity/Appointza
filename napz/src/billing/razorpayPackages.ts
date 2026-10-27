export type RazorpayPackageId =
  | 'napz_daily'
  | 'napz_10_days'
  | 'napz_monthly'
  | 'napz_six_months'
  | 'napz_yearly'
  | 'napz_lifetime';

export const RAZORPAY_PACKAGES: Record<
  RazorpayPackageId,
  {
    name: string;
    title: string;
    amountPaise: number;
    priceLabel: string;
    months: number | null;
    days?: number | null;
    durationLabel: string;
    billingNote: string;
    detail: string;
    savedPlaceLimit: number;
    featured?: boolean;
  }
> = {
  napz_daily: {
    name: '1 Day Premium',
    title: '1 day',
    amountPaise: 900,
    priceLabel: '₹9',
    months: null,
    days: 1,
    durationLabel: '24 hours of Premium',
    billingNote: 'One-time · no automatic renewal',
    detail:
      'Google Maps, advanced radius and custom alarms for 24 hours. Up to 10 cloud-saved locations.',
    savedPlaceLimit: 10,
  },
  napz_10_days: {
    name: '10-Day Premium',
    title: '10 days',
    amountPaise: 2900,
    priceLabel: '₹29',
    months: null,
    days: 10,
    durationLabel: '10 days of Premium',
    billingNote: 'Legacy prepaid plan',
    detail: 'Kept for existing purchases. Not offered on the storefront.',
    savedPlaceLimit: 10,
  },
  napz_monthly: {
    name: '1 Month Premium',
    title: '1 month',
    amountPaise: 4900,
    priceLabel: '₹49',
    months: 1,
    durationLabel: '1 month of Premium',
    billingNote: 'Prepaid for 1 month · buy again to continue',
    detail:
      'Cloud backup and cross-device sync, all Premium map, radius and alarm features. Up to 50 cloud-saved locations.',
    savedPlaceLimit: 50,
  },
  napz_six_months: {
    name: '6-Month Premium',
    title: '6 months',
    amountPaise: 19900,
    priceLabel: '₹199',
    months: 6,
    durationLabel: '6 months of Premium',
    billingNote: 'Legacy prepaid plan',
    detail: 'Kept for existing purchases. Not offered on the storefront.',
    savedPlaceLimit: 50,
  },
  napz_yearly: {
    name: '1 Year Premium',
    title: '1 year',
    amountPaise: 39900,
    priceLabel: '₹399',
    months: 12,
    durationLabel: '12 months of Premium',
    billingNote: 'Best value · ₹33.25/month · save ₹189 vs monthly',
    detail:
      'All Premium features and up to 200 cloud-saved locations. The plan we recommend for regular users.',
    savedPlaceLimit: 200,
    featured: true,
  },
  napz_lifetime: {
    name: 'Lifetime Premium',
    title: 'Lifetime',
    amountPaise: 399900,
    priceLabel: '₹3,999',
    months: null,
    durationLabel: 'Lifetime for this account',
    billingNote: 'One-time purchase · no renewal',
    detail: 'Permanent Premium and up to 500 cloud-saved locations on this Napz account.',
    savedPlaceLimit: 500,
  },
};

/** Plans shown on Subscription / Upgrade. */
export const RAZORPAY_PLAN_ORDER: RazorpayPackageId[] = [
  'napz_daily',
  'napz_monthly',
  'napz_yearly',
  'napz_lifetime',
];
