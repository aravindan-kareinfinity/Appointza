import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import firestore, { type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { TrackingServiceAPI } from '../native/TrackingServiceModule';
import {
  clearLocationDisclosureConsent,
  locationDisclosureStorageKeys,
} from '../../location/locationPermissionStorage';

const DEVICE_PREF_KEYS = new Set([
  ...locationDisclosureStorageKeys(),
  'alarmSound',
  'customSoundUri',
  'customSoundName',
]);

async function reauthWithGoogleIfPossible(): Promise<void> {
  const user = auth().currentUser;
  if (!user) throw new Error('No current user');

  // Re-auth for Google accounts (common "requires-recent-login" case).
  const providerIds = user.providerData?.map(p => p.providerId) ?? [];
  if (!providerIds.includes('google.com')) return;

  try {
    // Ensure we have a fresh Google token.
    try {
      await GoogleSignin.signInSilently();
    } catch {
      // If silent sign-in fails, we fall back to interactive.
      await GoogleSignin.signIn();
    }

    const { idToken } = await GoogleSignin.getTokens();
    if (!idToken) throw new Error('Missing Google idToken');

    const credential = auth.GoogleAuthProvider.credential(idToken);
    await user.reauthenticateWithCredential(credential);
  } catch {
    // Surface a clear message to the UI.
    throw new Error('Re-authentication required. Please sign in again and retry deleting.');
  }
}

async function deleteSubcollection(
  collectionRef: FirebaseFirestoreTypes.CollectionReference
): Promise<void> {
  while (true) {
    const snapshot = await collectionRef.limit(400).get();
    if (snapshot.empty) break;
    const batch = firestore().batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function deleteFirestoreUserData(uid: string): Promise<void> {
  const userRef = firestore().collection('users').doc(uid);

  // Firestore does not cascade-delete subcollections with their parent.
  await deleteSubcollection(userRef.collection('loginRecords'));
  await deleteSubcollection(userRef.collection('purchases'));
  await deleteSubcollection(userRef.collection('subscriptions'));
  await deleteSubcollection(userRef.collection('entitlement'));
  await deleteSubcollection(userRef.collection('entitlementSources'));
  await deleteSubcollection(userRef.collection('payments'));

  const trips = await userRef.collection('trips').get();
  for (const trip of trips.docs) {
    const shareCode = trip.get('shareCode');
    if (typeof shareCode === 'string' && shareCode) {
      await firestore().collection('sharedTrips').doc(shareCode).delete().catch(() => {});
    }
  }
  await deleteSubcollection(userRef.collection('trips'));

  await userRef.delete();
}

/** Stops tracking and removes this account’s data. Keeps location consent and alarm-sound prefs. */
export async function clearLocalAccountData(): Promise<void> {
  await TrackingServiceAPI.stopTrackingService().catch(() => {});
  const keys = await AsyncStorage.getAllKeys();
  const toRemove = keys.filter((key) => !DEVICE_PREF_KEYS.has(key));
  if (toRemove.length > 0) {
    await AsyncStorage.multiRemove(toRemove);
  }
}

async function wipeAllLocalNapzData(): Promise<void> {
  await TrackingServiceAPI.stopTrackingService().catch(() => {});
  await clearLocationDisclosureConsent();
  await AsyncStorage.clear();
  try {
    await GoogleSignin.signOut();
  } catch {
    // Google session may already be signed out.
  }
}

/** Sign out of Firebase/Google and remove this account's data from the phone. */
export async function signOutAndClearLocalData(): Promise<void> {
  await TrackingServiceAPI.stopTrackingService().catch(() => {});
  try {
    await GoogleSignin.signOut();
  } catch {
    // Google session may already be signed out.
  }
  try {
    await auth().signOut();
  } catch {
    // Firebase session may already be signed out.
  }
  await clearLocalAccountData();
}

/**
 * "API" to delete the current user.
 * - Stops location tracking and clears native disclosure state
 * - Deletes Firestore profile and login history
 * - Deletes Firebase Auth user after re-authentication
 * - Clears all local app data
 */
export async function deleteCurrentUserAccount(): Promise<void> {
  const user = auth().currentUser;
  if (!user) {
    await wipeAllLocalNapzData();
    return;
  }

  await TrackingServiceAPI.stopTrackingService().catch(() => {});
  await reauthWithGoogleIfPossible();
  await deleteFirestoreUserData(user.uid);

  try {
    await user.delete();
  } catch (e: any) {
    const code = e?.code as string | undefined;
    if (code === 'auth/requires-recent-login') {
      await reauthWithGoogleIfPossible();
      await auth().currentUser?.delete();
    } else {
      throw e;
    }
  }

  await wipeAllLocalNapzData();
}

