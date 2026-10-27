import { useCallback, useState } from 'react';
import {
  getActiveTracking,
  setActiveTracking,
  type ActiveTrackingState,
} from '../services/storage/trackingStorage';

export function useActiveTracking() {
  const [active, setActive] = useState<ActiveTrackingState | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setActive(await getActiveTracking());
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(async () => {
    await setActiveTracking(null);
    setActive(null);
  }, []);

  return { active, loading, refresh, clear };
}
