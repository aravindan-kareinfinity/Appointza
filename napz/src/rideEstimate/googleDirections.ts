import { Platform } from 'react-native';
import { ANDROID_APPLICATION_ID } from '../constants/androidApplicationId';
import {
  GOOGLE_MAPS_ANDROID_CERT_SHA1,
  GOOGLE_MAPS_API_KEY,
  GOOGLE_ROUTES_API_KEY,
} from '../constants/googleMaps';
import { decodePolyline } from './decodePolyline';
import type {
  BusRouteOption,
  OverviewRoute,
  RidePlace,
  TransitAvailability,
  TransitLeg,
} from './types';

type DirectionsStep = {
  travel_mode?: string;
  html_instructions?: string;
  distance?: { value?: number };
  duration?: { value?: number };
  transit_details?: {
    departure_stop?: { name?: string; location?: { lat?: number; lng?: number } };
    arrival_stop?: { name?: string; location?: { lat?: number; lng?: number } };
    departure_time?: { text?: string };
    arrival_time?: { text?: string };
    headway?: number;
    num_stops?: number;
    line?: {
      name?: string;
      short_name?: string;
      vehicle?: { type?: string; name?: string };
    };
  };
};

type DirectionsLeg = {
  distance?: { value?: number };
  duration?: { value?: number };
  duration_in_traffic?: { value?: number };
  arrival_time?: { text?: string };
  departure_time?: { text?: string };
  steps?: DirectionsStep[];
};

type DirectionsRoute = {
  summary?: string;
  overview_polyline?: { points?: string };
  fare?: { text?: string; value?: number; currency?: string };
  legs?: DirectionsLeg[];
};

type DirectionsResponse = {
  status?: string;
  error_message?: string;
  routes?: DirectionsRoute[];
};

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function googleAndroidHeaders(): Record<string, string> {
  return {
    'X-Android-Package': ANDROID_APPLICATION_ID,
    'X-Android-Cert': GOOGLE_MAPS_ANDROID_CERT_SHA1,
  };
}

async function fetchDirections(
  origin: RidePlace,
  destination: RidePlace,
  mode: 'transit' | 'driving',
  extras: Record<string, string> = {}
): Promise<DirectionsResponse> {
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode,
    key: GOOGLE_ROUTES_API_KEY || GOOGLE_MAPS_API_KEY,
    region: 'in',
    language: 'en',
    ...extras,
  });
  const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
  const request = async (headers: Record<string, string>) => {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json() as Promise<DirectionsResponse>;
  };
  let data = await request({});
  if (data.status === 'REQUEST_DENIED' && Platform.OS === 'android') {
    data = await request(googleAndroidHeaders());
  }
  return data;
}

function busOptionKey(route: BusRouteOption): string {
  return `${route.summary}|${route.departureTime ?? ''}|${Math.round(route.durationSeconds / 60)}`;
}

/** Combine Google Routes + Directions. Keep Google’s fare when either source provides it. */
export function mergeGoogleBusOptions(
  routesApi: BusRouteOption[],
  directions: BusRouteOption[]
): BusRouteOption[] {
  const merged = new Map<string, BusRouteOption>();
  for (const option of [...routesApi, ...directions]) {
    const key = busOptionKey(option);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, option);
      continue;
    }
    if (!existing.fareLabel && option.fareLabel) {
      merged.set(key, { ...existing, fareLabel: option.fareLabel });
    }
  }
  return [...merged.values()].sort((a, b) => {
    if (Boolean(b.fareLabel) !== Boolean(a.fareLabel)) return a.fareLabel ? -1 : 1;
    return a.durationSeconds - b.durationSeconds;
  });
}

export function googleMapsFareLabel(fare?: {
  text?: string;
  value?: number;
  currency?: string;
}): string | null {
  const labeled = typeof fare?.text === 'string' ? fare.text.trim() : '';
  if (labeled) return labeled;
  if (Number.isFinite(fare?.value) && fare?.currency) {
    return `${fare.currency} ${fare.value}`;
  }
  return null;
}

function walkMeters(steps: DirectionsStep[] | undefined, first: boolean): number | undefined {
  if (!steps?.length) return undefined;
  const walk = first
    ? steps.find((step) => step.travel_mode === 'WALKING')
    : [...steps].reverse().find((step) => step.travel_mode === 'WALKING');
  const meters = walk?.distance?.value;
  return Number.isFinite(meters) ? meters : undefined;
}

