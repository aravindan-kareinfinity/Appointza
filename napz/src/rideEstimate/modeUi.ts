import type { OverviewModeId, OverviewRoute } from './types';

/** Google Maps–style order: drive, two-wheeler, transit, walk, cycle. */
export const GOOGLE_MODE_ORDER: OverviewModeId[] = [
  'car',
  'two_wheeler',
  'transit',
  'walking',
  'cycling',
];

export function modeIcon(mode: OverviewModeId): string {
  if (mode === 'walking') return 'walk-outline';
  if (mode === 'cycling') return 'bicycle-outline';
  if (mode === 'two_wheeler') return 'bicycle';
  if (mode === 'transit') return 'bus-outline';
  return 'car-outline';
}

export function modeShortLabel(mode: OverviewModeId): string {
  if (mode === 'walking') return 'Walk';
  if (mode === 'cycling') return 'Cycle';
  if (mode === 'two_wheeler') return 'Bike';
  if (mode === 'transit') return 'Transit';
  return 'Drive';
}

export function sortModesLikeGoogleMaps(routes: OverviewRoute[]): OverviewRoute[] {
  return [...routes].sort(
    (a, b) => GOOGLE_MODE_ORDER.indexOf(a.mode) - GOOGLE_MODE_ORDER.indexOf(b.mode)
  );
}
