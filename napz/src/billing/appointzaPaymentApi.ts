import { APPOINTZA_API_BASE_URL, APPOINTZA_PAYMENT_ORG } from './appointzaConfig';
import { RAZORPAY_PACKAGES, type RazorpayPackageId } from './razorpayPackages';

export type AppointzaOrder = {
  orderId: string;
  key: string;
  amountPaise: number;
  currency: string;
  receipt: string;
};

export type RazorpayCheckoutSuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

function unwrap(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  const root = payload as Record<string, unknown>;
  for (const key of ['data', 'Data', 'result', 'Result', 'content', 'Content']) {
    const nested = root[key];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return root;
}

function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  const lower = Object.fromEntries(
    Object.entries(record).map(([k, v]) => [k.replace(/_/g, '').toLowerCase(), v])
  );
  for (const key of keys) {
    const value = lower[key.replace(/_/g, '').toLowerCase()];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function readNumber(record: Record<string, unknown>, keys: string[]): number {
  const raw = readString(record, keys);
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

function isFailed(payload: unknown, httpStatus: number): string | null {
  const root =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const detail = String(root.message ?? root.Message ?? root.error ?? root.Error ?? '').trim();
  if (httpStatus >= 400) {
    return detail || `Appointza request failed (${httpStatus}).`;
  }
  if (root.success === false || root.Success === false) {
    return detail || 'Appointza rejected the payment request.';
  }
  const status = String(root.status ?? root.Status ?? '').toLowerCase();
  if (status === 'error' || status === 'failed') {
    return detail || 'Appointza payment request failed.';
  }
  return null;
}

async function appointzaPost(path: string, body: Record<string, unknown>): Promise<unknown> {
  const url = `${APPOINTZA_API_BASE_URL.replace(/\/$/, '')}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  const failed = isFailed(payload, response.status);
  if (failed) throw new Error(failed);
  return payload;
}

function amountToPaise(amount: number, catalogPaise: number): number {
  if (amount === catalogPaise) return amount;
  if (amount * 100 === catalogPaise) return catalogPaise;
  if (amount >= 1000) return Math.round(amount);
  return Math.round(amount * 100);
}

export async function createAppointzaOrder(
  packageId: RazorpayPackageId,
  firebaseUid: string
): Promise<AppointzaOrder> {
  const selected = RAZORPAY_PACKAGES[packageId];
  const rupees = selected.amountPaise / 100;
  const payload = await appointzaPost('/api/Payment/CreateOrder', {
    organizationid: APPOINTZA_PAYMENT_ORG.organizationid,
    organisationlocationid: APPOINTZA_PAYMENT_ORG.organisationlocationid,
    userid: APPOINTZA_PAYMENT_ORG.userid,
    amount: rupees,
    currency: 'INR',
    receipt: `napz_${packageId}_${firebaseUid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`,
    appointmentid: null,
    eventid: null,
    appointmentdate: new Date().toISOString(),
    servicelist: [],
  });
  const record = unwrap(payload);
  const orderId = readString(record, ['orderid', 'orderId', 'OrderId', 'id']);
  const key = readString(record, ['key', 'Key', 'keyId', 'key_id']);
  const amount = readNumber(record, ['amount', 'Amount']);
  const currency = readString(record, ['currency', 'Currency']) || 'INR';
  const receipt = readString(record, ['receipt', 'Receipt']);
  if (!orderId.startsWith('order_') || !key) {
    throw new Error('Appointza CreateOrder did not return a Razorpay order and key.');
  }
  return {
    orderId,
    key,
    amountPaise: Number.isFinite(amount) ? amountToPaise(amount, selected.amountPaise) : selected.amountPaise,
    currency,
    receipt,
  };
}

export async function verifyAppointzaPayment(
  checkout: RazorpayCheckoutSuccess
): Promise<void> {
  await appointzaPost('/api/Payment/VerifyPayment', {
    razorpay_order_id: checkout.razorpay_order_id,
    razorpay_payment_id: checkout.razorpay_payment_id,
    razorpay_signature: checkout.razorpay_signature,
    appointmentid: 0,
    eventbookingid: null,
    organizationid: APPOINTZA_PAYMENT_ORG.organizationid,
  });
}
