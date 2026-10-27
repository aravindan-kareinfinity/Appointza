import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { TrackingServiceModule } = NativeModules;

export type TrackingServiceConfig = {
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  radiusMeters: number;
  soundUri: string;
};

export type PendingAlarmPayload = {
  destinationName: string;
  triggeredByService: boolean;
};

export const TrackingServiceAPI = {
  startTrackingService: (config: TrackingServiceConfig): Promise<string> => {
    return TrackingServiceModule?.startTrackingService(config)
      ?? Promise.reject('TrackingServiceModule not available');
  },
  stopTrackingService: (): Promise<string> => {
    return TrackingServiceModule?.stopTrackingService()
      ?? Promise.reject('TrackingServiceModule not available');
  },
  getPendingAlarmLaunch: (): Promise<PendingAlarmPayload | null> => {
    return TrackingServiceModule?.getPendingAlarmLaunch() ?? Promise.resolve(null);
  },
  setLocationDisclosureConsent: (
    foregroundAccepted: boolean,
    backgroundAccepted: boolean
  ): Promise<boolean> => {
    return TrackingServiceModule?.setLocationDisclosureConsent(
      foregroundAccepted,
      backgroundAccepted
    ) ?? Promise.resolve(false);
  },
  getCurrentPosition: (timeoutMs: number): Promise<{ lat: number; lng: number }> => {
    return TrackingServiceModule?.getCurrentPosition(timeoutMs)
      ?? Promise.reject('TrackingServiceModule not available');
  },
  isDeviceLocationEnabled: (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !TrackingServiceModule?.isDeviceLocationEnabled) {
      return Promise.resolve(true);
    }
    return TrackingServiceModule.isDeviceLocationEnabled();
  },
  openDeviceLocationSettings: (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !TrackingServiceModule?.openDeviceLocationSettings) {
      return Promise.resolve(false);
    }
    return TrackingServiceModule.openDeviceLocationSettings();
  },
  startPositionWatch: (): Promise<boolean> => {
    return TrackingServiceModule?.startPositionWatch() ?? Promise.resolve(false);
  },
  stopPositionWatch: (): Promise<boolean> => {
    return TrackingServiceModule?.stopPositionWatch() ?? Promise.resolve(false);
  },
};

export function subscribeNapzLocation(
  onLocation: (coords: { lat: number; lng: number }) => void
): () => void {
  if (Platform.OS !== 'android' || !TrackingServiceModule) {
    return () => {};
  }
  const emitter = new NativeEventEmitter(TrackingServiceModule);
  const sub = emitter.addListener('NapzLocation', (payload: { lat: number; lng: number }) => {
    if (payload && Number.isFinite(payload.lat) && Number.isFinite(payload.lng)) {
      onLocation({ lat: payload.lat, lng: payload.lng });
    }
  });
  return () => sub.remove();
}
