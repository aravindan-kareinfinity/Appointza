import { fetchGoogleDrivingTraffic, fetchGoogleTransit, mergeGoogleBusOptions } from './googleDirections';
import { fetchGoogleRoutesJourney } from './googleRoutesClient';
import { fetchOsrmOverview } from './osrmRouting';
import { buildProviderCards } from './providerCards';
import type { JourneyEstimate, OverviewModeId, OverviewRoute, RidePlace } from './types';

function preferRoute(
  preferred: OverviewRoute | undefined,
  fallback: OverviewRoute | undefined
): OverviewRoute | undefined {
  return preferred ?? fallback;
}

export async function estimateJourney(
  origin: RidePlace,
  destination: RidePlace
): Promise<JourneyEstimate> {
  const [osrm, routesApi, directionsTransit, directionsDrive] = await Promise.all([
    fetchOsrmOverview(origin, destination).catch(() => [] as OverviewRoute[]),
    fetchGoogleRoutesJourney(origin, destination),
    fetchGoogleTransit(origin, destination),
    fetchGoogleDrivingTraffic(origin, destination),
  ]);

  const osrmByMode = new Map(osrm.map((item) => [item.mode, item]));
  const routesByMode = new Map((routesApi?.overview ?? []).map((item) => [item.mode, item]));

  const modes: OverviewModeId[] = ['walking', 'cycling', 'two_wheeler', 'car', 'transit'];
  const overview: OverviewRoute[] = [];
  for (const mode of modes) {
    if (mode === 'transit') continue;
    const selected = preferRoute(routesByMode.get(mode), osrmByMode.get(mode));
    if (mode === 'car') {
      const car = preferRoute(routesByMode.get('car'), directionsDrive ?? osrmByMode.get('car'));
      if (car) overview.push(car);
      continue;
    }
    if (selected) overview.push(selected);
  }

  const busRoutes = mergeGoogleBusOptions(routesApi?.busRoutes ?? [], directionsTransit.routes);

  let transit = directionsTransit.availability;
  if (busRoutes.length > 0) {
    transit = {
      status: 'ok',
      message:
        'Public transport from Google Routes: line, stops, times, and agency. Fare only when Google publishes it.',
    };
  } else if (routesApi?.transitError) {
    transit = {
      status: 'unavailable',
      message: routesApi.transitError,
    };
  } else if (busRoutes.length === 0) {
    transit = {
      status: transit.status === 'ok' ? 'none' : transit.status,
      message:
        transit.status === 'none'
          ? 'Google Routes found no bus, metro, or train for this pickup and destination.'
          : transit.message,
    };
  }

  if (busRoutes.length > 0) {
    const first = busRoutes[0];
    overview.push({
      mode: 'transit',
      label: 'Public transport',
      distanceMeters: first.distanceMeters,
      durationSeconds: first.durationSeconds,
      durationIsTrafficAware: false,
      source: first.source,
      geometry: first.geometry,
      note: transit.message,
      durationText: first.durationText,
      distanceText: first.distanceText,
      warnings: first.warnings,
      steps: first.legs.map((leg) => ({
        instruction:
          leg.instruction ||
          [leg.lineShortName || leg.lineName, leg.boardingStop?.name, leg.alightingStop?.name]
            .filter(Boolean)
            .join(' · '),
        travelMode: leg.travelMode,
        distanceMeters: leg.distanceMeters,
        durationSeconds: leg.durationSeconds,
      })),
    });
  }

  const shortest =
    overview.reduce<OverviewRoute | null>((best, item) => {
      if (!best || item.distanceMeters < best.distanceMeters) return item;
      return best;
    }, null);
  const fastest =
    overview.reduce<OverviewRoute | null>((best, item) => {
      if (!best || item.durationSeconds < best.durationSeconds) return item;
      return best;
    }, null);

  const previewGeometry =
    overview.find((item) => item.mode === 'car')?.geometry ??
    busRoutes[0]?.geometry ??
    overview[0]?.geometry ??
    [];

  return {
    overview,
    providers: buildProviderCards(overview),
    busRoutes,
    transit,
    previewGeometry,
    shortest,
    fastest,
  };
}
