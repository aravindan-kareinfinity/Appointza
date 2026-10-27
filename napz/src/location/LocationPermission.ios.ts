import Geolocation from 'react-native-geolocation-service';

export type LocationPermissionOutcome = {
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  cancelled: boolean;
};

let iosForegroundGrantedCache: boolean | null = null;
let iosBackgroundGrantedCache: boolean | null = null;

export async function isForegroundLocationGranted(): Promise<boolean> {
  return iosForegroundGrantedCache === true;
}

export async function isBackgroundLocationGranted(): Promise<boolean> {
  return iosBackgroundGrantedCache === true;
}

export async function requestForegroundLocationSystem(): Promise<boolean> {
  const status = await Geolocation.requestAuthorization('whenInUse');
  const ok = status === 'granted';
  iosForegroundGrantedCache = ok;
  return ok;
}

export async function requestBackgroundLocationSystem(): Promise<boolean> {
  const status = await Geolocation.requestAuthorization('always');
  const ok = status === 'granted';
  iosBackgroundGrantedCache = ok;
  if (ok) iosForegroundGrantedCache = true;
  return ok;
}

export async function requestNotificationPermissionIfNeeded(): Promise<void> {}
