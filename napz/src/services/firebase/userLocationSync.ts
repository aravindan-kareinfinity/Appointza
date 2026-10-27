import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { SavedPlace } from '../../types/place';
import { haversineDistance } from '../../utils/distance';

const MIN_WRITE_MS = 30_000;
const MIN_MOVE_METERS = 40;

let lastWriteAt = 0;
let lastWritten: { lat: number; lng: number } | null = null;

function usersDoc(uid: string) {
  return firestore().collection('users').doc(uid);
}

function savedPlacesCol(uid: string) {
  return usersDoc(uid).collection('savedPlaces');
}

/** Last known GPS on users/{uid} — throttled so tracking does not spam Firestore. */
export async function syncUserLocationToFirebase(coords: {
  lat: number;
  lng: number;
}): Promise<void> {
  const uid = auth().currentUser?.uid;
  if (!uid) return;
  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return;

  const now = Date.now();
  const moved =
    lastWritten == null
      ? Infinity
      : haversineDistance(lastWritten.lat, lastWritten.lng, coords.lat, coords.lng);
  if (now - lastWriteAt < MIN_WRITE_MS && moved < MIN_MOVE_METERS) {
    return;
  }

  lastWriteAt = now;
  lastWritten = { lat: coords.lat, lng: coords.lng };

  await usersDoc(uid).set(
    {
      lastLocation: new firestore.GeoPoint(coords.lat, coords.lng),
      lastLocationLat: coords.lat,
      lastLocationLng: coords.lng,
      lastLocationUpdatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/** Place name + alert radius on users/{uid} (current destination / saved place). */
export async function syncPlaceAlertToFirebase(place: {
  placeName: string;
  lat: number;
  lng: number;
  alertRadius: number;
}): Promise<void> {
  const uid = auth().currentUser?.uid;
  if (!uid) return;
  const name = String(place.placeName || '').trim();
  const alertRadius = Number(place.alertRadius);
  if (!name || !Number.isFinite(alertRadius)) return;
  if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return;

  await usersDoc(uid).set(
    {
      placeName: name,
      alertRadius,
      destinationLat: place.lat,
      destinationLng: place.lng,
      destinationLocation: new firestore.GeoPoint(place.lat, place.lng),
      placeUpdatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function fetchSavedPlacesFromFirebase(): Promise<SavedPlace[]> {
  const uid = auth().currentUser?.uid;
  if (!uid) return [];
  const snap = await savedPlacesCol(uid).get();
  return snap.docs
    .map((doc) => {
      const d = doc.data();
      const lat = Number(d.lat);
      const lng = Number(d.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const place: SavedPlace = {
        id: String(d.id ?? doc.id),
        name: String(d.placeName ?? d.name ?? 'Place'),
        lat,
        lng,
        radius: Number(d.alertRadius ?? d.radius) || 1000,
        createdAt: String(d.createdAt ?? new Date().toISOString()),
      };
      return place;
    })
    .filter((p): p is SavedPlace => p != null);
}

export async function upsertSavedPlaceToFirebase(place: SavedPlace): Promise<void> {
  const uid = auth().currentUser?.uid;
  if (!uid) return;
  await savedPlacesCol(uid).doc(place.id).set(
    {
      id: place.id,
      name: place.name,
      placeName: place.name,
      lat: place.lat,
      lng: place.lng,
      radius: place.radius,
      alertRadius: place.radius,
      createdAt: place.createdAt,
      location: new firestore.GeoPoint(place.lat, place.lng),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  await syncPlaceAlertToFirebase({
    placeName: place.name,
    lat: place.lat,
    lng: place.lng,
    alertRadius: place.radius,
  });
}

export async function deleteSavedPlaceFromFirebase(placeId: string): Promise<void> {
  const uid = auth().currentUser?.uid;
  if (!uid) return;
  await savedPlacesCol(uid).doc(placeId).delete();
}
