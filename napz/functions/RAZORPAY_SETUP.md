# Razorpay one-time payments for web/non-Play checkout

This project exports `createRazorpayPaymentLink` and `razorpayWebhook` from Firebase Functions.
The callable creates a server-priced Razorpay Payment Link for a signed-in Firebase user. The
webhook grants a fixed access period only after Razorpay reports `payment_link.paid` and the
webhook signature, amount, currency, and server-side payment-link record all match.

The package catalog is in `src/constants.ts`:

| Package ID | Price | Access |
| --- | ---: | --- |
| `napz_daily` | ₹10 | 24 hours |
| `napz_monthly` | ₹49 | 1 month |
| `napz_six_months` | ₹199 | 6 months |
| `napz_yearly` | ₹399 | 12 months |
| `napz_lifetime` | ₹4,999 | Lifetime |

New eligible Firebase accounts receive one 10-day premium trial, recorded once per UID by the
`startFreeTrial` callable. The app starts the trial after sign-in. It does not collect a payment
method or renew automatically; after the trial, the user chooses whether to buy a prepaid plan.

The callable accepts `{ packageId }` and returns `{ paymentLinkId, shortUrl, packageId, amount, currency }`.
The external website/non-Play client should open `shortUrl`; it must not mark the user as premium
based on the browser return alone. Firestore is updated by the signed webhook.

## Configure and deploy

1. Set Firebase Functions secrets using the Razorpay API keys for the intended Razorpay mode:
   run `firebase functions:secrets:set RAZORPAY_KEY_ID`, then repeat for
   `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`.
2. Build/deploy the Functions to the existing Firebase project.
3. In the matching Razorpay mode, add a webhook URL pointing to the deployed `razorpayWebhook`
   HTTP function. Use the exact same `RAZORPAY_WEBHOOK_SECRET` value in Razorpay and Firebase.
4. Subscribe to `payment_link.paid` and run a test-mode payment before switching to live keys.

Never put the Razorpay API secret or webhook secret in the React Native client or a public website.
This project has no website checkout UI, so a web/non-Play client still needs to call the function
and present the returned link. The existing Google Play checkout remains separate.
