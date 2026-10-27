export function formatDurationSeconds(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}s`;
  const minutes = Math.round(total / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

export function formatMeters(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function transitLineLabel(leg: {
  lineShortName?: string;
  lineName?: string;
  vehicleType?: string;
}): string {
  const line = [leg.lineShortName, leg.lineName].filter(Boolean).join(' · ') || 'Transit';
  return leg.vehicleType ? `${line} · ${leg.vehicleType}` : line;
}

export function simpleVehicleWord(vehicleType?: string): string {
  const value = (vehicleType ?? '').toLowerCase();
  if (/sub|metro|metrô|underground/.test(value)) return 'Metro';
  if (/train|rail/.test(value)) return 'Train';
  if (/tram|light/.test(value)) return 'Tram';
  if (/walk/.test(value)) return 'Walk';
  return 'Bus';
}

export function simpleLineName(leg: {
  lineShortName?: string;
  lineName?: string;
  vehicleType?: string;
}): string {
  return leg.lineShortName || leg.lineName || simpleVehicleWord(leg.vehicleType);
}

export function isValidRideCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
