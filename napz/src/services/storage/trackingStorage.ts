/**
 * Tracking State Persistence
 * Store and retrieve tracking state using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ActiveTrackingState {
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  radiusMeters: number;
  alarmSound: string;
  startedAt: string;
}

export interface TriggeredState {
  destinationName: string;
}

const STORAGE_KEYS = {
  ACTIVE_TRACKING: 'activeTracking',
  TRIGGERED_ALARM: 'triggeredAlarm',
};

/**
 * Get active tracking state
 */
export async function getActiveTracking(): Promise<ActiveTrackingState | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_TRACKING);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting active tracking:', error);
    return null;
  }
}

/**
 * Set active tracking state
 */
export async function setActiveTracking(state: ActiveTrackingState | null): Promise<void> {
  try {
    if (state) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_TRACKING, JSON.stringify(state));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_TRACKING);
    }
  } catch (error) {
    console.error('Error setting active tracking:', error);
  }
}

/**
 * Get triggered alarm state
 */
export async function getTriggered(): Promise<TriggeredState | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRIGGERED_ALARM);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting triggered state:', error);
    return null;
  }
}

/**
 * Set triggered alarm state
 */
export async function setTriggered(state: TriggeredState | null): Promise<void> {
  try {
    if (state) {
      await AsyncStorage.setItem(STORAGE_KEYS.TRIGGERED_ALARM, JSON.stringify(state));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.TRIGGERED_ALARM);
    }
  } catch (error) {
    console.error('Error setting triggered state:', error);
  }
}
