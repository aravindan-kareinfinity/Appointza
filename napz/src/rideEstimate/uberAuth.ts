import { Linking } from 'react-native';
import { napzFunctions } from '../services/firebase/functionsClient';
import type { RidePlace } from './types';
import type { UberProductOffer } from './uberCatalog';

export const UBER_APP_RETURN_SCHEME = 'napz://uber-oauth';

export async function startUberConnect(): Promise<void> {
  const result = await napzFunctions().httpsCallable('uberAuthStart')();
  const authorizeUrl = String((result.data as { authorizeUrl?: string } | null)?.authorizeUrl ?? '');
  if (!authorizeUrl.startsWith('https://auth.uber.com/')) {
    throw new Error('Uber sign-in URL was not returned.');
  }
  await Linking.openURL(authorizeUrl);
}

export async function fetchUberConnection(): Promise<{ connected: boolean; scope: string | null }> {
  const result = await napzFunctions().httpsCallable('uberConnectionStatus')();
  const data = (result.data ?? {}) as { connected?: boolean; scope?: string | null };
  return { connected: data.connected === true, scope: data.scope ?? null };
}

export async function disconnectUber(): Promise<void> {
  await napzFunctions().httpsCallable('uberDisconnect')();
}

export async function fetchUberRideCatalog(
  pickup: RidePlace,
  destination: RidePlace
): Promise<{ connected: boolean; products: UberProductOffer[] }> {
  const result = await napzFunctions().httpsCallable('uberRideCatalog')({
    pickup: { lat: pickup.lat, lng: pickup.lng },
    destination: { lat: destination.lat, lng: destination.lng },
  });
  const data = (result.data ?? {}) as { connected?: boolean; products?: UberProductOffer[] };
  return {
    connected: data.connected === true,
    products: Array.isArray(data.products) ? data.products : [],
  };
}
