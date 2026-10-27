import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform, View } from 'react-native';
import { COLORS } from '../theme';
import {
  hasAcceptedLocationDisclosure,
  hydrateNativeLocationConsent,
  markStartupLocationPromptCompleted,
  shouldShowStartupLocationDisclosure,
} from './locationPermissionStorage';
import { useAuth } from '../context/AuthContext';
import { useLocationPermission } from './LocationPermissionProvider';

type GateContextValue = {
  /** True only after explicit Agree & Continue on foreground disclosure. */
  locationDisclosureAccepted: boolean;
  refreshLocationDisclosureState: () => Promise<boolean>;
};

const LocationStartupGateContext = createContext<GateContextValue>({
  locationDisclosureAccepted: Platform.OS !== 'android',
  refreshLocationDisclosureState: async () => Platform.OS !== 'android',
});

export function useLocationStartupGate(): GateContextValue {
  return useContext(LocationStartupGateContext);
}

function logDisclosureState(label: string, accepted: boolean) {
  if (Platform.OS !== 'android') return;
  console.log(`LOCATION_AUDIT ${label} disclosureAccepted=${accepted}`);
}

/**
 * Android: mounted only under Main (post sign-in). Blocks tabs until first-launch
 * Location Access disclosure completes. Google Auth is outside this gate.
 */
export function LocationLaunchGate({ children }: { children: ReactNode }) {
  const { signedIn } = useAuth();
  const [phase, setPhase] = useState<'checking' | 'disclosure' | 'ready'>(() =>
    Platform.OS === 'android' && signedIn ? 'checking' : 'ready'
  );
  const [locationDisclosureAccepted, setLocationDisclosureAccepted] = useState(
    Platform.OS !== 'android'
  );
  const { requestLocationAccess } = useLocationPermission();
  const startupFlowStarted = useRef(false);

  const refreshLocationDisclosureState = useCallback(async () => {
    const accepted = await hasAcceptedLocationDisclosure();
    setLocationDisclosureAccepted(accepted);
    logDisclosureState('refresh', accepted);
    return accepted;
  }, []);

  useLayoutEffect(() => {
    if (Platform.OS !== 'android') return;

    if (!signedIn) {
      startupFlowStarted.current = false;
      setPhase('ready');
      return;
    }

    if (startupFlowStarted.current) {
      return;
    }

    setPhase('checking');
    startupFlowStarted.current = true;

    (async () => {
      try {
        const accepted = await hasAcceptedLocationDisclosure();
        logDisclosureState('postSignIn', accepted);
        setLocationDisclosureAccepted(accepted);
        await hydrateNativeLocationConsent();

        if (!(await shouldShowStartupLocationDisclosure())) {
          return;
        }
        setPhase('disclosure');
        await requestLocationAccess('startup_foreground');
        await markStartupLocationPromptCompleted();
        await refreshLocationDisclosureState();
      } finally {
        setPhase('ready');
      }
    })();
  }, [signedIn, requestLocationAccess, refreshLocationDisclosureState]);

  if (phase !== 'ready') {
    // Solid screen while checking / startup disclosure (signed-in only; auth stays visible when logged out).
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }} />
    );
  }

  return (
    <LocationStartupGateContext.Provider
      value={{ locationDisclosureAccepted, refreshLocationDisclosureState }}
    >
      {children}
    </LocationStartupGateContext.Provider>
  );
}

/** @deprecated use LocationLaunchGate */
export const AndroidLocationLaunchGate = LocationLaunchGate;

/** @deprecated */
export function MainWithLocationStartupGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
