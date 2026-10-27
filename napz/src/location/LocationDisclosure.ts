/** Google Play Prominent Disclosure — single source of truth (Android + iOS). */

export const FOREGROUND_DISCLOSURE_TITLE = 'Location Usage Disclosure';

export const FOREGROUND_DISCLOSURE_BODY = [
  'Napz uses your precise location to provide arrival alarms and show your position on maps.',
  'Napz collects and uses precise location data to determine your current location and distance from your selected destination and to trigger your destination arrival alarm.',
  'During an active trip, Napz continues collecting location data in the background, including when the app is minimized, the screen is off, or the app is closed where Android allows, so the arrival alarm can keep working until you stop the trip.',
  'Continuous trip location used for distance checks and arrival alarms is processed on your device and is not uploaded to Napz servers.',
  'When you use map, place-search, or place-name features, your location, selected map coordinates, or search location may be transmitted to Google Maps/Places or OpenStreetMap to provide those features.',
  'Napz does not use location data for advertising.',
] as const;

export const DISCLOSURE_FOOTER =
  'Tap Agree & Continue to accept this notice. Next, Napz will ask you to turn on location on your device.';

export const TURN_ON_LOCATION_TITLE = 'Turn on location';

export const TURN_ON_LOCATION_BODY = [
  'Napz needs permission to access your device location so it can show your position on the map, calculate distance to your destination, and trigger your arrival alarm.',
  'Tap Turn on location below. Android will then show its location permission prompt. You can change this anytime in Settings.',
] as const;

export const TURN_ON_LOCATION_FOOTER =
  'Location is not used for advertising.';

export const ENABLE_DEVICE_LOCATION_TITLE = 'Turn on Location on this device';

export const ENABLE_DEVICE_LOCATION_BODY = [
  'Napz has permission, but Location is turned off on your phone.',
  'Open Android Location settings, turn on Location, then return to Napz. We will continue automatically when Location is on.',
] as const;

export const ENABLE_DEVICE_LOCATION_FOOTER =
  'Use “Open Location Settings” below — you stay in control in Android Settings.';

export const BACKGROUND_DISCLOSURE_TITLE = 'Background Location Usage';

export const BACKGROUND_DISCLOSURE_BODY = [
  'Napz collects location in the background to detect when you arrive at your destination and trigger the alarm.',
  'Napz collects precise location data during an active trip to calculate your distance from the selected destination and trigger your arrival alarm.',
  'Collection continues in the background when the app is minimized, the screen is off, or the app is closed where Android allows. It stops when you stop the trip.',
  'Continuous trip location is processed on your device, is not uploaded to Napz servers, and is not used for advertising.',
] as const;

export const BACKGROUND_DISCLOSURE_FOOTER =
  'Tap Agree & Continue to allow Napz to request background location.';

export const ACTIVE_TRACKING_DISCLOSURE_TITLE = 'Napz is monitoring your destination';

export const ACTIVE_TRACKING_DISCLOSURE_BODY =
  'Location tracking is active to trigger your destination alarm automatically. Your precise location is accessed only while this trip is running, including when the app is minimized or the screen is off.';

/**
 * iOS-only options. Android never uses react-native-geolocation-service.
 */
export const GEOLOCATION_OPTIONS_BASE = {
  enableHighAccuracy: true,
  showLocationDialog: false,
  forceRequestLocation: false,
  forceLocationManager: true,
} as const;
