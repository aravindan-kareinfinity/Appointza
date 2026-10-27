import Geolocation from 'react-native-geolocation-service';
import { GEOLOCATION_OPTIONS_BASE } from './LocationDisclosure';

export function startLiveCoordsWatch(
  onCoords: (coords: { lat: number; lng: number }) => void
): () => void {
  const watchId = Geolocation.watchPosition(
    (loc) => onCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude }),
    (error) => console.warn('Location watch error:', error.message),
    {
      ...GEOLOCATION_OPTIONS_BASE,
      distanceFilter: 10,
      interval: 5000,
      fastestInterval: 3000,
    }
  );
  return () => {
    try {
      Geolocation.clearWatch(watchId);
    } catch {}
  };
}
