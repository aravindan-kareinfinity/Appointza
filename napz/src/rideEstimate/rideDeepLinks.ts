import { Linking, NativeModules, Platform } from 'react-native';
import type { RidePlace } from './types';

const { OpenAppModule } = NativeModules;

function coordQuery(place: RidePlace): string {
  return `${place.lat},${place.lng}`;
}

function clip(value: string, max: number): string {
  return value.slice(0, max);
}

/** Uber requires unencoded [ ] in parameter names. */
export function uberPickupQuery(pickup: RidePlace, dropoff: RidePlace): string {
  const pickupAddress = clip(pickup.name, 200);
  const dropoffAddress = clip(dropoff.name, 200);
  return [
    'action=setPickup',
    `pickup[latitude]=${pickup.lat}`,
    `pickup[longitude]=${pickup.lng}`,
    `pickup[nickname]=${encodeURIComponent(clip(pickupAddress, 80))}`,
    `pickup[formatted_address]=${encodeURIComponent(pickupAddress)}`,
    `dropoff[latitude]=${dropoff.lat}`,
    `dropoff[longitude]=${dropoff.lng}`,
    `dropoff[nickname]=${encodeURIComponent(clip(dropoffAddress, 80))}`,
    `dropoff[formatted_address]=${encodeURIComponent(dropoffAddress)}`,
  ].join('&');
}

export function uberSetPickupUrl(pickup: RidePlace, dropoff: RidePlace): string {
  return `https://m.uber.com/ul/?${uberPickupQuery(pickup, dropoff)}`;
}

export function uberNativeSchemeUrl(pickup: RidePlace, dropoff: RidePlace): string {
  return `uber://?${uberPickupQuery(pickup, dropoff)}`;
}

/** Forces the Uber Android package before any browser fallback. */
export function uberAndroidAppIntent(pickup: RidePlace, dropoff: RidePlace): string {
  const query = uberPickupQuery(pickup, dropoff);
  const fallback = encodeURIComponent(uberSetPickupUrl(pickup, dropoff));
  return `intent://?${query}#Intent;scheme=uber;package=com.ubercab;S.browser_fallback_url=${fallback};end`;
}

export function googleTransitMapsUrl(pickup: RidePlace, dropoff: RidePlace): string {
  const params = new URLSearchParams({
    api: '1',
    origin: coordQuery(pickup),
    destination: coordQuery(dropoff),
    travelmode: 'transit',
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export const RAPIDO_PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.rapido.passenger';
export const RAPIDO_OFFICIAL_SITE = 'https://www.rapido.bike/';
export const RAPIDO_ANDROID_PACKAGE = 'com.rapido.passenger';
/** Launch Rapido’s installed app (not the PWA website). */
export const RAPIDO_ANDROID_APP_INTENT =
  'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.rapido.passenger;end';

export const OLA_ANDROID_PACKAGE = 'com.olacabs.customer';
export const OLA_PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.olacabs.customer';

export function olaAppLaunchUrl(pickup: RidePlace, dropoff: RidePlace, category?: string): string {
  const params = new URLSearchParams({
    lat: String(pickup.lat),
    lng: String(pickup.lng),
    drop_lat: String(dropoff.lat),
    drop_lng: String(dropoff.lng),
    address: clip(pickup.name, 200),
    drop_address: clip(dropoff.name, 200),
    landing_page: 'bk',
  });
  if (category) params.set('category', category);
  return `olacabs://app/launch?${params.toString()}`;
}

async function launchInstalledPackage(packageName: string): Promise<boolean> {
  if (Platform.OS !== 'android' || typeof OpenAppModule?.launchPackage !== 'function') {
    return false;
  }
  try {
    return (await OpenAppModule.launchPackage(packageName)) === true;
  } catch {
    return false;
  }
}

async function tryOpen(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

async function openFirstWorking(urls: string[]): Promise<void> {
  for (const url of urls) {
    if (await tryOpen(url)) return;
  }
  throw new Error('Could not open the booking app');
}

/** Opens the Uber app first when installed, with pickup and destination filled. */
export async function openUber(pickup: RidePlace, dropoff: RidePlace): Promise<void> {
  const appLinks =
    Platform.OS === 'android'
      ? [uberAndroidAppIntent(pickup, dropoff), uberNativeSchemeUrl(pickup, dropoff)]
      : [uberNativeSchemeUrl(pickup, dropoff)];
  await openFirstWorking([...appLinks, uberSetPickupUrl(pickup, dropoff)]);
}

/**
 * Opens the Rapido Android/iOS app only — never m.rapido.bike.
 * Play Store is last resort if the app is not installed.
 */
export async function openRapido(): Promise<void> {
  if (Platform.OS === 'android') {
    if (await launchInstalledPackage(RAPIDO_ANDROID_PACKAGE)) {
      return;
    }
    if (await tryOpen(RAPIDO_ANDROID_APP_INTENT)) {
      return;
    }
    await openFirstWorking([`market://details?id=${RAPIDO_ANDROID_PACKAGE}`, RAPIDO_PLAY_STORE]);
    return;
  }
  await openFirstWorking(['rapido://']);
}

/** Opens the Ola app with pickup and destination. */
export async function openOla(pickup: RidePlace, dropoff: RidePlace, category?: string): Promise<void> {
  const launch = olaAppLaunchUrl(pickup, dropoff, category);
  if (Platform.OS === 'android') {
    if (await tryOpen(launch)) return;
    if (await launchInstalledPackage(OLA_ANDROID_PACKAGE)) return;
    await openFirstWorking([`market://details?id=${OLA_ANDROID_PACKAGE}`, OLA_PLAY_STORE]);
    return;
  }
  await openFirstWorking([launch]);
}

export async function openTransitDirections(
  pickup: RidePlace,
  dropoff: RidePlace
): Promise<void> {
  await openFirstWorking([googleTransitMapsUrl(pickup, dropoff)]);
}

export async function openAndroidPackageOrStore(packageName: string): Promise<void> {
  if (Platform.OS === 'android') {
    if (await launchInstalledPackage(packageName)) return;
    await openFirstWorking([
      `market://details?id=${packageName}`,
      `https://play.google.com/store/apps/details?id=${packageName}`,
    ]);
    return;
  }
  await openFirstWorking([`https://play.google.com/store/apps/details?id=${packageName}`]);
}
