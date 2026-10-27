import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { APPOINTZA_PAYMENT_API, RAZORPAY_PACKAGES, RazorpayPackageId } from './constants';
import {
  applyVerifiedRazorpayPayment,
  entitlementForClient,
  readEntitlement,
  writePendingRazorpayCheckout,
} from './entitlementStore';

const razorpayKeyId = defineSecret('RAZORPAY_KEY_ID');
const razorpayKeySecret = defineSecret('RAZORPAY_KEY_SECRET');
const razorpayWebhookSecret = defineSecret('RAZORPAY_WEBHOOK_SECRET');

type RazorpayPaymentLinkResponse = {
  id?: string;
  short_url?: string;
  amount?: number;
  currency?: string;
  status?: string;
};

type RazorpayOrderResponse = {
  id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error?: { description?: string };
};

type RazorpayWebhookBody = {
  id?: string;
  event?: string;
  payload?: {
    payment_link?: {
      entity?: {
        id?: string;
        status?: string;
        amount?: number;
        amount_paid?: number;
        currency?: string;
      };
    };
    payment?: {
      entity?: {
        id?: string;
        status?: string;
        amount?: number;
        currency?: string;
        order_id?: string;
      };
    };
  };
};

function functionsOrigin(): string {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || '';
  return `https://asia-south1-${projectId}.cloudfunctions.net`;
}

function razorpayReturnUrl(): string {
  return `${functionsOrigin()}/razorpayPaymentReturn`;
}

function razorpayCheckoutUrl(orderId: string, token: string): string {
  const params = new URLSearchParams({ order_id: orderId, token });
  return `${functionsOrigin()}/razorpayCheckout?${params.toString()}`;
}

