import React, { createContext, useCallback, useContext, type ReactNode } from 'react';
import { LocationPermissionFlowModal } from './LocationPermissionFlowModal';
import { useLocationPermissionFlow } from './useLocationPermissionFlow';
import type { LocationPermissionFlowMode } from './LocationPermissionFlowModal';
import type { LocationPermissionOutcome } from './LocationPermission';

type ContextValue = {
  requestLocationAccess: (mode: LocationPermissionFlowMode) => Promise<LocationPermissionOutcome>;
};

const LocationPermissionContext = createContext<ContextValue | null>(null);

/**
 * Every permission request goes through the flow modal so Napz disclosure is
 * immediately before the Android system dialog (Play policy).
 */
export function LocationPermissionProvider({ children }: { children: ReactNode }) {
  const { visible, mode, requestLocationAccess: openFlow, handleComplete } = useLocationPermissionFlow();

  const requestLocationAccess = useCallback(
    async (flowMode: LocationPermissionFlowMode): Promise<LocationPermissionOutcome> => {
      // Always show Napz disclosure immediately before location features or
      // permission requests, even if OS permission was previously granted.
      return openFlow(flowMode);
    },
    [openFlow]
  );

  return (
    <LocationPermissionContext.Provider value={{ requestLocationAccess }}>
      {children}
      <LocationPermissionFlowModal
        visible={visible}
        mode={mode}
        onComplete={handleComplete}
      />
    </LocationPermissionContext.Provider>
  );
}

export function useLocationPermission(): ContextValue {
  const ctx = useContext(LocationPermissionContext);
  if (!ctx) {
    throw new Error('useLocationPermission must be used within LocationPermissionProvider');
  }
  return ctx;
}
