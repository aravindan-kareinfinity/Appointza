import Geolocation from 'react-native-geolocation-service';
import { GEOLOCATION_OPTIONS_BASE } from './LocationDisclosure';

export type FetchPositionResult =
  | { ok: true; coords: { lat: number; lng: number } }
  | { ok: false; reason: 'unavailable' | 'permission' | 'timeout' | 'position_unavailable' };

type FetchPositionFailure = Extract<FetchPositionResult, { ok: false }>;

function mapGeoError(error?: { code?: number } | null): FetchPositionFailure['reason'] {
  const code = error?.code;
  if (code === 1) return 'permission';
  if (code === 3) return 'timeout';
  if (code === 2) return 'position_unavailable';
  return 'unavailable';
}

export function fetchCurrentPosition(userInitiated = true): Promise<{ lat: number; lng: number } | null> {
  return fetchCurrentPositionDetailed(userInitiated).then((r) =>
    r.ok ? r.coords : null
  );
}

export function fetchCurrentPositionDetailed(
  userInitiated = true
): Promise<FetchPositionResult> {
  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (position) =>
        resolve({
          ok: true,
          coords: { lat: position.coords.latitude, lng: position.coords.longitude },
        }),
      (error) => resolve({ ok: false, reason: mapGeoError(error) }),
      {
        ...GEOLOCATION_OPTIONS_BASE,
        timeout: userInitiated ? 30000 : 12000,
        maximumAge: userInitiated ? 0 : 5000,
      }
    );
  });
}
