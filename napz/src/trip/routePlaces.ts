import { ANDROID_APPLICATION_ID } from '../constants/androidApplicationId';
import { GOOGLE_MAPS_ANDROID_CERT_SHA1, GOOGLE_MAPS_API_KEY } from '../constants/googleMaps';
import {
  breakTitle,
  pickListedPlace,
  slotForStop,
  townFromGeocode,
  type AddressComponent,
  type PlacePick,
} from './breakLabels';
import { fill, t } from './i18n';
import type { TripPlan, TripStop } from './types';

type GeocodeResult = { address_components?: AddressComponent[] };
type NearbyResult = {
  name?: string;
  rating?: number;
  geometry?: { location?: { lat?: number; lng?: number } };
  photos?: { photo_reference?: string }[];
};

const townCache = new Map<string, string | null>();
const placeCache = new Map<string, PlacePick | null>();
const photoCache = new Map<string, string | undefined>();

function androidHeaders(): Record<string, string> {
  return {
    'X-Android-Package': ANDROID_APPLICATION_ID,
    'X-Android-Cert': GOOGLE_MAPS_ANDROID_CERT_SHA1,
  };
}

async function resolvePhoto(reference?: string): Promise<string | undefined> {
  if (!reference) return undefined;
  if (photoCache.has(reference)) return photoCache.get(reference);
  const requestUrl =
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800` +
    `&photo_reference=${encodeURIComponent(reference)}&key=${GOOGLE_MAPS_API_KEY}`;
  try {
    const response = await fetch(requestUrl, { headers: androidHeaders() });
    const finalUrl = response.url && !response.url.includes('photo_reference') ? response.url : requestUrl;
    const usable = response.ok ? finalUrl : undefined;
    photoCache.set(reference, usable);
    return usable;
  } catch {
    photoCache.set(reference, undefined);
    return undefined;
  }
}

function cacheKey(lat: number, lng: number, extra = ''): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}${extra}`;
}

async function googleGet<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { headers: androidHeaders() });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

