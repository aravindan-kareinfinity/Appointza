import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodePolyline } from '../rideEstimate/decodePolyline';
import { computeRoutesHttp } from '../rideEstimate/googleRoutesHttp';
import { downsample, ghatSpansFromElevation, ghatSpansFromNames, offsetFor } from './geo';
import { adjustMinutesForMode, parseWeather } from './forecast';
import { applyDescriptions } from './planTrip';
import { napzFunctions } from '../services/firebase/functionsClient';
import { fill, t } from './i18n';
import { formatHours, formatInr, localParts } from './time';
import type { TravelMode, TripPlace, TripPlan } from './types';

const LOCAL_KEY = 'tripmate.trips.v1';

type OsrmResponse = {
  code?: string;
  routes?: { distance?: number; duration?: number; geometry?: { coordinates?: [number, number][] } }[];
};

function secondsFromDuration(value?: string): number {
  const match = /^(\d+(?:\.\d+)?)s$/.exec(value ?? '');
  return match ? Number(match[1]) : 0;
}

async function finishRoute(
  origin: TripPlace,
  destination: TripPlace,
  mode: TravelMode,
  geometry: { lat: number; lng: number }[],
  distanceMeters: number,
  durationSeconds: number
) {
  const line = downsample(geometry, 80);
  let ghatSpans = ghatSpansFromNames(origin.name, destination.name);
  try {
    const samples = downsample(geometry, 16);
    const lats = samples.map((point) => point.lat.toFixed(4)).join(',');
    const lngs = samples.map((point) => point.lng.toFixed(4)).join(',');
    const elevResponse = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`);
    if (elevResponse.ok) {
      const elev = (await elevResponse.json()) as { elevation?: number[] };
      const parsed = ghatSpansFromElevation(
        samples.map((point, index) => ({
          fraction: samples.length === 1 ? 0 : index / (samples.length - 1),
          elevation: elev.elevation?.[index] ?? 0,
        }))
      );
      if (parsed.length) ghatSpans = parsed;
    }
  } catch {
    /* name hint already applied */
  }
  return {
    oneWayKm: distanceMeters / 1000,
    oneWayMinutes: adjustMinutesForMode(durationSeconds / 60, mode),
    route: line,
    ghatSpans,
    utcOffsetMinutes: offsetFor(origin.lat, origin.lng),
  };
}

export async function fetchTripRoute(origin: TripPlace, destination: TripPlace, mode: TravelMode) {
  try {
    const travelMode = mode === 'bike' ? 'TWO_WHEELER' : 'DRIVE';
    const google = await computeRoutesHttp(origin, destination, travelMode);
    const found = google.routes?.[0];
    const geometry = decodePolyline(found?.polyline?.encodedPolyline ?? '');
    const durationSeconds = secondsFromDuration(found?.staticDuration) || secondsFromDuration(found?.duration);
    if (geometry.length >= 2 && found?.distanceMeters && durationSeconds > 0) {
      return finishRoute(origin, destination, mode, geometry, found.distanceMeters, durationSeconds);
    }
  } catch {
    /* OpenStreetMap routing below */
  }

  const path = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`,
    { headers: { 'User-Agent': 'napz/1.0' } }
  );
  if (!response.ok) throw new Error('route');
  const data = (await response.json()) as OsrmResponse;
  const route = data.routes?.[0];
  const geometry = (route?.geometry?.coordinates ?? []).map(([lng, lat]) => ({ lat, lng }));
  if (data.code !== 'Ok' || !route?.duration || !route.distance || geometry.length < 2) throw new Error('route');
  return finishRoute(origin, destination, mode, geometry, route.distance, route.duration);
}

export async function fetchDestinationWeather(
  lat: number,
  lng: number,
  start: string,
  end: string,
  lang: import('./types').Lang
) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&start_date=${start}&end_date=${end}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('weather');
  return parseWeather((await response.json()) as Parameters<typeof parseWeather>[0], lang);
}

async function readLocal(): Promise<TripPlan[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TripPlan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocal(plans: TripPlan[]) {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(plans.slice(0, 20)));
}

