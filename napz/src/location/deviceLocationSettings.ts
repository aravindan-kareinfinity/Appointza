import { Linking, Platform } from 'react-native';
import { TrackingServiceAPI } from '../services/native/TrackingServiceModule';

/** Master device location switch (GPS / Location services), not app permission. */
export async function isDeviceLocationEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  try {
    return await TrackingServiceAPI.isDeviceLocationEnabled();
  } catch {
    return true;
  }
}

export function openDeviceLocationSettings(): void {
  if (Platform.OS === 'android') {
    TrackingServiceAPI.openDeviceLocationSettings().catch(() => {
      Linking.openSettings().catch(() => {});
    });
    return;
  }
  Linking.openURL('App-Prefs:Privacy&path=LOCATION').catch(() => {
    Linking.openSettings().catch(() => {});
  });
}