async function townAt(lat: number, lng: number): Promise<string | null> {
  const key = cacheKey(lat, lng);
  if (townCache.has(key)) return townCache.get(key) ?? null;
  let town: string | null = null;
  try {
    const data = await googleGet<{ results?: GeocodeResult[]; status?: string }>(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}` +
        `&result_type=locality|administrative_area_level_3|sublocality&key=${GOOGLE_MAPS_API_KEY}`
    );
    town = townFromGeocode(data?.results ?? []);
    if (!town) {
      const broad = await googleGet<{ results?: GeocodeResult[] }>(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      town = townFromGeocode(broad?.results ?? []);
    }
  } catch {
    town = null;
  }
  if (!town) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'napz/1.0' } }
      );
      if (response.ok) {
        const payload = (await response.json()) as {
          address?: { town?: string; city?: string; village?: string; county?: string };
        };
        town = payload.address?.town || payload.address?.city || payload.address?.village || payload.address?.county || null;
      }
    } catch {
      town = null;
    }
  }
  townCache.set(key, town);
  return town;
}

async function nearbyPlace(lat: number, lng: number, type: 'restaurant' | 'cafe' | 'lodging' | 'gas_station'): Promise<PlacePick | null> {
  const key = cacheKey(lat, lng, `:${type}`);
  if (placeCache.has(key)) return placeCache.get(key) ?? null;
  let picked: PlacePick | null = null;
  try {
    const data = await googleGet<{ results?: NearbyResult[]; status?: string }>(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}` +
        `&radius=5000&type=${type}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const hits: PlacePick[] = (data?.results ?? []).slice(0, 8).map((item) => ({
      name: item.name ?? '',
      rating: item.rating,
      lat: item.geometry?.location?.lat ?? Number.NaN,
      lng: item.geometry?.location?.lng ?? Number.NaN,
      photoRef: item.photos?.[0]?.photo_reference,
    }));
    picked = pickListedPlace(hits);
  } catch {
    picked = null;
  }
  placeCache.set(key, picked);
  return picked;
}

function kmAlong(stop: TripStop, oneWayKm: number): number {
  if (stop.leg === 'back') return oneWayKm + (1 - Math.min(stop.outStart, stop.outEnd)) * oneWayKm;
  return Math.max(stop.outStart, stop.outEnd) * oneWayKm;
}

async function labelStop(stop: TripStop, plan: TripPlan): Promise<TripStop | null> {
  if (stop.kind !== 'break' && stop.kind !== 'ghat_hold') return null;
  const lang = plan.request.lang;
  const town = await townAt(stop.lat, stop.lng);
  if (!town) return null;
  const slot = slotForStop(stop, plan.utcOffsetMinutes);
  if (slot === 'rest') {
    const lodge = await nearbyPlace(stop.lat, stop.lng, 'lodging');
    return {
      ...stop,
      name: lodge ? fill(t(lang, 'restTownPlace'), { town, place: lodge.name }) : fill(t(lang, 'restTown'), { town }),
      tip: lodge ? t(lang, 'teaShopTip') : t(lang, 'ghatTip'),
      description: lodge
        ? fill(t(lang, 'restTownPlace'), { town, place: lodge.name })
        : fill(t(lang, 'restTown'), { town }),
      lat: lodge?.lat ?? stop.lat,
      lng: lodge?.lng ?? stop.lng,
      photoUrl: await resolvePhoto(lodge?.photoRef),
    };
  }
  const kind = slot === 'tea' ? 'cafe' : 'restaurant';
  let place = await nearbyPlace(stop.lat, stop.lng, kind);
  if (!place && slot !== 'tea') place = await nearbyPlace(stop.lat, stop.lng, 'cafe');
  const fuelEvery = plan.request.mode === 'bike' ? 150 : plan.request.mode === 'car' ? 300 : 0;
  let fuel = '';
  if (fuelEvery > 0) {
    const km = kmAlong(stop, plan.routeMeta.oneWayKm);
    const pastMark = km % fuelEvery;
    if (km >= fuelEvery && pastMark < 80) {
      const station = await nearbyPlace(stop.lat, stop.lng, 'gas_station');
      if (station) fuel = ` ${fill(t(lang, 'fuelNote'), { place: station.name })}`;
    }
  }
  const titled = place
    ? breakTitle(lang, slot, town, place.name)
    : slot === 'tea'
      ? breakTitle(lang, slot, town)
      : fill(t(lang, 'highwayFood'), { town });
  return {
    ...stop,
    name: titled,
    tip: place ? t(lang, 'teaShopTip') : t(lang, 'teaNearTip'),
    description: `${place ? breakTitle(lang, slot, town, place.name) : fill(t(lang, 'highwayFood'), { town })}.${fuel}`.trim(),
    lat: place?.lat ?? stop.lat,
    lng: place?.lng ?? stop.lng,
    photoUrl: await resolvePhoto(place?.photoRef),
  };
}

async function photoForQuery(query: string, lat: number, lng: number): Promise<string | undefined> {
  const key = cacheKey(lat, lng, `:q:${query}`);
  if (photoCache.has(key)) return photoCache.get(key);
  try {
    const data = await googleGet<{ results?: NearbyResult[] }>(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}` +
        `&location=${lat},${lng}&radius=30000&key=${GOOGLE_MAPS_API_KEY}`
    );
    const ref = data?.results?.find((item) => item.photos?.[0]?.photo_reference)?.photos?.[0]?.photo_reference;
    const url = await resolvePhoto(ref);
    photoCache.set(key, url);
    return url;
  } catch {
    photoCache.set(key, undefined);
    return undefined;
  }
}

/** Names each break from the town you have reached by that clock time, plus a listed place. */
export async function attachRoutePlaces(plan: TripPlan): Promise<TripPlan> {
  const stops = plan.days.flatMap((day) => day.stops);
  const updates = new Map<string, TripStop>();
  await Promise.all(
    stops.map(async (stop) => {
      if (stop.kind === 'break' || stop.kind === 'ghat_hold') {
        const next = await labelStop(stop, plan);
        if (next) updates.set(stop.id, next);
        return;
      }
      if (stop.kind === 'activity' || (stop.kind === 'arrive' && stop.leg === 'out')) {
        const query = stop.kind === 'arrive' ? plan.request.destination.name : `${stop.name} ${plan.request.destination.name}`;
        const photoUrl = await photoForQuery(query, stop.lat, stop.lng);
        if (photoUrl) updates.set(stop.id, { ...stop, photoUrl });
      }
    })
  );
  if (updates.size === 0) return plan;
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      stops: day.stops.map((stop) => updates.get(stop.id) ?? stop),
    })),
  };
}
