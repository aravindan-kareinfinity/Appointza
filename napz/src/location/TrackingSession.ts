/**
 * Native session + consent state lives in Android `TrackingSession.kt`.
 * Sync consent from JS via `TrackingServiceAPI.setLocationDisclosureConsent`.
 */
export { TrackingServiceAPI } from '../services/native/TrackingServiceModule';
