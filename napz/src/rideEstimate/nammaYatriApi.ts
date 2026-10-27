import { napzFunctions } from '../services/firebase/functionsClient';
import type { RidePlace } from './types';

export type NammaYatriOffer = {
  bppId: string;
  sellerName: string;
  vehicle: string;
  estimate: string | null;
  durationMinutes: number | null;
};

export async function fetchNammaYatriCatalog(
  pickup: RidePlace,
  destination: RidePlace
): Promise<{ configured: boolean; offers: NammaYatriOffer[] }> {
  const result = await napzFunctions().httpsCallable('nammaYatriRideCatalog')({
    pickup: { lat: pickup.lat, lng: pickup.lng },
    destination: { lat: destination.lat, lng: destination.lng },
  });
  const data = (result.data ?? {}) as { configured?: boolean; offers?: NammaYatriOffer[] };
  return {
    configured: data.configured === true,
    offers: Array.isArray(data.offers) ? data.offers : [],
  };
}
