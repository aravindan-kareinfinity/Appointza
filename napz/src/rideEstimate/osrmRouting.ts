import type { OverviewRoute, RideLatLng, RidePlace, RouteSource } from './types';
import { isValidRideCoord } from './formatJourney';

type OsrmProfile = 'driving' | 'walking' | 'cycling';

type OsrmResponse = {
  code?: string;
  routes?: {
    distance?: number;
    duration?: number;
    geometry?: { coordinates?: [number, number][] };
  }[];
};

const OSRM_BASE = 'https://router.project-osrm.org';
const SOURCE: RouteSource = 'osrm';

async function fetchOsrmRoute(
  profile: OsrmProfile,
  origin: RidePlace,
  destination: RidePlace
): Promise<OverviewRoute | null> {
  if (!isValidRideCoord(origin.lat, origin.lng) || !isValidRideCoord(destination.lat, destination.lng)) {
    return null;
  }
  const path = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_BASE}/route/v1/${profile}/${path}?overview=full&geometries=geojson`;
  const response = await fetch(url, { headers: { 'User-Agent': 'napz/1.0' } });
  if (!response.ok) return null;
  const data = (await response.json()) as OsrmResponse;
  const route = data.routes?.[0];
  if (data.code !== 'Ok' || !route || !Number.isFinite(route.duration) || !Number.isFinite(route.distance)) {
    return null;
  }
  const geometry: RideLatLng[] = (route.geometry?.coordinates ?? []).map(([lng, lat]) => ({ lat, lng }));
  return {
    mode: profile === 'driving' ? 'car' : profile === 'walking' ? 'walking' : 'cycling',
    label: profile === 'driving' ? 'Car' : profile === 'walking' ? 'Walking' : 'Cycling',
    distanceMeters: route.distance ?? 0,
    durationSeconds: route.duration ?? 0,
    durationIsTrafficAware: false,
    source: SOURCE,
    geometry,
    note: 'Typical road time from OpenStreetMap routing. Not live traffic.',
  };
}

export async function fetchOsrmOverview(
  origin: RidePlace,
  destination: RidePlace
): Promise<OverviewRoute[]> {
  const [walking, cycling, driving] = await Promise.all([
    fetchOsrmRoute('walking', origin, destination).catch(() => null),
    fetchOsrmRoute('cycling', origin, destination).catch(() => null),
    fetchOsrmRoute('driving', origin, destination).catch(() => null),
  ]);

  const routes: OverviewRoute[] = [];
  if (walking) routes.push(walking);
  if (cycling) routes.push(cycling);
  if (driving) {
    routes.push(driving);
    routes.push({
      ...driving,
      mode: 'two_wheeler',
      label: 'Two-wheeler',
      note:
        'Uses the same road path as car routing. Not a Rapido or Uber time, and not live traffic.',
    });
  }
  return routes;
}
