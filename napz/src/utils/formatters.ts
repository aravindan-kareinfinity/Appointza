export function normalizeRadius(value: number, min = 50, max = 5000): number {
  if (!Number.isFinite(value) || value <= 0) return 1000;
  return Math.min(Math.max(Math.round(value), min), max);
}

export function isValidDestination(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
