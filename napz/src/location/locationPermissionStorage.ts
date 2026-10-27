import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrackingServiceAPI } from '../services/native/TrackingServiceModule';

// Increment whenever disclosure wording or data practices materially change.
// This forces updated installs (including Play review devices) to accept the
// current disclosure instead of inheriting consent for older wording.
const KEY_DISCLOSURE_ACCEPTED = 'napz_location_disclosure_accepted_v3';
const KEY_BACKGROUND_DISCLOSURE_ACCEPTED = 'napz_background_location_disclosure_accepted_v3';
/** User saw first-launch Location Access (Agree or Not Now) — do not block Main on every cold start. */
const KEY_STARTUP_LOCATION_PROMPT_DONE = 'napz_startup_location_prompt_done_v3';

/** Device-level consent flags — keep these on sign-out, wipe them on account delete. */
export function locationDisclosureStorageKeys(): string[] {
  return [
    KEY_DISCLOSURE_ACCEPTED,
    KEY_BACKGROUND_DISCLOSURE_ACCEPTED,
    KEY_STARTUP_LOCATION_PROMPT_DONE,
  ];
}

async function syncNativeConsent(fg: boolean, bg: boolean) {
  await TrackingServiceAPI.setLocationDisclosureConsent(fg, bg);
}

export async function hydrateNativeLocationConsent(): Promise<void> {
  try {
    const fg = await hasAcceptedLocationDisclosure();
    const bg = await hasAcceptedBackgroundLocationDisclosure();
    await syncNativeConsent(fg, bg);
  } catch {
    /* native module may be unavailable on iOS / early boot */
  }
}

export async function clearLocationDisclosureConsent(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      KEY_DISCLOSURE_ACCEPTED,
      KEY_BACKGROUND_DISCLOSURE_ACCEPTED,
      KEY_STARTUP_LOCATION_PROMPT_DONE,
    ]);
    await syncNativeConsent(false, false);
  } catch {
    try {
      await TrackingServiceAPI.setLocationDisclosureConsent(false, false);
    } catch {
      /* native module may be unavailable */
    }
  }
}

export async function hasCompletedStartupLocationPrompt(): Promise<boolean> {
  try {
    if ((await AsyncStorage.getItem(KEY_DISCLOSURE_ACCEPTED)) === '1') return true;
    return (await AsyncStorage.getItem(KEY_STARTUP_LOCATION_PROMPT_DONE)) === '1';
  } catch {
    return false;
  }
}

export async function markStartupLocationPromptCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_STARTUP_LOCATION_PROMPT_DONE, '1');
  } catch {}
}

export async function shouldShowStartupLocationDisclosure(): Promise<boolean> {
  try {
    if ((await AsyncStorage.getItem(KEY_DISCLOSURE_ACCEPTED)) === '1') return false;
    return (await AsyncStorage.getItem(KEY_STARTUP_LOCATION_PROMPT_DONE)) !== '1';
  } catch {
    return true;
  }
}

export async function hasAcceptedLocationDisclosure(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY_DISCLOSURE_ACCEPTED)) === '1';
  } catch {
    return false;
  }
}

export async function markLocationDisclosureAccepted(): Promise<void> {
  console.log('LOCATION_AUDIT markLocationDisclosureAccepted (explicit Agree only)');
  await AsyncStorage.setItem(KEY_DISCLOSURE_ACCEPTED, '1');
  const bg = await hasAcceptedBackgroundLocationDisclosure();
  try {
    await syncNativeConsent(true, bg);
  } catch {
    /* Retry once so native GPS gates match JS consent. */
    await syncNativeConsent(true, bg).catch(() => {});
  }
}

export async function hasAcceptedBackgroundLocationDisclosure(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY_BACKGROUND_DISCLOSURE_ACCEPTED)) === '1';
  } catch {
    return false;
  }
}

export async function markBackgroundLocationDisclosureAccepted(): Promise<void> {
  await AsyncStorage.setItem(KEY_BACKGROUND_DISCLOSURE_ACCEPTED, '1');
  const fg = await hasAcceptedLocationDisclosure();
  try {
    await syncNativeConsent(fg, true);
  } catch {
    await syncNativeConsent(fg, true).catch(() => {});
  }
}

/** Alias for Play audit docs — true only after explicit Agree & Continue on foreground disclosure. */
export const isLocationDisclosureAccepted = hasAcceptedLocationDisclosure;
