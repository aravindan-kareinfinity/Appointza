/**
 * JS bridge to native location reads (Android: LocationManager via TrackingServiceModule).
 * Disclosure + permission gates are enforced in Kotlin (`DeviceLocation.kt`).
 */
export {
  TrackingServiceAPI as DeviceLocation,
  subscribeNapzLocation,
} from '../services/native/TrackingServiceModule';
