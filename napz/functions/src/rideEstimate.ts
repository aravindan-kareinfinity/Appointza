import { HttpsError, onCall } from 'firebase-functions/v2/https';

type LatLng = { lat?: number; lng?: number; address?: string };

type RoutesApiResponse = {
  error?: { message?: string; status?: string };
  routes?: unknown[];
};

const ROUTES_FIELD_MASK = [
  'routes.duration',
  'routes.staticDuration',
  'routes.distanceMeters',
  'routes.description',
  'routes.warnings',
  'routes.routeLabels',
  'routes.polyline.encodedPolyline',
  'routes.viewport',
  'routes.localizedValues',
  'routes.travelAdvisory',
  'routes.travelAdvisory.transitFare',
  'routes.legs.distanceMeters',
  'routes.legs.duration',
  'routes.legs.staticDuration',
  'routes.legs.startLocation',
  'routes.legs.endLocation',
  'routes.legs.polyline.encodedPolyline',
  'routes.legs.localizedValues',
  'routes.legs.travelAdvisory',
  'routes.legs.stepsOverview',
  'routes.legs.steps.distanceMeters',
  'routes.legs.steps.staticDuration',
  'routes.legs.steps.polyline.encodedPolyline',
  'routes.legs.steps.startLocation',
  'routes.legs.steps.endLocation',
  'routes.legs.steps.navigationInstruction',
  'routes.legs.steps.travelMode',
  'routes.legs.steps.transitDetails',
  'routes.legs.steps.transitDetails.stopDetails',
  'routes.legs.steps.transitDetails.localizedValues',
  'routes.legs.steps.transitDetails.headsign',
  'routes.legs.steps.transitDetails.stopCount',
  'routes.legs.steps.transitDetails.transitLine',
].join(',');

function asCoord(value: LatLng | undefined): { latitude: number; longitude: number } | null {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}

function waypoint(
  coord: { latitude: number; longitude: number },
  address: string | undefined
): Record<string, unknown> {
  const trimmed = address?.trim();
  if (trimmed && !/^current location$/i.test(trimmed)) {
    return { address: trimmed };
  }
  return { location: { latLng: coord } };
}

async function computeRoutes(
  key: string,
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  originAddress: string | undefined,
  destinationAddress: string | undefined,
  travelMode: 'TRANSIT' | 'DRIVE' | 'TWO_WHEELER' | 'WALK' | 'BICYCLE',
  extra: Record<string, unknown> = {}
): Promise<RoutesApiResponse> {
  const post = async (originWp: Record<string, unknown>, destinationWp: Record<string, unknown>) => {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': ROUTES_FIELD_MASK,
      },
      body: JSON.stringify({
        origin: originWp,
        destination: destinationWp,
        travelMode,
        languageCode: 'en-IN',
        regionCode: 'IN',
        units: 'METRIC',
        ...extra,
      }),
    });
    return (await response.json()) as RoutesApiResponse;
  };
  let data = await post(waypoint(origin, originAddress), waypoint(destination, destinationAddress));
  if (data.error || !data.routes?.length) {
    data = await post(
      { location: { latLng: origin } },
      { location: { latLng: destination } }
    );
  }
  return data;
}

/**
 * Google Routes v2: full route, step, transit, advisory, and localized details.
 * Set Cloud Run env `GOOGLE_ROUTES_API_KEY` (server key, not the Android Maps key).
 */
export const estimateTransitJourney = onCall({ region: 'asia-south1' }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to estimate a journey.');

  const originInput = request.data?.origin as LatLng | undefined;
  const destinationInput = request.data?.destination as LatLng | undefined;
  const origin = asCoord(originInput);
  const destination = asCoord(destinationInput);
  if (!origin || !destination) {
    throw new HttpsError('invalid-argument', 'origin and destination lat/lng are required.');
  }

  const key = String(
    process.env.GOOGLE_ROUTES_API_KEY ?? 'AIzaSyDz3rVPMTvjWj_Hf92awzw6CJJ2n50wJfo'
  ).trim();
  if (!key) {
    return { configured: false as const };
  }

  const originAddress = typeof originInput?.address === 'string' ? originInput.address : undefined;
  const destinationAddress =
    typeof destinationInput?.address === 'string' ? destinationInput.address : undefined;

  try {
    const directionsParams = new URLSearchParams({
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      mode: 'transit',
      alternatives: 'true',
      departure_time: String(Math.floor(Date.now() / 1000)),
      region: 'in',
      language: 'en',
      key,
    });
    const [transit, drive, twoWheeler, walk, bicycle, directionsTransit] = await Promise.all([
      computeRoutes(key, origin, destination, originAddress, destinationAddress, 'TRANSIT', {
        computeAlternativeRoutes: true,
        departureTime: new Date().toISOString(),
        transitPreferences: {
          routingPreference: 'LESS_WALKING',
          allowedTravelModes: ['BUS', 'SUBWAY', 'TRAIN', 'LIGHT_RAIL', 'RAIL'],
        },
      }),
      computeRoutes(key, origin, destination, originAddress, destinationAddress, 'DRIVE', {
        routingPreference: 'TRAFFIC_AWARE',
        extraComputations: ['TOLLS', 'HTML_FORMATTED_NAVIGATION_INSTRUCTIONS'],
        computeAlternativeRoutes: true,
      }),
      computeRoutes(key, origin, destination, originAddress, destinationAddress, 'TWO_WHEELER'),
      computeRoutes(key, origin, destination, originAddress, destinationAddress, 'WALK', {
        extraComputations: ['HTML_FORMATTED_NAVIGATION_INSTRUCTIONS'],
      }),
      computeRoutes(key, origin, destination, originAddress, destinationAddress, 'BICYCLE', {
        extraComputations: ['HTML_FORMATTED_NAVIGATION_INSTRUCTIONS'],
      }),
      fetch(`https://maps.googleapis.com/maps/api/directions/json?${directionsParams.toString()}`)
        .then((response) => response.json())
        .catch(() => ({ status: 'UNKNOWN_ERROR', routes: [] })),
    ]);

    return {
      configured: true as const,
      transit,
      drive,
      twoWheeler,
      walk,
      bicycle,
      directionsTransit,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Routes request failed';
    throw new HttpsError('unavailable', message);
  }
});
