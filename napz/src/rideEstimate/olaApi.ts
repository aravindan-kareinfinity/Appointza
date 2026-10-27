import { napzFunctions } from '../services/firebase/functionsClient';
import type { RidePlace } from './types';
import type { OlaProductOffer } from './olaCatalog';

export async function fetchOlaRideCatalog(
  pickup: RidePlace,
  destination: RidePlace
): Promise<{ configured: boolean; products: OlaProductOffer[] }> {
  const result = await napzFunctions().httpsCallable('olaRideCatalog')({
    pickup: { lat: pickup.lat, lng: pickup.lng },
    destination: { lat: destination.lat, lng: destination.lng },
  });
  const data = (result.data ?? {}) as { configured?: boolean; products?: OlaProductOffer[] };
  return {
    configured: data.configured === true,
    products: Array.isArray(data.products) ? data.products : [],
  };
}
