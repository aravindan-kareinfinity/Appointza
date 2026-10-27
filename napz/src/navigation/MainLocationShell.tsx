import type { ReactNode } from 'react';
import { LocationPermissionProvider } from '../location/LocationPermissionProvider';
import { LocationLaunchGate } from '../location/LocationLaunchGate';

/** Location disclosure + permission flow — only after sign-in (Main), never on Google Auth. */
export function MainLocationShell({ children }: { children: ReactNode }) {
  return (
    <LocationPermissionProvider>
      <LocationLaunchGate>{children}</LocationLaunchGate>
    </LocationPermissionProvider>
  );
}
