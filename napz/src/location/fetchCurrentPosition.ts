import { TrackingServiceAPI } from '../services/native/TrackingServiceModule';

export type FetchPositionResult =
  | { ok: true; coords: { lat: number; lng: number } }
  | { ok: false; reason: 'unavailable' | 'permission' | 'timeout' | 'position_unavailable' };

/** Android: TrackingServiceModule → LocationManager. Never import geolocation-service. */
export function fetchCurrentPosition(userInitiated = true): Promise<{ lat: number; lng: number } | null> {
  return fetchCurrentPositionDetailed(userInitiated).then((r) =>
    r.ok ? r.coords : null
  );
}

export function fetchCurrentPositionDetailed(
  userInitiated = true
): Promise<FetchPositionResult> {
  const timeout = userInitiated ? 30000 : 12000;
  return TrackingServiceAPI.getCurrentPosition(timeout)
    .then((coords) => ({ ok: true as const, coords }))
    .catch((e: { code?: string; message?: string }) => {
      const code = String(e?.code || e?.message || '');
      if (code.includes('DISCLOSURE') || code.includes('permission')) {
        return { ok: false, reason: 'permission' };
      }
      if (code.includes('timeout')) return { ok: false, reason: 'timeout' };
      if (code.includes('unavailable')) return { ok: false, reason: 'position_unavailable' };
      return { ok: false, reason: 'unavailable' };
    });
}
