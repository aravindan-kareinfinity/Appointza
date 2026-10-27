import { GOOGLE_ROUTES_API_KEY } from '../constants/googleMaps';
import type { RidePlace } from './types';
import type { RoutesRoute } from './googleRoutesParse';

export type RoutesTravelMode = 'TRANSIT' | 'DRIVE' | 'TWO_WHEELER' | 'WALK' | 'BICYCLE';

export type RoutesApiResponse = {
  error?: { message?: string; status?: string };
  routes?: RoutesRoute[];
};

/** Matches Google Routes docs: transit details, steps, fare, localized text. */
export const ROUTES_FIELD_MASK = [
  'routes.duration',
  'routes.staticDuration',
  'routes.distanceMeters',
  'routes.description',
  'routes.warnings',
  'routes.polyline.encodedPolyline',
  'routes.localizedValues',
  'routes.travelAdvisory',
  'routes.travelAdvisory.transitFare',
  'routes.legs.distanceMeters',
  'routes.legs.duration',
  'routes.legs.staticDuration',
  'routes.legs.localizedValues',
  'routes.legs.stepsOverview',
  'routes.legs.steps.distanceMeters',
  'routes.legs.steps.staticDuration',
  'routes.legs.steps.polyline.encodedPolyline',
  'routes.legs.steps.startLocation',
  'routes.legs.steps.endLocation',
  'routes.legs.steps.navigationInstruction',
  'routes.legs.steps.travelMode',
  'routes.legs.steps.transitDetails',
].join(',');

export function routesWaypoint(place: RidePlace): Record<string, unknown> {
  const address = place.name.trim();
  const skipAddress = !address || /^current location$/i.test(address);
  if (!skipAddress) {
    return { address };
  }
  return {
    location: { latLng: { latitude: place.lat, longitude: place.lng } },
  };
}

export async function computeRoutesHttp(
  origin: RidePlace,
  destination: RidePlace,
  travelMode: RoutesTravelMode,
  extra: Record<string, unknown> = {}
): Promise<RoutesApiResponse> {
  const body = {
    origin: routesWaypoint(origin),
    destination: routesWaypoint(destination),
    travelMode,
    languageCode: 'en-IN',
    regionCode: 'IN',
    units: 'METRIC',
    ...extra,
  };
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_ROUTES_API_KEY,
    'X-Goog-FieldMask': ROUTES_FIELD_MASK,
  };
  const post = async (payload: Record<string, unknown>) => {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return (await response.json()) as RoutesApiResponse;
  };
  let data = await post(body);
  const usedAddress = 'address' in body.origin || 'address' in body.destination;
  if (usedAddress && (!data.routes?.length || data.error)) {
    data = await post({
      ...body,
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
    });
  }
  return data;
}

export async function computeJourneyModesHttp(
  origin: RidePlace,
  destination: RidePlace
): Promise<{
  transit: RoutesApiResponse;
  drive: RoutesApiResponse;
  twoWheeler: RoutesApiResponse;
  walk: RoutesApiResponse;
  bicycle: RoutesApiResponse;
}> {
  const empty: RoutesApiResponse = { routes: [] };
  const [transit, drive, twoWheeler, walk, bicycle] = await Promise.all([
    computeRoutesHttp(origin, destination, 'TRANSIT', {
      computeAlternativeRoutes: true,
      departureTime: new Date().toISOString(),
      transitPreferences: {
        routingPreference: 'LESS_WALKING',
        allowedTravelModes: ['BUS', 'SUBWAY', 'TRAIN', 'LIGHT_RAIL', 'RAIL'],
      },
    }).catch(() => empty),
    computeRoutesHttp(origin, destination, 'DRIVE', {
      routingPreference: 'TRAFFIC_AWARE',
      extraComputations: ['TOLLS', 'HTML_FORMATTED_NAVIGATION_INSTRUCTIONS'],
    }).catch(() => empty),
    computeRoutesHttp(origin, destination, 'TWO_WHEELER').catch(() => empty),
    computeRoutesHttp(origin, destination, 'WALK').catch(() => empty),
    computeRoutesHttp(origin, destination, 'BICYCLE').catch(() => empty),
  ]);
  return { transit, drive, twoWheeler, walk, bicycle };
}
