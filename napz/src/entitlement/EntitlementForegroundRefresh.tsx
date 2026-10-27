import { useEffect } from 'react';
import { AppState } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useSubscriptionTier } from '../context/SubscriptionTierContext';

/** Verify with the server only when the local plan end date has passed. */
export function EntitlementForegroundRefresh() {
  const { ensureSubscriptionCurrent } = useSubscriptionTier();

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !auth().currentUser) return;
      void ensureSubscriptionCurrent().catch(() => {});
    });
    return () => sub.remove();
  }, [ensureSubscriptionCurrent]);

  return null;
}
