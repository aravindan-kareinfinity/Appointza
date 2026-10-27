import type { NapzEntitlement } from '../../entitlement/entitlementTypes';
import { canUsePremiumMaps } from '../../entitlement/PremiumGate';

export type MapProviderId = 'osm' | 'google';

/** Google Maps only for an active Premium entitlement. Free always uses OSM. */
export function canUseGoogleMaps(entitlement: NapzEntitlement): boolean {
  return canUsePremiumMaps(entitlement);
}

export function mapProviderForEntitlement(entitlement: NapzEntitlement): MapProviderId {
  return canUsePremiumMaps(entitlement) ? 'google' : 'osm';
}
