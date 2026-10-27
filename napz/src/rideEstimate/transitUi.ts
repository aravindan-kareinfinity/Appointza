import { formatDurationSeconds, formatMeters, simpleLineName } from './formatJourney';
import type { BusRouteOption, TransitLeg } from './types';

export function walkMinutesForRoute(route: BusRouteOption): number | null {
  const fromLeg = walkMinutes(firstWalk(route));
  if (fromLeg != null) return fromLeg;
  if (route.walkToStopMeters && route.walkToStopMeters > 0) {
    return Math.max(1, Math.round(route.walkToStopMeters / 80));
  }
  return null;
}

export function walkMinutes(leg: TransitLeg | undefined): number | null {
  if (!leg || leg.travelMode !== 'WALK') return null;
  if (leg.durationSeconds && leg.durationSeconds > 0) {
    return Math.max(1, Math.round(leg.durationSeconds / 60));
  }
  if (leg.distanceMeters && leg.distanceMeters > 0) {
    return Math.max(1, Math.round(leg.distanceMeters / 80));
  }
  return null;
}

export function firstWalk(route: BusRouteOption): TransitLeg | undefined {
  return route.legs.find((leg) => leg.travelMode === 'WALK');
}

export function lastWalk(route: BusRouteOption): TransitLeg | undefined {
  return [...route.legs].reverse().find((leg) => leg.travelMode === 'WALK');
}

export function transitLegs(route: BusRouteOption): TransitLeg[] {
  return route.legs.filter((leg) => leg.travelMode === 'TRANSIT');
}

export function lineChips(route: BusRouteOption): string[] {
  const names = transitLegs(route)
    .map((leg) => simpleLineName(leg))
    .filter((name) => name.length > 0 && name !== 'Bus');
  return [...new Set(names)];
}

export function tripMinutesLabel(route: BusRouteOption): string {
  if (route.durationText) {
    const match = route.durationText.match(/(\d+)\s*min/i);
    if (match) return match[1];
    return route.durationText.replace(/\s*min.*/i, '');
  }
  if (route.durationSeconds) {
    return String(Math.max(1, Math.round(route.durationSeconds / 60)));
  }
  return '—';
}

export function tripTimeRange(route: BusRouteOption): string | null {
  if (route.departureTime && route.arrivalTime) {
    return `${route.departureTime} – ${route.arrivalTime}`;
  }
  return null;
}

export function scheduledFrom(route: BusRouteOption): string | null {
  const first = transitLegs(route)[0];
  if (!first?.boardingStop?.name) return null;
  const when = first.departureTime ?? route.departureTime;
  if (when) return `Scheduled at ${when} from ${first.boardingStop.name}`;
  return `From ${first.boardingStop.name}`;
}

export function walkSummary(leg: TransitLeg | undefined): string | null {
  if (!leg) return null;
  const minutes = walkMinutes(leg);
  const distance = leg.distanceMeters != null ? formatMeters(leg.distanceMeters) : null;
  if (minutes && distance) return `Walk ${minutes} min (${distance})`;
  if (minutes) return `Walk ${minutes} min`;
  if (distance) return `Walk ${distance}`;
  return 'Walk';
}

export function rideStopsLabel(leg: TransitLeg): string {
  const stops = leg.stopCount ?? (leg.intermediateStopCount != null ? leg.intermediateStopCount + 1 : null);
  const time = leg.durationSeconds ? formatDurationSeconds(leg.durationSeconds) : null;
  if (stops != null && time) return `Ride ${stops} stop${stops === 1 ? '' : 's'} (${time})`;
  if (stops != null) return `Ride ${stops} stop${stops === 1 ? '' : 's'}`;
  if (time) return `Ride ${time}`;
  return 'Ride';
}
