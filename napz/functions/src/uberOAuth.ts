import { randomBytes } from 'crypto';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { mergeUberProductFeeds, type UberProductOffer } from './uberCatalog';

const uberClientId = defineSecret('UBER_CLIENT_ID');
const uberClientSecret = defineSecret('UBER_CLIENT_SECRET');

const TOKEN_URL = 'https://auth.uber.com/oauth/v2/token';
const AUTHORIZE_URL = 'https://auth.uber.com/oauth/v2/authorize';
const API = 'https://api.uber.com/v1.2';
const APP_RETURN = 'napz://uber-oauth';
const STATE_TTL_MS = 10 * 60 * 1000;

type UberTokenDoc = {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt: number;
};

type UberTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number | string;
  scope?: string;
  error?: string;
  error_description?: string;
};

function functionsOrigin(): string {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || '';
  return `https://asia-south1-${projectId}.cloudfunctions.net`;
}

export function uberRedirectUri(): string {
  return `${functionsOrigin()}/uberOAuthCallback`;
}

const uberSecrets = [uberClientId, uberClientSecret];

function tokensCol() {
  return admin.firestore().collection('uberOAuth');
}

function statesCol() {
  return admin.firestore().collection('uberOAuthStates');
}

function htmlPage(title: string, body: string, redirect?: string): string {
  const jump = redirect
    ? `<script>window.location.replace(${JSON.stringify(redirect)});</script>`
    : '';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head><body style="font-family:sans-serif;padding:24px">${body}${jump}</body></html>`;
}

async function exchangeToken(params: Record<string, string>): Promise<UberTokenDoc> {
  const body = new URLSearchParams({
    client_id: uberClientId.value(),
    client_secret: uberClientSecret.value(),
    ...params,
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });
  const json = (await response.json()) as UberTokenResponse;
  if (!response.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || 'Uber token exchange failed');
  }
  const expiresIn = Number(json.expires_in);
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    tokenType: json.token_type,
    scope: json.scope,
    expiresAt: Date.now() + (Number.isFinite(expiresIn) ? expiresIn * 1000 : 30 * 60 * 1000) - 60_000,
  };
}

async function readToken(uid: string): Promise<UberTokenDoc | null> {
  const snap = await tokensCol().doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as Partial<UberTokenDoc>;
  if (!data.accessToken || typeof data.expiresAt !== 'number') return null;
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    tokenType: data.tokenType,
    scope: data.scope,
    expiresAt: data.expiresAt,
  };
}

async function saveToken(uid: string, token: UberTokenDoc): Promise<void> {
  await tokensCol().doc(uid).set({
    ...token,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function applicationAccessToken(): Promise<string | null> {
  const snap = await tokensCol().doc('_app').get();
  const data = snap.data() as Partial<UberTokenDoc> | undefined;
  if (data?.accessToken && typeof data.expiresAt === 'number' && data.expiresAt > Date.now()) {
    return data.accessToken;
  }
  try {
    const token = await exchangeToken({ grant_type: 'client_credentials' });
    await tokensCol().doc('_app').set({
      ...token,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return token.accessToken;
  } catch {
    return null;
  }
}

async function validAccessToken(uid: string): Promise<string | null> {
  const stored = await readToken(uid);
  if (!stored) return null;
  if (stored.expiresAt > Date.now()) return stored.accessToken;
  if (!stored.refreshToken) return null;
  const refreshed = await exchangeToken({
    grant_type: 'refresh_token',
    refresh_token: stored.refreshToken,
  });
  await saveToken(uid, {
    ...refreshed,
    refreshToken: refreshed.refreshToken || stored.refreshToken,
  });
  return refreshed.accessToken;
}

async function uberGet<T>(accessToken: string, path: string): Promise<{ ok: boolean; status: number; json: T | null }> {
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Accept-Language': 'en_IN' },
  });
  const json = (await response.json().catch(() => null)) as T | null;
  return { ok: response.ok, status: response.status, json };
}

function asCoord(value: { lat?: number; lng?: number } | undefined): { lat: number; lng: number } | null {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export const uberAuthStart = onCall({ region: 'asia-south1', secrets: uberSecrets }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to connect Uber.');
  const clientId = uberClientId.value();
  if (!clientId) throw new HttpsError('failed-precondition', 'Uber client is not configured.');

  const state = randomBytes(24).toString('hex');
  await statesCol().doc(state).set({
    uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: Date.now() + STATE_TTL_MS,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: uberRedirectUri(),
    response_type: 'code',
  });
  return {
    authorizeUrl: `${AUTHORIZE_URL}?${params.toString()}`,
    redirectUri: uberRedirectUri(),
  };
});

export const uberOAuthCallback = onRequest(
  { region: 'asia-south1', cors: true, secrets: uberSecrets, invoker: 'public' },
  async (req, res) => {
    const fail = (message: string) => {
      res
        .status(200)
        .send(htmlPage('Uber', `<p>${message}</p><p>You can close this tab and return to Napz.</p>`, `${APP_RETURN}?ok=0`));
    };

    try {
      const error = typeof req.query.error === 'string' ? req.query.error : '';
      if (error) {
        fail(error === 'access_denied' ? 'Uber access was declined.' : `Uber authorization failed (${error}).`);
        return;
      }
      const code = typeof req.query.code === 'string' ? req.query.code.trim() : '';
      const state = typeof req.query.state === 'string' ? req.query.state.trim() : '';
      if (!code || !state) {
        fail('Missing authorization code. Add this redirect URI in the Uber dashboard, then try again.');
        return;
      }

      const stateSnap = await statesCol().doc(state).get();
      const stateData = stateSnap.data() as { uid?: string; expiresAt?: number } | undefined;
      await statesCol().doc(state).delete().catch(() => {});
      if (!stateData?.uid || (typeof stateData.expiresAt === 'number' && stateData.expiresAt < Date.now())) {
        fail('This Uber sign-in expired. Try Connect Uber again.');
        return;
      }

      const token = await exchangeToken({
        grant_type: 'authorization_code',
        redirect_uri: uberRedirectUri(),
        code,
      });
      await saveToken(stateData.uid, token);
      res
        .status(200)
        .send(htmlPage('Uber connected', '<p>Uber is connected. Returning to Napz…</p>', `${APP_RETURN}?ok=1`));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not finish Uber sign-in.';
      fail(message);
    }
  }
);

export const uberConnectionStatus = onCall({ region: 'asia-south1', secrets: uberSecrets }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');
  const stored = await readToken(uid);
  if (!stored) return { connected: false as const };
  try {
    const access = await validAccessToken(uid);
    return { connected: Boolean(access), scope: stored.scope ?? null };
  } catch {
    return { connected: false as const };
  }
});

export const uberDisconnect = onCall({ region: 'asia-south1' }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');
  await tokensCol().doc(uid).delete();
  return { connected: false as const };
});

export const uberRideCatalog = onCall({ region: 'asia-south1', secrets: uberSecrets }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');
  const pickup = asCoord(request.data?.pickup);
  const dropoff = asCoord(request.data?.destination);
  if (!pickup) throw new HttpsError('invalid-argument', 'Pickup coordinates are required.');

  let userToken = await validAccessToken(uid);
  const connected = Boolean(userToken);
  let access = userToken ?? (await applicationAccessToken());
  if (!access) {
    return { connected: false as const, products: [] as UberProductOffer[] };
  }

  const productsPath = `/products?latitude=${pickup.lat}&longitude=${pickup.lng}`;
  const pricePath = dropoff
    ? `/estimates/price?start_latitude=${pickup.lat}&start_longitude=${pickup.lng}&end_latitude=${dropoff.lat}&end_longitude=${dropoff.lng}`
    : null;
  const timePath = `/estimates/time?start_latitude=${pickup.lat}&start_longitude=${pickup.lng}`;

  type PriceRow = {
    product_id?: string;
    display_name?: string;
    estimate?: string;
    currency_code?: string;
    low_estimate?: number;
    high_estimate?: number;
    duration?: number;
    surge_multiplier?: number;
  };

  const call = async (token: string) => {
    const [products, prices, times] = await Promise.all([
      uberGet<{ products?: Array<{ product_id?: string; display_name?: string; description?: string; capacity?: number }> }>(
        token,
        productsPath
      ),
      pricePath
        ? uberGet<{ prices?: PriceRow[] }>(token, pricePath)
        : Promise.resolve({ ok: true, status: 200, json: { prices: [] as PriceRow[] } }),
      uberGet<{ times?: Array<{ product_id?: string; estimate?: number }> }>(token, timePath),
    ]);
    return { products, prices, times };
  };

  let result = await call(access);
  if (result.products.status === 401 || result.prices.status === 401) {
    const stored = await readToken(uid);
    if (stored?.refreshToken) {
      const refreshed = await exchangeToken({
        grant_type: 'refresh_token',
        refresh_token: stored.refreshToken,
      });
      await saveToken(uid, { ...refreshed, refreshToken: refreshed.refreshToken || stored.refreshToken });
      access = refreshed.accessToken;
      result = await call(access);
    } else {
      const appToken = await applicationAccessToken();
      if (appToken && appToken !== access) {
        access = appToken;
        result = await call(access);
      }
    }
  }

  const products = mergeUberProductFeeds(
    result.products.json?.products,
    result.prices.json && 'prices' in result.prices.json ? result.prices.json.prices : [],
    result.times.json?.times
  );

  return { connected, products };
});
