import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { mergeOlaProductFeeds, type OlaProductOffer } from './olaCatalog';

const olaAppToken = defineSecret('OLA_APP_TOKEN');
const OLA_API_BASE = 'https://devapi.olacabs.com';

function asCoord(value: { lat?: number; lng?: number } | undefined): { lat: number; lng: number } | null {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/**
 * Official Ola ride availability/estimate:
 * https://developers.olacabs.com/docs/ride-estimate
 */
export const olaRideCatalog = onCall({ region: 'asia-south1', secrets: [olaAppToken] }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

  const pickup = asCoord(request.data?.pickup);
  const dropoff = asCoord(request.data?.destination);
  if (!pickup || !dropoff) {
    throw new HttpsError('invalid-argument', 'Pickup and destination coordinates are required.');
  }

  let token = '';
  try {
    token = olaAppToken.value().trim();
  } catch {
    token = '';
  }
  if (!token) {
    return { configured: false as const, products: [] as OlaProductOffer[] };
  }

  const params = new URLSearchParams({
    pickup_lat: String(pickup.lat),
    pickup_lng: String(pickup.lng),
    drop_lat: String(dropoff.lat),
    drop_lng: String(dropoff.lng),
    service_type: 'p2p',
  });

  const response = await fetch(`${OLA_API_BASE}/v1/products?${params.toString()}`, {
    headers: {
      'X-APP-TOKEN': token,
      Accept: 'application/json',
    },
  });
  const json = (await response.json().catch(() => null)) as {
    message?: string;
    code?: string;
    categories?: Array<{ id?: string; display_name?: string; eta?: number }>;
    ride_estimate?: Array<{
      category?: string;
      amount_min?: number;
      amount_max?: number;
      travel_time_in_minutes?: number;
      upfront?: { fare?: number; is_upfront_applicable?: boolean };
    }>;
  } | null;

  if (!response.ok) {
    throw new HttpsError(
      'failed-precondition',
      json?.message || 'Ola did not return estimates for this location.'
    );
  }

  return {
    configured: true as const,
    products: mergeOlaProductFeeds(json?.categories, json?.ride_estimate),
  };
});
