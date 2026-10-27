import { useCallback, useRef, useState } from 'react';
import type { LocationPermissionFlowMode } from './LocationPermissionFlowModal';
import type { LocationPermissionOutcome } from './LocationPermission';

type Pending = {
  mode: LocationPermissionFlowMode;
  resolve: (result: LocationPermissionOutcome) => void;
};

/**
 * Single entry point for location permission + prominent disclosure.
 *
 * Always shows the Flow Modal for explicit location features (Locate, Saved Places,
 * Start Tracking), even if OS permission was previously granted — so reviewers always
 * see Napz's disclosure before location access.
 */
export function useLocationPermissionFlow() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<LocationPermissionFlowMode>('foreground_only');
  const pendingRef = useRef<Pending | null>(null);

  const requestLocationAccess = useCallback(
    async (flowMode: LocationPermissionFlowMode): Promise<LocationPermissionOutcome> => {
      return new Promise((resolve) => {
        pendingRef.current = { mode: flowMode, resolve };
        setMode(flowMode);
        setVisible(true);
      });
    },
    []
  );

  const handleComplete = useCallback((result: LocationPermissionOutcome) => {
    setVisible(false);
    const pending = pendingRef.current;
    pendingRef.current = null;
    pending?.resolve(result);
  }, []);

  return {
    visible,
    mode,
    requestLocationAccess,
    handleComplete,
  };
}
