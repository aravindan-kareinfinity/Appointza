import { randomUUID } from 'crypto';
import * as admin from 'firebase-admin';
import { defineSecret, defineString } from 'firebase-functions/params';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { becknAuthHeader } from './becknSign';
import { parseOnSearch, type NammaYatriOffer } from './becknCatalog';

const subscriberId = defineSecret('BECKN_SUBSCRIBER_ID');
const uniqueKeyId = defineSecret('BECKN_UNIQUE_KEY_ID');
const signingKey = defineSecret('BECKN_SIGNING_PRIVATE_KEY');
const gatewayUrl = defineString('BECKN_GATEWAY_URL', { default: '' });
const bapUri = defineString('BECKN_BAP_URI', { default: '' });
const domain = defineString('BECKN_DOMAIN', { default: 'ONDC:TRV10' });
const coreVersion = defineString('BECKN_CORE_VERSION', { default: '2.0.0' });
const city = defineString('BECKN_CITY', { default: '*' });

const secrets = [subscriberId, uniqueKeyId, signingKey];
const POLL_MS = 8000;
const POLL_STEP_MS = 800;
const MAX_RESPONSES_PER_SEARCH = 20;

const searches = () => admin.firestore().collection('becknSearches');

function asCoord(value: { lat?: number; lng?: number } | undefined): { lat: number; lng: number } | null {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function secret(param: { value(): string }): string {
  try {
    return param.value().trim();
  } catch {
    return '';
  }
}

/**
 * Namma Yatri fares through the Beckn/ONDC mobility network (we act as a buyer app).
 * Beckn is asynchronous: `search` goes to the gateway, sellers answer on `on_search`.
 * Returns `{ configured: false }` until ONDC onboarding secrets and the callback URL are set.
 */
export const nammaYatriRideCatalog = onCall({ region: 'asia-south1', secrets }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

  const pickup = asCoord(request.data?.pickup);
  const dropoff = asCoord(request.data?.destination);
  if (!pickup || !dropoff) {
    throw new HttpsError('invalid-argument', 'Pickup and destination coordinates are required.');
  }

  const subscriber = secret(subscriberId);
  const keyId = secret(uniqueKeyId);
  const privateKey = secret(signingKey);
  const gateway = gatewayUrl.value().trim();
  const callbackUri = bapUri.value().trim();
  if (!subscriber || !keyId || !privateKey || !gateway || !callbackUri) {
    return { configured: false as const, offers: [] as NammaYatriOffer[] };
  }

  const transactionId = randomUUID();
  await searches().doc(transactionId).set({
    uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: Date.now() + 2 * 60 * 1000,
  });

  const body = JSON.stringify({
    context: {
      domain: domain.value(),
      action: 'search',
      country: 'IND',
      city: city.value(),
      core_version: coreVersion.value(),
      bap_id: subscriber,
      bap_uri: callbackUri,
      transaction_id: transactionId,
      message_id: randomUUID(),
      timestamp: new Date().toISOString(),
      ttl: 'PT30S',
    },
    message: {
      intent: {
        fulfillment: {
          type: 'DELIVERY',
          stops: [
            { type: 'START', location: { gps: `${pickup.lat},${pickup.lng}` } },
            { type: 'END', location: { gps: `${dropoff.lat},${dropoff.lng}` } },
          ],
        },
      },
    },
  });

  const response = await fetch(`${gateway.replace(/\/$/, '')}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: becknAuthHeader({ body, subscriberId: subscriber, uniqueKeyId: keyId, privateKeyBase64: privateKey }),
    },
    body,
  });
  if (!response.ok) {
    throw new HttpsError('unavailable', `ONDC gateway rejected the search (${response.status}).`);
  }

  const deadline = Date.now() + POLL_MS;
  let docs: admin.firestore.QueryDocumentSnapshot[] = [];
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_STEP_MS));
    docs = (await searches().doc(transactionId).collection('responses').get()).docs;
    if (docs.length >= 3) break;
  }

  const offers = parseOnSearch(docs.map((d) => JSON.parse(d.get('payload') as string)));
  return { configured: true as const, offers };
});

/**
 * Beckn `on_search` callback. Only accepts transaction ids created by our own search.
 * TODO: verify the sender signature against the ONDC registry before trusting payloads.
 */
export const nammaYatriOnSearch = onRequest({ region: 'asia-south1' }, async (req, res) => {
  const ack = { message: { ack: { status: 'ACK' } } };
  const transactionId = String(req.body?.context?.transaction_id ?? '');
  if (req.method !== 'POST' || !transactionId) {
    res.status(400).json({ message: { ack: { status: 'NACK' } } });
    return;
  }

  const searchRef = searches().doc(transactionId);
  const search = await searchRef.get();
  if (!search.exists || Number(search.get('expiresAt')) < Date.now()) {
    res.status(404).json({ message: { ack: { status: 'NACK' } } });
    return;
  }

  const responses = searchRef.collection('responses');
  if ((await responses.count().get()).data().count < MAX_RESPONSES_PER_SEARCH) {
    await responses.add({ payload: JSON.stringify(req.body), receivedAt: Date.now() });
  }
  res.json(ack);
});
