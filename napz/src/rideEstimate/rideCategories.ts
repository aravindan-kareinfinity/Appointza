import type { PlatformId } from './platformCatalog';
import type { OverviewModeId } from './types';

export type RideCategoryId = 'all' | 'bike' | 'auto' | 'cab' | 'car' | 'transit';
export type VehicleCategoryId = Exclude<RideCategoryId, 'all'>;

export const RIDE_CATEGORY_TABS: { id: RideCategoryId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'bike', label: 'Bike' },
  { id: 'auto', label: 'Auto' },
  { id: 'cab', label: 'Cab' },
  { id: 'car', label: 'Car' },
  { id: 'transit', label: 'Bus & train' },
];

export const VEHICLE_CATEGORIES: {
  id: VehicleCategoryId;
  label: string;
  hint: string;
  icon: string;
}[] = [
  { id: 'bike', label: 'Bike', hint: 'A two-wheeler ride', icon: 'bicycle' },
  { id: 'auto', label: 'Auto', hint: 'A three-wheeler ride', icon: 'car-sport-outline' },
  { id: 'cab', label: 'Cab', hint: 'A taxi ride', icon: 'car-outline' },
  { id: 'car', label: 'Car', hint: 'You drive', icon: 'navigate-outline' },
  { id: 'transit', label: 'Bus & train', hint: 'Bus, metro, or train', icon: 'bus-outline' },
];

export function productMatchesCategory(name: string, category: VehicleCategoryId): boolean {
  const n = name.toLowerCase();
  if (category === 'bike') return /bike|cycle|moto|scoot/.test(n);
  if (category === 'auto') return /auto|rickshaw|tuk/.test(n);
  if (category === 'cab' || category === 'car') {
    if (/auto|bike|cycle|moto|scoot/.test(n)) return false;
    return /go|premier|xl|sedan|suv|mini|prime|cab|car|uber|comfort|share|pool/.test(n) || n.length > 0;
  }
  return false;
}

export function platformsForCategory(id: VehicleCategoryId): PlatformId[] {
  if (id === 'bike') return ['rapido', 'ola', 'namma_yatri'];
  if (id === 'auto') return ['ola', 'rapido', 'uber', 'namma_yatri'];
  if (id === 'cab') return ['uber', 'ola', 'rapido', 'namma_yatri', 'indrive'];
  if (id === 'car') return ['uber', 'ola', 'blablacar', 'indrive'];
  return ['google_maps', 'chalo', 'redbus', 'abhibus', 'irctc', 'where_is_my_train'];
}

export function primaryPlatformForCategory(id: VehicleCategoryId): PlatformId {
  if (id === 'bike') return 'rapido';
  if (id === 'auto') return 'ola';
  if (id === 'cab' || id === 'car') return 'uber';
  return 'google_maps';
}

export function overviewModeForCategory(id: VehicleCategoryId): OverviewModeId {
  if (id === 'bike') return 'two_wheeler';
  if (id === 'transit') return 'transit';
  return 'car';
}

export function olaLaunchCategory(id: VehicleCategoryId): string | undefined {
  if (id === 'bike') return 'bike';
  if (id === 'auto') return 'auto';
  if (id === 'cab' || id === 'car') return 'car';
  return undefined;
}
