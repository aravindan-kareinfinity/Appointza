import type { NapzEntitlement } from '../entitlement/entitlementTypes';
import { searchResultLimit } from '../entitlement/PremiumGate';
import { canUseGoogleMaps } from '../services/maps/mapProvider';
import { searchPlaces as osmSearchPlaces, type NominatimSearchResult } from '../services/maps/osm';
import { searchPlacesGoogle } from '../services/maps/googleMapsPlaces';
import type { RideLatLng } from './types';

export async function searchPlacesForRide(
  query: string,
  entitlement: NapzEntitlement,
  near?: RideLatLng | null
): Promise<NominatimSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const results = canUseGoogleMaps(entitlement)
    ? await searchPlacesGoogle(trimmed, near)
    : await osmSearchPlaces(trimmed);
  return results.slice(0, Math.max(searchResultLimit(entitlement), 6));
}
