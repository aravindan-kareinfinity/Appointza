import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import auth from '@react-native-firebase/auth';
import {
  confirmLatestRazorpayOrder,
  startRazorpayCheckout,
} from '../billing/razorpayBilling';
import type { RazorpayPackageId } from '../billing/razorpayPackages';
import {
  FREE_ENTITLEMENT,
  type NapzEntitlement,
} from '../entitlement/entitlementTypes';
import {
  clearCachedEntitlement,
  entitlementNeedsServerVerify,
  hasLocalEntitlementSnapshot,
  readCachedEntitlement,
  writeCachedEntitlement,
} from '../entitlement/entitlementStorage';
import { isPremium } from '../entitlement/PremiumGate';
import {
  fetchEntitlementFromFirestore,
  startFreeTrialOnServer,
  tierFromEntitlement,
} from '../services/firebase/entitlementService';
import {
  DEFAULT_SUBSCRIPTION_TIER,
  type NapzSubscriptionTier,
} from '../subscription/subscriptionTier';
import {
  logSubscriptionConversion,
  logTrialClaimed,
  setSubscriptionAnalyticsProperty,
} from '../ads/analytics';

type SubscriptionTierContextValue = {
  subscriptionTier: NapzSubscriptionTier;
  entitlement: NapzEntitlement;
  loading: boolean;
  purchasing: boolean;
  refreshSubscriptionTier: () => Promise<NapzSubscriptionTier>;
  /** Local cache unless the plan end date has passed. */
  ensureSubscriptionCurrent: () => Promise<NapzSubscriptionTier>;
  /** Dev-only manual tier override (does not bypass server on next refresh). */
  setSubscriptionTier: (tier: NapzSubscriptionTier) => Promise<void>;
  purchasePremium: (packageId: RazorpayPackageId) => Promise<void>;
  claimFreeTrial: () => Promise<void>;
};

const SubscriptionTierContext = createContext<SubscriptionTierContextValue>({
  subscriptionTier: DEFAULT_SUBSCRIPTION_TIER,
  entitlement: FREE_ENTITLEMENT,
  loading: true,
  purchasing: false,
  refreshSubscriptionTier: async () => DEFAULT_SUBSCRIPTION_TIER,
  ensureSubscriptionCurrent: async () => DEFAULT_SUBSCRIPTION_TIER,
  setSubscriptionTier: async () => {},
  purchasePremium: async () => {},
  claimFreeTrial: async () => {},
});

export function useSubscriptionTier(): SubscriptionTierContextValue {
  return useContext(SubscriptionTierContext);
}

function applyEntitlementState(
  setEntitlement: (e: NapzEntitlement) => void,
  entitlement: NapzEntitlement
): NapzSubscriptionTier {
  setEntitlement(entitlement);
  return tierFromEntitlement(entitlement);
}

export function SubscriptionTierProvider({ children }: { children: ReactNode }) {
  const [entitlement, setEntitlement] = useState<NapzEntitlement>(FREE_ENTITLEMENT);
  const [subscriptionTier, setSubscriptionTierState] = useState<NapzSubscriptionTier>(
    DEFAULT_SUBSCRIPTION_TIER
  );
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const syncFromEntitlement = useCallback(async (next: NapzEntitlement) => {
    const normalized: NapzEntitlement = {
      ...next,
      premium: isPremium(next),
      tier: isPremium(next) ? tierFromEntitlement(next) : 'free',
    };
    await writeCachedEntitlement(normalized);
    const tier = applyEntitlementState(setEntitlement, normalized);
    setSubscriptionTierState(tier);
    void setSubscriptionAnalyticsProperty(tier, normalized.productId ?? null);
    return tier;
  }, []);

  const refreshSubscriptionTier = useCallback(async () => {
    try {
      const confirmed = await confirmLatestRazorpayOrder();
      return syncFromEntitlement(confirmed);
    } catch {
      const fromServer = await fetchEntitlementFromFirestore();
      return syncFromEntitlement(fromServer);
    }
  }, [syncFromEntitlement]);

  const ensureSubscriptionCurrent = useCallback(async () => {
    const cached = await readCachedEntitlement();
    if (hasLocalEntitlementSnapshot(cached) && !entitlementNeedsServerVerify(cached)) {
      return syncFromEntitlement(cached);
    }
    return refreshSubscriptionTier();
  }, [refreshSubscriptionTier, syncFromEntitlement]);

  useEffect(() => {
    let mounted = true;
    const unsubscribeAuth = auth().onAuthStateChanged(async (user) => {
      if (!mounted) return;
      if (!user) {
        await clearCachedEntitlement();
        setEntitlement(FREE_ENTITLEMENT);
        setSubscriptionTierState(DEFAULT_SUBSCRIPTION_TIER);
        void setSubscriptionAnalyticsProperty('free', null);
        setLoading(false);
        return;
      }
      try {
        await ensureSubscriptionCurrent();
      } catch {
        const local = await readCachedEntitlement();
        await syncFromEntitlement(local);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribeAuth();
    };
  }, [ensureSubscriptionCurrent, syncFromEntitlement]);

  const setSubscriptionTier = useCallback(
    async (tier: NapzSubscriptionTier) => {
      if (!__DEV__) return;
      const devEntitlement: NapzEntitlement = {
        ...FREE_ENTITLEMENT,
        premium: tier !== 'free',
        tier,
        isLifetime: tier === 'lifetime',
        status: tier === 'free' ? 'free' : 'active',
        lastVerifiedAt: new Date().toISOString(),
      };
      await syncFromEntitlement(devEntitlement);
    },
    [syncFromEntitlement]
  );

  const claimFreeTrial = useCallback(async () => {
    const next = await startFreeTrialOnServer();
    await syncFromEntitlement(next);
    if (!isPremium(next)) {
      throw new Error('This account has already used the 10-day free trial.');
    }
    void logTrialClaimed();
  }, [syncFromEntitlement]);

  const purchasePremium = useCallback(
    async (packageId: RazorpayPackageId) => {
      setPurchasing(true);
      try {
        const next = await startRazorpayCheckout(packageId);
        await syncFromEntitlement(next);
        void logSubscriptionConversion(packageId);
      } finally {
        setPurchasing(false);
      }
    },
    [syncFromEntitlement]
  );

  const value = useMemo(
    () => ({
      subscriptionTier,
      entitlement,
      loading,
      purchasing,
      refreshSubscriptionTier,
      ensureSubscriptionCurrent,
      setSubscriptionTier,
      purchasePremium,
      claimFreeTrial,
    }),
    [
      subscriptionTier,
      entitlement,
      loading,
      purchasing,
      refreshSubscriptionTier,
      ensureSubscriptionCurrent,
      setSubscriptionTier,
      purchasePremium,
      claimFreeTrial,
    ]
  );

  return (
    <SubscriptionTierContext.Provider value={value}>
      {children}
    </SubscriptionTierContext.Provider>
  );
}
