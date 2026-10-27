import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import firestore, { type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import {
  DEFAULT_SUBSCRIPTION_TIER,
  mergeSubscriptionTier,
  normalizeSubscriptionTier,
  type NapzSubscriptionTier,
} from '../../subscription/subscriptionTier';

/** Firestore: /users/{auth.uid} — must match request.auth.uid in rules. */
export type UserProfile = {
  id?: string;
  name: string;
  mobile: string;
  email: string;
  pincode: string;
  photoUrl?: string | null;
  provider?: 'google' | 'manual' | 'review';
  /** @deprecated use subscriptionTier — migrated on read */
  premium?: boolean;
  subscriptionTier?: NapzSubscriptionTier;
};

type UserDocumentFields = {
  name: string;
  email: string;
  mobile: string;
  pincode: string;
  id: number;
};

function resolveUserId(existing: { id?: unknown } | undefined): number {
  if (existing && typeof existing.id === 'number' && Number.isFinite(existing.id)) {
    return existing.id;
  }
  return 0;
}

function buildUserRecord(
  base: { name: string; email: string; mobile: string; pincode: string },
  existing: { id?: unknown } | undefined
): UserDocumentFields {
  return {
    name: String(base.name).trim(),
    email: String(base.email).trim(),
    mobile: String(base.mobile || '').trim(),
    pincode: String(base.pincode || '').trim(),
    id: resolveUserId(existing),
  };
}

function stripUndefinedRecord(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

function isFirestoreNotFoundError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? '');
  return (
    code === 'not-found' ||
    code === 'firestore/not-found' ||
    (typeof code === 'string' && code.includes('not-found')) ||
    /not[- ]?found/i.test(msg)
  );
}

async function getUserDocumentSnapshot(
  userRef: FirebaseFirestoreTypes.DocumentReference
): Promise<FirebaseFirestoreTypes.DocumentSnapshot> {
  try {
    return await userRef.get({ source: 'server' } as FirebaseFirestoreTypes.GetOptions);
  } catch {
    return userRef.get();
  }
}

