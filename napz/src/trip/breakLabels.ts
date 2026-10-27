import { fill, t } from './i18n';
import type { CopyKey } from './i18n';
import { localParts } from './time';
import type { Lang, TripStop } from './types';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'tea';

export type AddressComponent = { long_name?: string; types?: string[] };

/** Clock time on the road decides the meal. 9:30 PM is dinner; 12:30 AM is tea. */
export function mealSlot(minutesFromMidnight: number): MealSlot {
  const minutes = ((minutesFromMidnight % 1440) + 1440) % 1440;
  if (minutes >= 7 * 60 && minutes < 10 * 60) return 'breakfast';
  if (minutes >= 12 * 60 + 30 && minutes < 14 * 60 + 30) return 'lunch';
  if (minutes >= 20 * 60 && minutes < 22 * 60 + 30) return 'dinner';
  return 'tea';
}

export function minutesAt(iso: string, offsetMin: number): number {
  const [hh, mm] = localParts(iso, offsetMin).time.split(':').map(Number);
  return hh * 60 + mm;
}

export function townFromGeocode(results: { address_components?: AddressComponent[] }[]): string | null {
  const order = ['locality', 'administrative_area_level_3', 'sublocality', 'administrative_area_level_2'];
  for (const type of order) {
    for (const result of results) {
      const match = result.address_components?.find((part) => part.types?.includes(type) && part.long_name);
      if (match?.long_name) return match.long_name;
    }
  }
  return null;
}

export type PlacePick = { name: string; rating?: number; lat: number; lng: number; photoRef?: string };

export function pickListedPlace(results: PlacePick[]): PlacePick | null {
  const named = results.filter((item) => item.name.trim() && Number.isFinite(item.lat) && Number.isFinite(item.lng));
  if (named.length === 0) return null;
  const rated = named.filter((item) => (item.rating ?? 0) >= 4);
  const pool = (rated.length > 0 ? rated : named).slice();
  pool.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (a.photoRef ? 0 : 1) - (b.photoRef ? 0 : 1));
  return pool.find((item) => item.photoRef) ?? pool[0];
}

const NEAR: Record<MealSlot, CopyKey> = {
  breakfast: 'breakfastNear',
  lunch: 'lunchNear',
  dinner: 'dinnerNear',
  tea: 'teaTown',
};

const WITH_PLACE: Record<MealSlot, CopyKey> = {
  breakfast: 'breakfastPlace',
  lunch: 'lunchPlace',
  dinner: 'dinnerPlace',
  tea: 'teaTownPlace',
};

export function breakTitle(lang: Lang, slot: MealSlot, town: string, place?: string | null): string {
  if (place) return fill(t(lang, WITH_PLACE[slot]), { town, place });
  return fill(t(lang, NEAR[slot]), { town });
}

export function slotForStop(stop: TripStop, offsetMin: number): MealSlot | 'rest' {
  if (stop.kind === 'ghat_hold') return 'rest';
  return mealSlot(minutesAt(stop.at, offsetMin));
}
