import type { GhatSpan, LatLng } from './types';

const GHAT_HINTS = [
  'ooty', 'udhagamandalam', 'ootacamund', 'kodaikanal', 'munnar', 'wayanad', 'coorg', 'madikeri',
  'coonoor', 'yercaud', 'yelagiri', 'kolli', 'valparai', 'manali', 'shimla', 'mussoorie',
  'nainital', 'darjeeling', 'gangtok', 'lonavala', 'khandala', 'mahabaleshwar', 'saputara',
  'chikmagalur', 'sakleshpur', 'nilgiri', 'palani',
];

export function haversineKm(a: LatLng, b: LatLng): number {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function pointAlong(route: LatLng[], fraction: number): LatLng {
  if (route.length === 0) return { lat: 0, lng: 0 };
  if (route.length === 1 || fraction <= 0) return route[0];
  if (fraction >= 1) return route[route.length - 1];
  const cum = [0];
  for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + haversineKm(route[i - 1], route[i]));
  const total = cum[cum.length - 1];
  if (total <= 0) return route[Math.min(route.length - 1, Math.round(fraction * (route.length - 1)))];
  const target = total * fraction;
  for (let i = 1; i < route.length; i++) {
    if (cum[i] >= target) {
      const span = cum[i] - cum[i - 1] || 1;
      const t = (target - cum[i - 1]) / span;
      return {
        lat: route[i - 1].lat + (route[i].lat - route[i - 1].lat) * t,
        lng: route[i - 1].lng + (route[i].lng - route[i - 1].lng) * t,
      };
    }
  }
  return route[route.length - 1];
}

export function downsample(route: LatLng[], maxPoints: number): LatLng[] {
  if (route.length <= maxPoints) return route.slice();
  const out: LatLng[] = [];
  const last = route.length - 1;
  for (let i = 0; i < maxPoints; i++) {
    const index = Math.round((i * last) / (maxPoints - 1));
    const point = route[index];
    const prev = out[out.length - 1];
    if (!prev || prev.lat !== point.lat || prev.lng !== point.lng) out.push(point);
  }
  return out;
}

export function ghatSpansFromElevation(samples: { fraction: number; elevation: number }[]): GhatSpan[] {
  if (samples.length < 2) return [];
  const steep: boolean[] = [];
  for (let i = 0; i < samples.length - 1; i++) {
    const delta = Math.abs(samples[i + 1].elevation - samples[i].elevation);
    const high = samples[i].elevation >= 800 || samples[i + 1].elevation >= 800;
    steep.push(delta >= 180 || (high && delta >= 100));
  }
  const spans: GhatSpan[] = [];
  let open: number | null = null;
  for (let i = 0; i < steep.length; i++) {
    if (steep[i] && open == null) open = samples[i].fraction;
    if (!steep[i] && open != null) {
      spans.push({ start: open, end: samples[i].fraction });
      open = null;
    }
  }
  if (open != null) spans.push({ start: open, end: samples[samples.length - 1].fraction });
  return spans;
}

export function ghatSpansFromNames(origin: string, destination: string): GhatSpan[] {
  const has = (name: string) => GHAT_HINTS.some((hint) => name.toLowerCase().includes(hint));
  const fromHills = has(origin);
  const toHills = has(destination);
  if (fromHills && toHills) return [{ start: 0.08, end: 0.92 }];
  if (toHills) return [{ start: 0.7, end: 0.98 }];
  if (fromHills) return [{ start: 0.02, end: 0.3 }];
  return [];
}

export function offsetFor(lat: number, lng: number): number {
  if (lat >= 6 && lat <= 37 && lng >= 68 && lng <= 97) return 330;
  return Math.round((lng / 15) * 60);
}
