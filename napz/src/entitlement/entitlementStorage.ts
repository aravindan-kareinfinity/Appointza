import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NapzEntitlement } from './entitlementTypes';
import { FREE_ENTITLEMENT } from './entitlementTypes';

const ENTITLEMENT_CACHE_KEY = 'napzEntitlementCacheV1';

export async function readCachedEntitlement(): Promise<NapzEntitlement> {
  try {
    const raw = await AsyncStorage.getItem(ENTITLEMENT_CACHE_KEY);
    if (!raw) return FREE_ENTITLEMENT;
    return JSON.parse(raw) as NapzEntitlement;
  } catch {
    return FREE_ENTITLEMENT;
  }
}

export async function writeCachedEntitlement(entitlement: NapzEntitlement): Promise<void> {
  await AsyncStorage.setItem(ENTITLEMENT_CACHE_KEY, JSON.stringify(entitlement));
}

export async function clearCachedEntitlement(): Promise<void> {
  await AsyncStorage.removeItem(ENTITLEMENT_CACHE_KEY);
}

/** True when local plan end date has passed — then verify with the server. */
export function entitlementNeedsServerVerify(entitlement: NapzEntitlement): boolean {
  if (entitlement.isLifetime && entitlement.premium) return false;
  if (!entitlement.expiresAt) return false;
  const end = Date.parse(entitlement.expiresAt);
  if (!Number.isFinite(end)) return false;
  return Date.now() >= end;
}

export function hasLocalEntitlementSnapshot(entitlement: NapzEntitlement): boolean {
  return Boolean(
    entitlement.lastVerifiedAt ||
      entitlement.expiresAt ||
      entitlement.productId ||
      entitlement.premium ||
      entitlement.freeTrialUsed
  );
}
