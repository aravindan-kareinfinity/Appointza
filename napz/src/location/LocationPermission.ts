import { Platform, PermissionsAndroid } from 'react-native';

export type LocationPermissionOutcome = {
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  cancelled: boolean;
};

/**
 * Permission check only — must NOT call GPS.
 * Android: PermissionsAndroid.check only. No react-native-geolocation-service.
 */
export async function isForegroundLocationGranted(): Promise<boolean> {
  try {
    return await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
  } catch {
    return false;
  }
}

export async function isBackgroundLocationGranted(): Promise<boolean> {
  if (Platform.OS !== 'android' || (Platform.Version as number) < 29) {
    return true;
  }
  try {
    return await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
    );
  } catch {
    return false;
  }
}

/** System dialog only — call after in-app disclosure Continue. */
export async function requestForegroundLocationSystem(): Promise<boolean> {
  try {
    const already = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (already) return true;
    console.log('LOCATION_AUDIT PermissionsAndroid.request ACCESS_FINE_LOCATION');
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/** System dialog only — call after background disclosure Continue. */
export async function requestBackgroundLocationSystem(): Promise<boolean> {
  if (Platform.OS !== 'android' || (Platform.Version as number) < 29) {
    return true;
  }
  try {
    const fg = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (!fg) return false;
    const already = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
    );
    if (already) return true;
    console.log('LOCATION_AUDIT PermissionsAndroid.request ACCESS_BACKGROUND_LOCATION');
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function requestNotificationPermissionIfNeeded(): Promise<void> {
  if (Platform.OS !== 'android' || (Platform.Version as number) < 33) return;
  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (!granted) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
  } catch {}
}
