import { haversineKm } from './geo';
import { fill, t } from './i18n';
import type { TripPlan, TripStop } from './types';

export type ShopHit = {
  lat: number;
  lng: number;
  name?: string;
  shop?: string;
  amenity?: string;
};

type OverpassElement = {
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: { name?: string; shop?: string; amenity?: string };
};

function isTeaBreak(stop: TripStop): boolean {
  return stop.kind === 'break' && stop.durationMin <= 30;
}

function hasSwap(stop: TripStop): boolean {
  return /swap|மாற்றம்/i.test(stop.name);
}

export function pickTeaShop(hits: ShopHit[], origin: { lat: number; lng: number }): ShopHit | null {
  const named = hits.filter((hit) => hit.name && hit.name.trim() && Number.isFinite(hit.lat) && Number.isFinite(hit.lng));
  if (named.length === 0) return null;
  const rank = (hit: ShopHit) => {
    const name = hit.name!.toLowerCase();
    if (hit.shop === 'tea' || /tea|chai|coffee|cafe|café/.test(name)) return 0;
    if (hit.amenity === 'cafe') return 1;
    return 2;
  };
  named.sort((a, b) => {
    const scoreA = rank(a) * 20 + haversineKm(origin, a);
    const scoreB = rank(b) * 20 + haversineKm(origin, b);
    return scoreA - scoreB;
  });
  const best = named[0];
  if (haversineKm(origin, best) > 5) return null;
  return best;
}

async function fetchShops(lat: number, lng: number): Promise<ShopHit[]> {
  const query = `[out:json][timeout:12];(
node["shop"="tea"](around:4000,${lat},${lng});
node["amenity"="cafe"](around:4000,${lat},${lng});
way["amenity"="cafe"](around:4000,${lat},${lng});
node["amenity"="fast_food"](around:2500,${lat},${lng});
);out center 8;`;
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'napz/1.0',
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as { elements?: OverpassElement[] };
  return (payload.elements ?? []).map((element) => ({
    lat: element.lat ?? element.center?.lat ?? Number.NaN,
    lng: element.lon ?? element.center?.lon ?? Number.NaN,
    name: element.tags?.name,
    shop: element.tags?.shop,
    amenity: element.tags?.amenity,
  }));
}

async function placeLabel(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'napz/1.0' } });
    if (!response.ok) return null;
    const payload = (await response.json()) as { display_name?: string; address?: { town?: string; city?: string; village?: string; county?: string } };
    const local = payload.address?.town || payload.address?.city || payload.address?.village || payload.address?.county;
    if (local) return local;
    const display = payload.display_name?.split(',').map((part) => part.trim()).filter(Boolean) ?? [];
    return display[0] || null;
  } catch {
    return null;
  }
}

function withShop(stop: TripStop, shop: ShopHit, lang: TripPlan['request']['lang']): TripStop {
  const swap = hasSwap(stop);
  return {
    ...stop,
    name: fill(t(lang, swap ? 'teaAtSwap' : 'teaAt'), { shop: shop.name ?? '' }),
    tip: t(lang, 'teaShopTip'),
    description: fill(t(lang, 'teaShopDesc'), { shop: shop.name ?? '' }),
    lat: shop.lat,
    lng: shop.lng,
  };
}

function withPlace(stop: TripStop, place: string, lang: TripPlan['request']['lang']): TripStop {
  const swap = hasSwap(stop);
  return {
    ...stop,
    name: fill(t(lang, swap ? 'teaNearSwap' : 'teaNear'), { place }),
    tip: t(lang, 'teaNearTip'),
    description: fill(t(lang, 'teaNearDesc'), { place }),
  };
}

export async function attachTeaShops(plan: TripPlan): Promise<TripPlan> {
  const lang = plan.request.lang;
  const updates = new Map<string, TripStop>();
  const teaStops = plan.days.flatMap((day) => day.stops).filter(isTeaBreak);
  await Promise.all(
    teaStops.map(async (stop) => {
      try {
        const shop = pickTeaShop(await fetchShops(stop.lat, stop.lng), stop);
        if (shop?.name) {
          updates.set(stop.id, withShop(stop, shop, lang));
          return;
        }
      } catch {
        /* fall through to a place name */
      }
      const place = await placeLabel(stop.lat, stop.lng);
      if (place) updates.set(stop.id, withPlace(stop, place, lang));
    })
  );
  if (updates.size === 0) return plan;
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      stops: day.stops.map((stop) => updates.get(stop.id) ?? stop),
    })),
  };
}
