import { napzFunctions } from '../services/firebase/functionsClient';
import { mergeGoogleBusOptions, parseTransitRoutes as parseDirectionsTransit } from './googleDirections';
import { computeJourneyModesHttp } from './googleRoutesHttp';
import { parseOverviewRoute, parseTransitRoutes, type RoutesRoute } from './googleRoutesParse';
import type { BusRouteOption, OverviewRoute, RidePlace } from './types';

type RoutesPayload = {
  configured?: boolean;
  transit?: { error?: { message?: string }; routes?: RoutesRoute[] };
  drive?: { routes?: RoutesRoute[] };
  twoWheeler?: { routes?: RoutesRoute[] };
  walk?: { routes?: RoutesRoute[] };
  bicycle?: { routes?: RoutesRoute[] };
  directionsTransit?: { status?: string; routes?: unknown[] };
};

function overviewFromModes(data: {
  drive?: { routes?: RoutesRoute[] };
  twoWheeler?: { routes?: RoutesRoute[] };
  walk?: { routes?: RoutesRoute[] };
  bicycle?: { routes?: RoutesRoute[] };
}): OverviewRoute[] {
  const overview: OverviewRoute[] = [];
  const drive = parseOverviewRoute(
    data.drive?.routes?.[0],
    'car',
    'Car',
    true,
    'Traffic-aware driving from Google Routes. Not an Uber or Rapido fare.'
  );
  const bike = parseOverviewRoute(
    data.twoWheeler?.routes?.[0],
    'two_wheeler',
    'Two-wheeler',
    false,
    'Google Routes TWO_WHEELER (motorized). Not a Rapido fare.'
  );
  const walk = parseOverviewRoute(
    data.walk?.routes?.[0],
    'walking',
    'Walking',
    false,
    'Walking route from Google Routes.'
  );
  const cycle = parseOverviewRoute(
    data.bicycle?.routes?.[0],
    'cycling',
    'Cycling',
    false,
    'Cycling route from Google Routes.'
  );
  if (drive) overview.push(drive);
  if (bike) overview.push(bike);
  if (walk) overview.push(walk);
  if (cycle) overview.push(cycle);
  return overview;
}

export async function fetchGoogleRoutesJourney(
  origin: RidePlace,
  destination: RidePlace
): Promise<{
  configured: boolean;
  busRoutes: BusRouteOption[];
  overview: OverviewRoute[];
  transitError?: string;
} | null> {
  let payload: RoutesPayload | null = null;
  try {
    const callable = napzFunctions().httpsCallable('estimateTransitJourney');
    const result = await callable({
      origin: { lat: origin.lat, lng: origin.lng, address: origin.name },
      destination: { lat: destination.lat, lng: destination.lng, address: destination.name },
    });
    payload = (result.data ?? {}) as RoutesPayload;
  } catch {
    payload = null;
  }

  const functionReady = Boolean(payload?.configured && !payload.transit?.error);
  const functionTransit = parseTransitRoutes(payload?.transit?.routes);
  const functionOverview = payload?.configured ? overviewFromModes(payload) : [];

  if (functionReady && (functionTransit.length > 0 || functionOverview.length > 0)) {
    return {
      configured: true,
      overview: functionOverview,
      busRoutes: mergeGoogleBusOptions(
        functionTransit,
        parseDirectionsTransit({
          status: payload?.directionsTransit?.status,
          routes: payload?.directionsTransit?.routes as never,
        })
      ),
    };
  }

  try {
    const http = await computeJourneyModesHttp(origin, destination);
    const transitError = http.transit.error?.message;
    return {
      configured: !transitError,
      transitError,
      overview: overviewFromModes(http),
      busRoutes: mergeGoogleBusOptions(
        parseTransitRoutes(http.transit.routes),
        parseDirectionsTransit({
          status: payload?.directionsTransit?.status,
          routes: payload?.directionsTransit?.routes as never,
        })
      ),
    };
  } catch {
    if (!payload) return null;
    return {
      configured: Boolean(payload.configured),
      transitError: payload.transit?.error?.message,
      overview: functionOverview,
      busRoutes: functionTransit,
    };
  }
}
