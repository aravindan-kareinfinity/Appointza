import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_ONBOARDING_COMPLETE_KEY, USER_PROFILE_KEY } from '../../constants/authStorage';

/**
 * User is "logged in" for navigation when a profile exists and onboarding was completed.
 * Migrates older installs that have `userProfile` but not `authOnboardingComplete` yet.
 */
export async function hasValidSession(): Promise<boolean> {
  const prof = await AsyncStorage.getItem(USER_PROFILE_KEY);
  if (!prof) return false;

  const done = await AsyncStorage.getItem(AUTH_ONBOARDING_COMPLETE_KEY);
  if (done !== 'true') {
    await AsyncStorage.setItem(AUTH_ONBOARDING_COMPLETE_KEY, 'true');
  }
  return true;
}
