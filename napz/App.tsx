import React, { useCallback, useEffect } from 'react';
import { AppState, StatusBar, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { TrackingServiceAPI } from './src/services/native/TrackingServiceModule';
import { hasValidSession } from './src/services/firebase/hasValidSession';
import {
  rootNavigationRef,
  getRootStackRouteName,
  resetToGoogleAuth,
} from './src/navigation/rootNavigationRef';
import type { RootStackParamList } from './src/types/navigation';
import { COLORS } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SubscriptionTierProvider } from './src/context/SubscriptionTierContext';
import { EntitlementForegroundRefresh } from './src/entitlement/EntitlementForegroundRefresh';
import { initAdMob } from './src/ads/initAdMob';

function AppNavigation() {
  const isDarkMode = useColorScheme() === 'dark';
  const { ready, signedIn } = useAuth();
  const rootInitial: keyof RootStackParamList = signedIn ? 'Main' : 'GoogleAuth';

  const navigateToAlarm = useCallback(async (destinationName: string) => {
    if (!(await hasValidSession())) return;
    const name = destinationName || 'Destination';
    if (!rootNavigationRef.isReady()) return;
    rootNavigationRef.navigate(
      'Main',
      {
        screen: 'Tracking',
        params: {
          screen: 'Alarm',
          params: { destinationName: name, triggeredByService: true },
        },
      } as never
    );
  }, []);

  const flushNativePendingAlarm = useCallback(async () => {
    if (!rootNavigationRef.isReady()) return;
    try {
      const payload = await TrackingServiceAPI.getPendingAlarmLaunch();
      if (payload == null) return;
      await navigateToAlarm(payload.destinationName || 'Destination');
    } catch {
      // Native module or bridge not available
    }
  }, [navigateToAlarm]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      (async () => {
        if (!rootNavigationRef.isReady()) return;
        if (!(await hasValidSession())) {
          if (getRootStackRouteName() === 'Main') {
            resetToGoogleAuth();
          }
          return;
        }
        flushNativePendingAlarm();
      })();
    });
    return () => sub.remove();
  }, [flushNativePendingAlarm]);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: COLORS.background }} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SubscriptionTierProvider>
        <EntitlementForegroundRefresh />
        <NavigationContainer ref={rootNavigationRef} onReady={flushNativePendingAlarm}>
          <RootNavigator
            key={signedIn ? 'signed-in' : 'signed-out'}
            initialRouteName={rootInitial}
          />
        </NavigationContainer>
      </SubscriptionTierProvider>
    </SafeAreaProvider>
  );
}

function App() {
  useEffect(() => {
    initAdMob();
  }, []);

  return (
    <AuthProvider>
      <AppNavigation />
    </AuthProvider>
  );
}

export default App;