async function writeUserRootDocument(
  userRef: FirebaseFirestoreTypes.DocumentReference,
  data: UserDocumentFields,
  opts: {
    photoUrl: string | null;
    provider: 'google' | 'manual';
    snap: FirebaseFirestoreTypes.DocumentSnapshot;
    subscriptionTier?: NapzSubscriptionTier;
  }
): Promise<void> {
  const { photoUrl, provider, snap } = opts;
  const payload: Record<string, unknown> = {
    ...data,
    photoUrl,
    provider,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  if (opts.subscriptionTier !== undefined) {
    payload.subscriptionTier = opts.subscriptionTier;
  }
  if (!snap.exists) {
    payload.createdAt = firestore.FieldValue.serverTimestamp();
  }
  const clean = stripUndefinedRecord(payload);
  try {
    await userRef.set(clean, { merge: true });
  } catch (e) {
    if (!isFirestoreNotFoundError(e)) {
      throw e;
    }
    const existing = (snap.data() as Record<string, unknown> | undefined) ?? {};
    const merged: Record<string, unknown> = {
      ...existing,
      ...data,
      photoUrl,
      provider,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };
    if (opts.subscriptionTier !== undefined) {
      merged.subscriptionTier = opts.subscriptionTier;
    }
    if (!snap.exists) {
      merged.createdAt = firestore.FieldValue.serverTimestamp();
    } else if (existing.createdAt == null) {
      merged.createdAt = firestore.FieldValue.serverTimestamp();
    }
    await userRef.set(stripUndefinedRecord(merged), { merge: true });
  }
}

export function firestoreErrorMessage(e: unknown) {
  if (e && typeof e === 'object' && 'code' in e) {
    const code = (e as { code?: string }).code;
    const message = (e as { message?: string }).message;
    if (code === 'not-found' || (typeof code === 'string' && code.includes('not-found'))) {
      return 'Firestore not-found (create the database in Firebase Console; publish firestore.rules).';
    }
    if (code === 'permission-denied') {
      return 'Firestore permission denied. Check firestore.rules for users/{userId}.';
    }
    return String(message ?? code);
  }
  return String(e);
}

/**
 * Firebase Auth (Google credential) + Firestore user doc + loginRecords.
 * Call after Google Sign-In session exists (so getTokens() works).
 */
export async function syncGoogleProfileToFirebase(user: UserProfile): Promise<UserProfile> {
  const { idToken } = await GoogleSignin.getTokens();
  if (!idToken) {
    throw new Error('NO_GOOGLE_TOKEN');
  }
  await auth().signInWithCredential(auth.GoogleAuthProvider.credential(idToken));

  const uid = auth().currentUser?.uid;
  if (!uid) {
    throw new Error('NO_FIREBASE_UID');
  }

  const userRef = firestore().collection('users').doc(uid);
  const snap = await getUserDocumentSnapshot(userRef);
  const existing = snap.data() as {
    id?: unknown;
    mobile?: unknown;
    pincode?: unknown;
    premium?: unknown;
    subscriptionTier?: unknown;
  } | undefined;
  const mobile = String(user.mobile || existing?.mobile || '').trim();
  const pincode = String(user.pincode || existing?.pincode || '').trim();
  const data = buildUserRecord(
    {
      name: user.name || 'Google User',
      email: user.email,
      mobile,
      pincode,
    },
    existing
  );
  await writeUserRootDocument(userRef, data, {
    photoUrl: user.photoUrl || null,
    provider: 'google',
    snap,
  });

  try {
    await userRef.collection('loginRecords').add({
      email: user.email,
      name: user.name || 'Google User',
      photoUrl: user.photoUrl || null,
      provider: 'google',
      mobile: mobile || null,
      pincode: pincode || null,
      loginAt: firestore.FieldValue.serverTimestamp(),
      platform: Platform.OS,
    });
  } catch (subErr) {
    console.warn('loginRecords (non-fatal):', subErr);
  }

  return { ...user, mobile, pincode };
}

/** Update mobile / PIN on the signed-in user's Firestore document. */
export async function saveProfileContactToFirebase(user: UserProfile): Promise<void> {
  const uid = await ensureFirebaseUid();
  if (!uid) {
    throw new Error('Sign in with Google to save your details to the cloud.');
  }

  const userRef = firestore().collection('users').doc(uid);
  const snap = await getUserDocumentSnapshot(userRef);
  const existing = snap.data() as { premium?: unknown; subscriptionTier?: unknown } | undefined;
  const data = buildUserRecord(
    {
      name: user.name || 'Google User',
      email: user.email,
      mobile: user.mobile || '',
      pincode: user.pincode || '',
    },
    existing
  );
  await writeUserRootDocument(userRef, data, {
    photoUrl: user.photoUrl || null,
    provider: user.provider === 'manual' ? 'manual' : 'google',
    snap,
  });
}

async function ensureFirebaseUid(): Promise<string | null> {
  let uid = auth().currentUser?.uid ?? null;
  if (uid) return uid;
  try {
    const { idToken } = await GoogleSignin.getTokens();
    if (idToken) {
      await auth().signInWithCredential(auth.GoogleAuthProvider.credential(idToken));
      uid = auth().currentUser?.uid ?? null;
    }
  } catch {
    return null;
  }
  return uid;
}

/** @deprecated Premium tier is server-written at users/{uid}/entitlement/current */
export async function saveSubscriptionTierToFirebase(
  _tier: NapzSubscriptionTier
): Promise<void> {
  console.warn(
    'saveSubscriptionTierToFirebase is deprecated; entitlement is verified by Cloud Functions.'
  );
}

/** @deprecated use saveSubscriptionTierToFirebase */
export async function savePremiumToFirebase(premium: boolean): Promise<void> {
  return saveSubscriptionTierToFirebase(premium ? 'premium' : DEFAULT_SUBSCRIPTION_TIER);
}

/** Read saved mobile / PIN from the signed-in user's Firestore document. */
export async function fetchSavedContactFromFirebase(): Promise<{
  mobile: string;
  pincode: string;
  subscriptionTier: NapzSubscriptionTier;
} | null> {
  const uid = await ensureFirebaseUid();
  if (!uid) return null;

  const snap = await getUserDocumentSnapshot(firestore().collection('users').doc(uid));
  if (!snap.exists) return null;
  const data = snap.data() as {
    mobile?: unknown;
    pincode?: unknown;
    premium?: unknown;
    subscriptionTier?: unknown;
  } | undefined;
  return {
    mobile: String(data?.mobile ?? '').replace(/\D/g, '').slice(0, 10),
    pincode: String(data?.pincode ?? '').replace(/\D/g, '').slice(0, 6),
    subscriptionTier: normalizeSubscriptionTier(data?.subscriptionTier, data?.premium),
  };
}
