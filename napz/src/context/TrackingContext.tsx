import React, { createContext, useContext, type ReactNode } from 'react';
import { useActiveTracking } from '../hooks/useTracking';

type TrackingContextValue = ReturnType<typeof useActiveTracking>;

const TrackingContext = createContext<TrackingContextValue | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const value = useActiveTracking();
  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
}

export function useTrackingContext(): TrackingContextValue {
  const ctx = useContext(TrackingContext);
  if (!ctx) {
    throw new Error('useTrackingContext must be used within TrackingProvider');
  }
  return ctx;
}