export async function saveTrip(plan: TripPlan): Promise<'cloud' | 'local'> {
  const slim = JSON.parse(JSON.stringify({
    ...plan,
    routeMeta: { ...plan.routeMeta, route: plan.routeMeta.route.slice(0, 80) },
  })) as TripPlan;
  const local = await readLocal();
  await writeLocal([slim, ...local.filter((item) => item.id !== slim.id)]);
  const uid = auth().currentUser?.uid;
  if (!uid) return 'local';
  await firestore().collection('users').doc(uid).collection('trips').doc(slim.id).set(slim);
  return 'cloud';
}

export async function listTrips(): Promise<TripPlan[]> {
  const uid = auth().currentUser?.uid;
  if (!uid) return readLocal();
  try {
    const snap = await firestore().collection('users').doc(uid).collection('trips').get();
    const cloud = snap.docs.map((doc) => doc.data() as TripPlan);
    cloud.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return cloud;
  } catch {
    return readLocal();
  }
}

export async function deleteTrip(plan: TripPlan) {
  const local = await readLocal();
  await writeLocal(local.filter((item) => item.id !== plan.id));
  const uid = auth().currentUser?.uid;
  if (!uid) return;
  await firestore().collection('users').doc(uid).collection('trips').doc(plan.id).delete().catch(() => {});
  if (plan.shareCode) {
    await firestore().collection('sharedTrips').doc(plan.shareCode).delete().catch(() => {});
  }
}

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export async function publishTrip(plan: TripPlan): Promise<TripPlan> {
  const uid = auth().currentUser?.uid;
  if (!uid) return plan;
  const shareCode = plan.shareCode || makeCode();
  const next = { ...plan, shareCode };
  await firestore().collection('sharedTrips').doc(shareCode).set({ ownerUid: uid, plan: next });
  await firestore().collection('users').doc(uid).collection('trips').doc(plan.id).set(next).catch(() => {});
  return next;
}

export async function openSharedTrip(code: string): Promise<TripPlan | null> {
  const snap = await firestore().collection('sharedTrips').doc(code.trim().toUpperCase()).get();
  if (!snap.exists) return null;
  const data = snap.data() as { plan?: TripPlan } | undefined;
  return data?.plan ?? null;
}

export function itineraryText(plan: TripPlan): string {
  const lang = plan.request.lang;
  const lines = [
    `TripMate · ${plan.request.origin.name} → ${plan.request.destination.name}`,
    `${t(lang, 'distance')}: ${plan.distanceKm} km`,
    `${t(lang, 'driveTime')}: ${formatHours(plan.driveMinutes)}`,
    `${t(lang, 'perPerson')}: ${formatInr(plan.budget.perPerson)}`,
    plan.shareCode ? `${t(lang, 'sharePrompt')}: ${plan.shareCode}` : '',
    '',
  ];
  for (const day of plan.days) {
    lines.push(day.label);
    for (const stop of day.stops) {
      const time = localParts(stop.at, plan.utcOffsetMinutes).time;
      lines.push(`${time}  ${stop.name}`);
      lines.push(`    ${stop.tip}`);
      if (stop.costPerPerson > 0) lines.push(`    ${fill(t(lang, 'costAbout'), { cost: formatInr(stop.costPerPerson) })}`);
      if (stop.confirmBeforeGoing) lines.push(`    ${t(lang, 'confirmNote')}`);
    }
    lines.push('');
  }
  lines.push(t(lang, 'backupTitle'));
  lines.push(plan.backupPlan);
  lines.push('');
  lines.push(t(lang, 'packing'));
  for (const item of plan.packing) lines.push(`${item.checked ? '[x]' : '[ ]'} ${item.label}`);
  return lines.filter((line, index) => line !== '' || lines[index - 1] !== '').join('\n');
}

export async function narratePlan(plan: TripPlan): Promise<TripPlan | null> {
  if (!auth().currentUser) return null;
  try {
    const call = napzFunctions().httpsCallable('narrateTrip');
    const result = await Promise.race([
      call({
        lang: plan.request.lang,
        stops: plan.days.flatMap((day) => day.stops).map((stop) => ({
          id: stop.id,
          name: stop.name,
          kind: stop.kind,
          tip: stop.tip,
        })),
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ]);
    const data = (result as { data?: { descriptions?: Record<string, string> | null } }).data;
    if (!data?.descriptions) return null;
    return applyDescriptions(plan, data.descriptions);
  } catch {
    return null;
  }
}
