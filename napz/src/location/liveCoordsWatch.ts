import { subscribeNapzLocation, TrackingServiceAPI } from '../services/native/TrackingServiceModule';

/** Android live watch: LocationManager via TrackingServiceModule. */
export function startLiveCoordsWatch(
  onCoords: (coords: { lat: number; lng: number }) => void
): () => void {
  const unsub = subscribeNapzLocation(onCoords);
  TrackingServiceAPI.startPositionWatch().catch(() => {});
  return () => {
    unsub();
    TrackingServiceAPI.stopPositionWatch().catch(() => {});
  };
}