async function razorpayFetch(path: string, init?: RequestInit): Promise<Response> {
  const keyId = razorpayKeyId.value();
  const keySecret = razorpayKeySecret.value();
  return fetch(`https://api.razorpay.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

function requirePackage(packageId: string) {
  if (!Object.prototype.hasOwnProperty.call(RAZORPAY_PACKAGES, packageId)) {
    throw new HttpsError('invalid-argument', 'Choose a valid Napz package.');
  }
  return RAZORPAY_PACKAGES[packageId as RazorpayPackageId];
}

async function storePendingOrder(uid: string, orderId: string, packageId: RazorpayPackageId) {
  const selectedPackage = requirePackage(packageId);
  await admin.firestore().doc(`razorpayOrders/${orderId}`).set(
    {
      uid,
      productId: packageId,
      planId: packageId,
      amount: selectedPackage.amount,
      currency: 'INR',
      status: 'created',
      subscriptionStatus: 'PENDING',
      renewalStatus: 'NONE',
      provider: 'appointza',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  await writePendingRazorpayCheckout({
    uid,
    paymentLinkId: orderId,
    orderId,
    productId: packageId,
    amount: selectedPackage.amount,
  });
  await admin.firestore().doc(`users/${uid}`).set(
    { lastRazorpayOrderId: orderId, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
}

export const rememberRazorpayOrder = onCall({ region: 'asia-south1' }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');
  const orderId = String(request.data?.orderId ?? '').trim();
  const packageId = String(request.data?.packageId ?? '') as RazorpayPackageId;
  if (!orderId.startsWith('order_')) {
    throw new HttpsError('invalid-argument', 'orderId is required.');
  }
  requirePackage(packageId);
  await storePendingOrder(uid, orderId, packageId);
  return { ok: true, orderId, packageId };
});

function appointzaFailed(payload: unknown, httpStatus: number): string | null {
  if (httpStatus >= 400) return `Appointza VerifyPayment failed (${httpStatus}).`;
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as Record<string, unknown>;
  if (root.success === false || root.Success === false) {
    return String(root.message ?? root.Message ?? 'Appointza rejected VerifyPayment.');
  }
  return null;
}

export const confirmAppointzaPayment = onCall({ region: 'asia-south1' }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

  const orderId = String(request.data?.orderId ?? '').trim();
  const paymentId = String(request.data?.paymentId ?? '').trim();
  const signature = String(request.data?.signature ?? '').trim();
  const packageId = String(request.data?.packageId ?? '') as RazorpayPackageId;
  if (!orderId.startsWith('order_') || !paymentId.startsWith('pay_') || !signature) {
    throw new HttpsError('invalid-argument', 'Razorpay payment details are required.');
  }
  const selectedPackage = requirePackage(packageId);

  const mapping = await admin.firestore().doc(`razorpayOrders/${orderId}`).get();
  if (!mapping.exists || String(mapping.data()?.uid ?? '') !== uid) {
    throw new HttpsError('not-found', 'No matching Napz checkout was found for this account.');
  }

  const verifyUrl = `${APPOINTZA_PAYMENT_API.baseUrl.replace(/\/$/, '')}/api/Payment/VerifyPayment`;
  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      appointmentid: 0,
      eventbookingid: null,
      organizationid: APPOINTZA_PAYMENT_API.organizationId,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  const failed = appointzaFailed(payload, response.status);
  if (failed) throw new HttpsError('failed-precondition', failed);

  await applyVerifiedRazorpayPayment({
    eventId: `appointza_${orderId}_${paymentId}`,
    checkoutId: orderId,
    sourceCollection: 'razorpayOrders',
    paymentId,
    amount: selectedPackage.amount,
  });
  return {
    paid: true,
    status: 'paid',
    entitlement: entitlementForClient(await readEntitlement(uid)),
  };
});

export const createRazorpayOrder = onCall(
  { region: 'asia-south1', secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

    const packageId = String(request.data?.packageId ?? '') as RazorpayPackageId;
    const selectedPackage = requirePackage(packageId);

    const keyId = razorpayKeyId.value();
    const keySecret = razorpayKeySecret.value();
    if (!keyId || !keySecret) {
      throw new HttpsError('failed-precondition', 'Razorpay API secrets are not configured.');
    }

    const contactDigits = String(request.data?.contact ?? '').replace(/\D/g, '');
    const contact = contactDigits.length === 10 ? contactDigits : '';

    const receipt = `napz_${randomUUID().replace(/-/g, '').slice(0, 32)}`;
    const response = await razorpayFetch('orders', {
      method: 'POST',
      body: JSON.stringify({
        amount: selectedPackage.amount,
        currency: 'INR',
        receipt,
        payment_capture: 1,
        notes: {
          napz_package: packageId,
          napz_uid: uid,
          ...(contact ? { napz_mobile: contact } : {}),
        },
      }),
    });
    const result = (await response.json().catch(() => ({}))) as RazorpayOrderResponse;
    if (!response.ok || !result.id) {
      const detail = result.error?.description || `HTTP ${response.status}`;
      console.error('Razorpay order creation failed:', detail);
      throw new HttpsError('unavailable', detail);
    }

    const checkoutToken = randomUUID().replace(/-/g, '');
    await admin.firestore().doc(`razorpayOrders/${result.id}`).set({
      uid,
      productId: packageId,
      planId: packageId,
      amount: selectedPackage.amount,
      currency: 'INR',
      mobile: contact || null,
      status: 'created',
      subscriptionStatus: 'PENDING',
      renewalStatus: 'NONE',
      checkoutToken,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await writePendingRazorpayCheckout({
      uid,
      paymentLinkId: result.id,
      orderId: result.id,
      productId: packageId,
      amount: selectedPackage.amount,
    });
    await admin.firestore().doc(`users/${uid}`).set(
      { lastRazorpayOrderId: result.id, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    return {
      orderId: result.id,
      keyId,
      packageId,
      amount: selectedPackage.amount,
      currency: 'INR',
      description: selectedPackage.name,
      checkoutUrl: razorpayCheckoutUrl(result.id, checkoutToken),
    };
  }
);

export const razorpayCheckout = onRequest(
  { region: 'asia-south1', secrets: [razorpayKeyId] },
  async (request, response) => {
    const orderId = String(request.query.order_id ?? '').trim();
    const token = String(request.query.token ?? '').trim();
    if (!orderId.startsWith('order_') || !token) {
      response.status(400).type('html').send(checkoutErrorHtml('Could not start Razorpay checkout.'));
      return;
    }

    const mapping = await admin.firestore().doc(`razorpayOrders/${orderId}`).get();
    const data = mapping.data();
    if (!mapping.exists || String(data?.checkoutToken ?? '') !== token) {
      response.status(404).type('html').send(checkoutErrorHtml('This checkout session is no longer valid. Return to Napz and tap the plan again.'));
      return;
    }
    if (data?.status === 'paid') {
      response.status(200).type('html').send(paidHtml());
      return;
    }

    const productId = String(data?.productId ?? '');
    const selectedPackage = RAZORPAY_PACKAGES[productId as RazorpayPackageId];
    const keyId = razorpayKeyId.value();
    if (!selectedPackage || !keyId) {
      response.status(500).type('html').send(checkoutErrorHtml('Checkout is not configured.'));
      return;
    }

    const options = {
      key: keyId,
      amount: selectedPackage.amount,
      currency: 'INR',
      name: 'Napz',
      description: selectedPackage.name,
      order_id: orderId,
      theme: { color: '#1B4D8B' },
      callback_url: razorpayReturnUrl(),
      redirect: true,
    };

    response.status(200).type('html').send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Napz Premium</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body style="font-family:sans-serif;padding:32px;text-align:center;color:#0f172a">
  <h1>Opening Razorpay…</h1>
  <p>Complete payment for ${escapeHtml(selectedPackage.name)}.</p>
  <p><button id="pay" style="font-size:16px;padding:12px 20px">Pay with Razorpay</button></p>
  <script>
    var options = ${JSON.stringify(options)};
    options.modal = { ondismiss: function () { document.getElementById('status').textContent = 'Payment cancelled. Return to Napz.'; } };
    var rzp = new Razorpay(options);
    function openPay() { rzp.open(); }
    document.getElementById('pay').onclick = openPay;
    openPay();
  </script>
  <p id="status"></p>
</body>
</html>`);
  }
);

