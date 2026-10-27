/**
 * Local trip counter for free-tier UX (5 trips / 7 days). Not a security boundary —
 * clearing app data resets the count. Server-side usage tracking can be added later.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'napzTripStarts';
const ROLLING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

async function readRecentTripStarts(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - ROLLING_WINDOW_MS;
    const recent = parsed.filter(
      (value): value is number => typeof value === 'number' && value >= cutoff
    );
    if (recent.length !== parsed.length) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    }
    return recent;
  } catch {
    return [];
  }
}

/** Trips started in the last 7 days (free-tier gate). */
export async function getTripsStartedThisWeek(): Promise<number> {
  const recent = await readRecentTripStarts();
  return recent.length;
}

/** Call when a new destination tracking session starts (not on resume). */
export async function recordTripStarted(): Promise<void> {
  const recent = await readRecentTripStarts();
  recent.push(Date.now());
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
}
