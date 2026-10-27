import * as admin from 'firebase-admin';
import { defineSecret, defineString } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { mapBlaBlaCarJourneys, type BlaBlaCarRideOffer } from './blaBlaCarCatalog';

const orgLogin = defineSecret('BLABLACAR_PRO_LOGIN');
const orgPassword = defineSecret('BLABLACAR_PRO_PASSWORD');
const apiBase = defineString('BLABLACAR_PRO_API_BASE', {
  default: 'https://ims.blablacar.pro/api',
});

const secrets = [orgLogin, orgPassword];

type OrgToken = { token: string; expiresAt: number };
type CustomerDoc = {
  customerId: string;
  login: string;
  firstName?: string;
  token: string;
  expiresAt: number;
};

function secretValue(param: { value(): string }): string {
  try {
    return param.value().trim();
  } catch {
    return '';
  }
}

function orgCol() {
  return admin.firestore().collection('blaBlaCarProOrg');
}

function customersCol() {
  return admin.firestore().collection('blaBlaCarProCustomers');
}

function isoDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function locationQueries(name: string): string[] {
  const parts = name
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
  const unique = [...new Set([parts[parts.length - 1], parts[0]].filter(Boolean))];
  return unique.slice(0, 2);
}

async function orgRequest(
  path: string,
  init: RequestInit & { token?: string }
): Promise<{ ok: boolean; status: number; json: any }> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Locale': 'en-GB',
    'X-Currency': 'INR',
    'X-Client': 'napz',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  const response = await fetch(`${apiBase.value().replace(/\/$/, '')}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body,
  });
  const json = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, json };
}

async function organizationToken(): Promise<string | null> {
  const login = secretValue(orgLogin);
  const password = secretValue(orgPassword);
  if (!login || !password) return null;

  const cached = await orgCol().doc('token').get();
  const data = cached.data() as Partial<OrgToken> | undefined;
  if (data?.token && typeof data.expiresAt === 'number' && data.expiresAt > Date.now() + 60_000) {
    return data.token;
  }

  const result = await orgRequest('/organizations/authentication/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
  const token = typeof result.json?.token === 'string' ? result.json.token : '';
  if (!result.ok || !token) return null;
  const expiresAt =
    typeof result.json?.token_expires_at === 'number'
      ? result.json.token_expires_at * (result.json.token_expires_at > 10_000_000_000 ? 1 : 1000)
      : Date.now() + 50 * 60 * 1000;
  await orgCol().doc('token').set({
    token,
    expiresAt,
    userId: result.json?.user_id ?? null,
    organizationId: result.json?.organization_id ?? null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return token;
}

async function findLocationId(token: string, placeName: string): Promise<number | null> {
  for (const query of locationQueries(placeName)) {
    const result = await orgRequest('/inventory/geo/locations/search', {
      method: 'POST',
      token,
      body: JSON.stringify({ query, limit: 8 }),
    });
    const locations = Array.isArray(result.json?.locations) ? result.json.locations : [];
    const match = locations.find((row: { id?: number; name?: string }) => typeof row.id === 'number');
    if (match?.id) return match.id;
  }
  return null;
}

export const blaBlaCarProStatus = onCall({ region: 'asia-south1', secrets }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');
  const configured = Boolean(secretValue(orgLogin) && secretValue(orgPassword));
  const snap = await customersCol().doc(uid).get();
  const customer = snap.data() as Partial<CustomerDoc> | undefined;
  const loggedIn =
    Boolean(customer?.customerId) && typeof customer?.expiresAt === 'number' && customer.expiresAt > Date.now();
  return {
    configured,
    loggedIn,
    login: loggedIn ? customer?.login ?? null : null,
    firstName: loggedIn ? customer?.firstName ?? null : null,
  };
});

export const blaBlaCarProLogin = onCall({ region: 'asia-south1', secrets }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to Napz first.');
  const login = String(request.data?.login ?? '').trim();
  const password = String(request.data?.password ?? '');
  if (!login || !password) throw new HttpsError('invalid-argument', 'BlaBlaCar Pro login and password are required.');

  const token = await organizationToken();
  if (!token) {
    throw new HttpsError(
      'failed-precondition',
      'BlaBlaCar Pro partner credentials are not configured on the server.'
    );
  }

  const result = await orgRequest('/inventory/customers/accounts/login', {
    method: 'POST',
    token,
    body: JSON.stringify({ login, password }),
  });
  if (!result.ok) {
    throw new HttpsError('permission-denied', result.json?.message || 'BlaBlaCar Pro login failed.');
  }

  const account = result.json?.account ?? {};
  const authentication = result.json?.authentication ?? {};
  const customerId = String(account.customer_id ?? '');
  const customerToken = String(authentication.token ?? '');
  if (!customerId || !customerToken) {
    throw new HttpsError('failed-precondition', 'BlaBlaCar Pro did not return a customer token.');
  }
  const expiresAt =
    typeof authentication.expires_at === 'number'
      ? authentication.expires_at * (authentication.expires_at > 10_000_000_000 ? 1 : 1000)
      : Date.now() + 12 * 60 * 60 * 1000;

  await customersCol().doc(uid).set({
    customerId,
    login: String(account.login ?? login),
    firstName: account.first_name ?? null,
    token: customerToken,
    expiresAt,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    loggedIn: true,
    login: account.login ?? login,
    firstName: account.first_name ?? null,
  };
});

export const blaBlaCarProLogout = onCall({ region: 'asia-south1' }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');
  await customersCol().doc(uid).delete();
  return { loggedIn: false };
});

export const blaBlaCarProSearch = onCall({ region: 'asia-south1', secrets }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

  const originName = String(request.data?.originName ?? '').trim();
  const destinationName = String(request.data?.destinationName ?? '').trim();
  const departureDate = isoDate(request.data?.departureDate);
  if (!originName || !destinationName || !departureDate) {
    throw new HttpsError('invalid-argument', 'Origin, destination, and departure date are required.');
  }

  const token = await organizationToken();
  if (!token) {
    return { configured: false as const, loggedIn: false, rides: [] as BlaBlaCarRideOffer[] };
  }

  const customerSnap = await customersCol().doc(uid).get();
  const customer = customerSnap.data() as Partial<CustomerDoc> | undefined;
  const loggedIn =
    Boolean(customer?.customerId) && typeof customer?.expiresAt === 'number' && customer.expiresAt > Date.now();
  if (!loggedIn) {
    return { configured: true as const, loggedIn: false, rides: [] as BlaBlaCarRideOffer[] };
  }

  const [originId, destinationId] = await Promise.all([
    findLocationId(token, originName),
    findLocationId(token, destinationName),
  ]);
  if (!originId || !destinationId) {
    return {
      configured: true as const,
      loggedIn: true,
      rides: [] as BlaBlaCarRideOffer[],
      message: 'BlaBlaCar Pro has no matching cities for this pickup and destination.',
    };
  }

  const body: Record<string, unknown> = {
    path: {
      type: 'LOCATION_TO_LOCATION',
      origin_location_id: originId,
      destination_location_id: destinationId,
    },
    departure_date: departureDate,
    date_flexibility: 1,
    passenger_count: 1,
    customer_id: customer!.customerId,
  };

  const result = await orgRequest('/inventory/journeys/search', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
  if (!result.ok) {
    throw new HttpsError('failed-precondition', result.json?.message || 'BlaBlaCar Pro search failed.');
  }

  return {
    configured: true as const,
    loggedIn: true,
    rides: mapBlaBlaCarJourneys(result.json?.journeys).slice(0, 12),
  };
});
