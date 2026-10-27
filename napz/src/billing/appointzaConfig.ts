/** Appointza host used for Razorpay CreateOrder / VerifyPayment. */
export const APPOINTZA_API_BASE_URL = 'https://appointza.com';

export const APPOINTZA_PAYMENT_ORG = {
  organizationid: 1,
  organisationlocationid: 1,
  /** Numeric Appointza user id for Napz Premium checkout. Update if your org uses another user. */
  userid: 1,
} as const;
