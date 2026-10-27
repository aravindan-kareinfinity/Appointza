import { useSubscriptionTier } from '../context/SubscriptionTierContext';
import {
  canUseCloudBackup,
  canUseCustomSound,
  canUsePremiumMaps,
  getRadiusBounds,
  isPremium,
  maxSavedPlaces,
  searchResultLimit,
  shouldShowAds,
} from './PremiumGate';

/** Hook for feature gates — reads server entitlement, never local profile tier alone. */
export function usePremiumEntitlement() {
  const { entitlement, loading, ensureSubscriptionCurrent, subscriptionTier } =
    useSubscriptionTier();

  return {
    entitlement,
    subscriptionTier,
    loading,
    premium: isPremium(entitlement),
    showAds: shouldShowAds(entitlement),
    canUsePremiumMaps: canUsePremiumMaps(entitlement),
    canUseCloudBackup: canUseCloudBackup(entitlement),
    canUseCustomSound: canUseCustomSound(entitlement),
    radiusBounds: getRadiusBounds(entitlement),
    savedPlacesLimit: maxSavedPlaces(entitlement),
    searchResultLimit: searchResultLimit(entitlement),
    refreshEntitlement: ensureSubscriptionCurrent,
  };
}