export const createRazorpayPaymentLink = onCall(
  { region: 'asia-south1', secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

    const packageId = String(request.data?.packageId ?? '') as RazorpayPackageId;
    const selectedPackage = requirePackage(packageId);

    const keyId = razorpayKeyId.value();
    const keySecret = razorpayKeySecret.value();
    if (!keyId || !keySecret) {
      throw new HttpsError('failed-precondition', 'Razorpay API secrets are not configured.');
    }

    const database = admin.firestore();
    const referenceId = `napz_${randomUUID().replace(/-/g, '')}`;
    const expireBy = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    const response = await razorpayFetch('payment_links', {
      method: 'POST',
      body: JSON.stringify({
        amount: selectedPackage.amount,
        currency: 'INR',
        accept_partial: false,
        description: selectedPackage.name,
        reference_id: referenceId,
        expire_by: expireBy,
        notify: { email: false, sms: false },
        reminder_enable: false,
        notes: { napz_package: packageId, napz_uid: uid },
        callback_url: razorpayReturnUrl(),
        callback_method: 'get',
      }),
    });

    const result = (await response.json().catch(() => ({}))) as RazorpayPaymentLinkResponse & {
      error?: { description?: string };
    };
    if (!response.ok || !result.id || !result.short_url) {
      const detail = result.error?.description || `HTTP ${response.status}`;
      console.error('Razorpay payment link creation failed:', detail);
      throw new HttpsError('unavailable', detail);
    }

    await database.doc(`razorpayPaymentLinks/${result.id}`).set({
      uid,
      productId: packageId,
      planId: packageId,
      amount: selectedPackage.amount,
      currency: 'INR',
      status: 'created',
      subscriptionStatus: 'PENDING',
      renewalStatus: 'NONE',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await writePendingRazorpayCheckout({
      uid,
      paymentLinkId: result.id,
      productId: packageId,
      amount: selectedPackage.amount,
    });

    return {
      paymentLinkId: result.id,
      shortUrl: result.short_url,
      packageId,
      amount: selectedPackage.amount,
      currency: 'INR',
    };
  }
);

export const confirmRazorpayOrder = onCall(
  { region: 'asia-south1', secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

    let orderId = String(request.data?.orderId ?? '').trim();
    if (!orderId.startsWith('order_')) {
      const userSnap = await admin.firestore().doc(`users/${uid}`).get();
      orderId = String(userSnap.data()?.lastRazorpayOrderId ?? '');
    }
    if (!orderId.startsWith('order_')) {
      return {
        paid: false,
        status: 'missing',
        entitlement: entitlementForClient(await readEntitlement(uid)),
      };
    }

    const mapping = await admin.firestore().doc(`razorpayOrders/${orderId}`).get();
    if (!mapping.exists || String(mapping.data()?.uid ?? '') !== uid) {
      throw new HttpsError('not-found', 'No Razorpay order was found for this Napz account.');
    }

    const captured = await fetchCapturedOrderPayment(orderId);
    if (!captured) {
      return {
        paid: false,
        status: 'created',
        entitlement: entitlementForClient(await readEntitlement(uid)),
      };
    }

    await applyVerifiedRazorpayPayment({
      eventId: `confirm_${orderId}_${captured.paymentId}`,
      checkoutId: orderId,
      sourceCollection: 'razorpayOrders',
      paymentId: captured.paymentId,
      amount: captured.amount,
    });
    return {
      paid: true,
      status: 'paid',
      entitlement: entitlementForClient(await readEntitlement(uid)),
    };
  }
);

export const confirmRazorpayPaymentLink = onCall(
  { region: 'asia-south1', secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

    const paymentLinkId = String(request.data?.paymentLinkId ?? '').trim();
    if (!paymentLinkId.startsWith('plink_')) {
      throw new HttpsError('invalid-argument', 'paymentLinkId is required.');
    }

    const mapping = await admin.firestore().doc(`razorpayPaymentLinks/${paymentLinkId}`).get();
    if (!mapping.exists || String(mapping.data()?.uid ?? '') !== uid) {
      throw new HttpsError('not-found', 'This payment link does not belong to your Napz account.');
    }

    const response = await razorpayFetch(`payment_links/${paymentLinkId}`);
    const result = (await response.json().catch(() => ({}))) as {
      status?: string;
      amount_paid?: number;
      payments?: Array<{ payment_id?: string; status?: string; amount?: number }>;
      error?: { description?: string };
    };
    if (!response.ok) {
      throw new HttpsError(
        'unavailable',
        result.error?.description || 'Could not check Razorpay payment status.'
      );
    }
    if (result.status !== 'paid') {
      return {
        paid: false,
        status: result.status ?? 'created',
        entitlement: entitlementForClient(await readEntitlement(uid)),
      };
    }

    const captured = (result.payments ?? []).find(
      (item) => item.status === 'captured' || item.status === 'authorized'
    );
    const paymentId = String(captured?.payment_id ?? result.payments?.[0]?.payment_id ?? '');
    const amountPaid = Number(result.amount_paid ?? captured?.amount ?? mapping.data()?.amount);
    if (!paymentId || !Number.isFinite(amountPaid)) {
      throw new HttpsError('failed-precondition', 'Razorpay marked the link paid, but no payment id was returned.');
    }

    await applyVerifiedRazorpayPayment({
      eventId: `confirm_${paymentLinkId}_${paymentId}`,
      checkoutId: paymentLinkId,
      sourceCollection: 'razorpayPaymentLinks',
      paymentId,
      amount: amountPaid,
    });
    return {
      paid: true,
      status: 'paid',
      entitlement: entitlementForClient(await readEntitlement(uid)),
    };
  }
);

export const razorpayPaymentReturn = onRequest(
  { region: 'asia-south1', secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request, response) => {
    const paymentId = firstParam(request, 'razorpay_payment_id');
    const orderId = firstParam(request, 'razorpay_order_id');
    const signature = firstParam(request, 'razorpay_signature');

    if (paymentId && orderId && signature) {
      const expected = createHmac('sha256', razorpayKeySecret.value())
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
      if (signaturesMatch(expected, signature)) {
        const mapping = await admin.firestore().doc(`razorpayOrders/${orderId}`).get();
        const amount = Number(mapping.data()?.amount);
        if (mapping.exists && Number.isFinite(amount)) {
          try {
            await applyVerifiedRazorpayPayment({
              eventId: `return_${orderId}_${paymentId}`,
              checkoutId: orderId,
              sourceCollection: 'razorpayOrders',
              paymentId,
              amount,
            });
          } catch (error) {
            console.error('Razorpay return apply failed:', error);
          }
        }
      }
    }

    response.status(200).type('html').send(paidHtml());
  }
);

function firstParam(
  request: { query: Record<string, unknown>; body?: unknown },
  key: string
): string {
  const fromQuery = request.query[key];
  if (typeof fromQuery === 'string') return fromQuery;
  if (Array.isArray(fromQuery) && typeof fromQuery[0] === 'string') return fromQuery[0];
  const body = request.body as Record<string, unknown> | undefined;
  const fromBody = body?.[key];
  return typeof fromBody === 'string' ? fromBody : '';
}

function signaturesMatch(expectedHex: string, received: string): boolean {
  try {
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = Buffer.from(received, 'hex');
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

async function fetchCapturedOrderPayment(
  orderId: string
): Promise<{ paymentId: string; amount: number } | null> {
  const orderResponse = await razorpayFetch(`orders/${orderId}`);
  const order = (await orderResponse.json().catch(() => ({}))) as {
    status?: string;
    amount_paid?: number;
    error?: { description?: string };
  };
  if (!orderResponse.ok) return null;

  const paymentsResponse = await razorpayFetch(`orders/${orderId}/payments`);
  const payments = (await paymentsResponse.json().catch(() => ({}))) as {
    items?: Array<{ id?: string; status?: string; amount?: number }>;
  };
  const captured = (payments.items ?? []).find(
    (item) => item.status === 'captured' || item.status === 'authorized'
  );
  const paymentId = String(captured?.id ?? '');
  const amount = Number(captured?.amount ?? order.amount_paid);
  if (!paymentId || !Number.isFinite(amount) || amount <= 0) return null;
  if (order.status !== 'paid' && captured?.status !== 'captured' && captured?.status !== 'authorized') {
    return null;
  }
  return { paymentId, amount };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[ch] ?? ch;
  });
}

function paidHtml(): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Napz</title></head>
<body style="font-family:sans-serif;padding:32px;text-align:center">
  <h1>Payment complete</h1>
  <p>Return to the Napz app. Premium unlocks after the payment is confirmed.</p>
</body></html>`;
}

function checkoutErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Napz</title></head>
<body style="font-family:sans-serif;padding:32px;text-align:center">
  <h1>Checkout</h1>
  <p>${escapeHtml(message)}</p>
</body></html>`;
}

function hasValidSignature(rawBody: Buffer, received: string, secret: string): boolean {
  if (!/^[a-f\d]{64}$/i.test(received)) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const actual = Buffer.from(received, 'hex');
  return actual.length === expected.length && timingSafeEqual(expected, actual);
}

export const razorpayWebhook = onRequest(
  { region: 'asia-south1', secrets: [razorpayWebhookSecret] },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method not allowed');
      return;
    }

    const secret = razorpayWebhookSecret.value();
    const rawBody = request.rawBody;
    const signature = request.header('x-razorpay-signature') ?? '';
    if (!secret || !rawBody || !hasValidSignature(rawBody, signature, secret)) {
      response.status(400).send('Invalid webhook signature');
      return;
    }

    const body = request.body as RazorpayWebhookBody | undefined;
    const event = String(body?.event ?? '');
    const eventId = String(body?.id ?? '');
    const payment = body?.payload?.payment?.entity;
    const paymentId = String(payment?.id ?? '');
    const amountPaid = Number(payment?.amount ?? body?.payload?.payment_link?.entity?.amount_paid);
    const currency = String(payment?.currency ?? body?.payload?.payment_link?.entity?.currency ?? '');

    try {
      if (event === 'payment.captured' || event === 'order.paid') {
        const orderId = String(payment?.order_id ?? '');
        if (!orderId || !paymentId || !eventId || !Number.isFinite(amountPaid) || currency !== 'INR') {
          response.status(400).send('Invalid order payment event');
          return;
        }
        const mapping = await admin.firestore().doc(`razorpayOrders/${orderId}`).get();
        const uid = String(mapping.data()?.uid ?? '');
        if (!mapping.exists || !uid) {
          response.status(200).send('Unknown order ignored');
          return;
        }
        try {
          await admin.auth().getUser(uid);
        } catch {
          response.status(200).send('Deleted customer ignored');
          return;
        }
        await applyVerifiedRazorpayPayment({
          eventId,
          checkoutId: orderId,
          sourceCollection: 'razorpayOrders',
          paymentId,
          amount: amountPaid,
        });
        response.status(200).send('Webhook processed');
        return;
      }

      if (event !== 'payment_link.paid') {
        response.status(200).send('Event ignored');
        return;
      }

      const link = body?.payload?.payment_link?.entity;
      const paymentLinkId = String(link?.id ?? '');
      const linkAmount = Number(link?.amount_paid ?? payment?.amount);
      if (!paymentLinkId || !paymentId || !eventId || link?.status !== 'paid' ||
          !Number.isFinite(linkAmount) || currency !== 'INR') {
        response.status(400).send('Invalid payment link event');
        return;
      }
      const mapping = await admin.firestore().doc(`razorpayPaymentLinks/${paymentLinkId}`).get();
      const uid = String(mapping.data()?.uid ?? '');
      if (!mapping.exists || !uid) {
        response.status(200).send('Unknown payment link ignored');
        return;
      }
      try {
        await admin.auth().getUser(uid);
      } catch {
        response.status(200).send('Deleted customer ignored');
        return;
      }
      await applyVerifiedRazorpayPayment({
        eventId,
        checkoutId: paymentLinkId,
        sourceCollection: 'razorpayPaymentLinks',
        paymentId,
        amount: linkAmount,
      });
      response.status(200).send('Webhook processed');
    } catch (error) {
      console.error('Razorpay webhook processing failed:', error);
      response.status(500).send('Webhook processing failed');
    }
  }
);