export function parseTransitRoutes(data: DirectionsResponse): BusRouteOption[] {
  if (data.status !== 'OK' || !data.routes?.length) return [];
  return data.routes.flatMap((route, index) => {
    const leg = route.legs?.[0];
    const steps = leg?.steps ?? [];
    const transitSteps = steps.filter((step) => step.travel_mode === 'TRANSIT');
    const transferCount = Math.max(0, transitSteps.length - 1);
    const legs: TransitLeg[] = steps.map((step) => {
      const details = step.transit_details;
      const mode =
        step.travel_mode === 'WALKING'
          ? 'WALK'
          : step.travel_mode === 'TRANSIT'
            ? 'TRANSIT'
            : 'OTHER';
      return {
        instruction: stripHtml(step.html_instructions || ''),
        travelMode: mode,
        distanceMeters: step.distance?.value,
        durationSeconds: step.duration?.value,
        lineName: details?.line?.name,
        lineShortName: details?.line?.short_name,
        vehicleType: details?.line?.vehicle?.name || details?.line?.vehicle?.type,
        boardingStop: details?.departure_stop?.name
          ? {
              name: details.departure_stop.name,
              lat: details.departure_stop.location?.lat,
              lng: details.departure_stop.location?.lng,
            }
          : undefined,
        alightingStop: details?.arrival_stop?.name
          ? {
              name: details.arrival_stop.name,
              lat: details.arrival_stop.location?.lat,
              lng: details.arrival_stop.location?.lng,
            }
          : undefined,
        intermediateStopCount:
          typeof details?.num_stops === 'number'
            ? Math.max(0, details.num_stops - 1)
            : undefined,
        departureTime: details?.departure_time?.text,
        arrivalTime: details?.arrival_time?.text,
      };
    });
    if (transitSteps.length === 0) return [];
    const firstTransit = transitSteps[0]?.transit_details;
    const summary =
      firstTransit?.line?.short_name ||
      firstTransit?.line?.name ||
      route.summary ||
      `Transit option ${index + 1}`;
    return [{
      id: `google-transit-${index}`,
      summary,
      durationSeconds: leg?.duration?.value ?? 0,
      distanceMeters: leg?.distance?.value ?? 0,
      transferCount,
      departureTime: leg?.departure_time?.text || firstTransit?.departure_time?.text,
      arrivalTime: leg?.arrival_time?.text || transitSteps.at(-1)?.transit_details?.arrival_time?.text,
      fareLabel: googleMapsFareLabel(route.fare),
      walkToStopMeters: walkMeters(steps, true),
      walkFromStopMeters: walkMeters(steps, false),
      legs,
      geometry: decodePolyline(route.overview_polyline?.points ?? ''),
      source: 'google_directions',
    }];
  });
}

export function transitAvailabilityFromStatus(
  status: string | undefined,
  routes: BusRouteOption[]
): TransitAvailability {
  if (routes.length > 0) {
    return {
      status: 'ok',
      message: 'Available buses from Google Maps. Fare is shown only when Google returns it.',
    };
  }
  if (status === 'ZERO_RESULTS') {
    return {
      status: 'none',
      message: 'Google Directions found no public-transit route for this pair.',
    };
  }
  if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT' || !status) {
    return {
      status: 'unavailable',
      message:
        'Transit details are unavailable. Enable the Directions API on the Napz Maps key, or open the route in Google Maps.',
    };
  }
  return {
    status: 'unavailable',
    message: 'Transit details are unavailable from Google Directions for this request.',
  };
}

export async function fetchGoogleTransit(
  origin: RidePlace,
  destination: RidePlace
): Promise<{ routes: BusRouteOption[]; availability: TransitAvailability }> {
  try {
    const departureTime = String(Math.floor(Date.now() / 1000));
    const data = await fetchDirections(origin, destination, 'transit', {
      alternatives: 'true',
      departure_time: departureTime,
    });
    const routes = parseTransitRoutes(data);
    return { routes, availability: transitAvailabilityFromStatus(data.status, routes) };
  } catch {
    return {
      routes: [],
      availability: {
        status: 'unavailable',
        message:
          'Could not reach Google Directions for transit. Open the bus route in Google Maps instead.',
      },
    };
  }
}

export async function fetchGoogleDrivingTraffic(
  origin: RidePlace,
  destination: RidePlace
): Promise<OverviewRoute | null> {
  try {
    const data = await fetchDirections(origin, destination, 'driving', {
      departure_time: 'now',
    });
    const route = data.routes?.[0];
    const leg = route?.legs?.[0];
    const trafficSeconds = leg?.duration_in_traffic?.value;
    const durationSeconds = trafficSeconds ?? leg?.duration?.value;
    if (data.status !== 'OK' || !leg || !Number.isFinite(durationSeconds)) return null;
    return {
      mode: 'car',
      label: 'Car',
      distanceMeters: leg.distance?.value ?? 0,
      durationSeconds: durationSeconds as number,
      durationIsTrafficAware: Number.isFinite(trafficSeconds),
      source: 'google_directions',
      geometry: decodePolyline(route?.overview_polyline?.points ?? ''),
      note: Number.isFinite(trafficSeconds)
        ? 'Traffic-aware driving time from Google Directions. Not an Uber or Rapido fare.'
        : 'Driving time from Google Directions. Not live traffic, and not an Uber or Rapido fare.',
    };
  } catch {
    return null;
  }
}
