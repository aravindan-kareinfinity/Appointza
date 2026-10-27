import { decodePolyline } from './decodePolyline';
import type {
  BusRouteOption,
  OverviewRoute,
  RouteNavStep,
  TransitLeg,
  TransitStop,
} from './types';

export type RoutesLatLng = { latitude?: number; longitude?: number };

export type RoutesAgency = {
  name?: string;
  phoneNumber?: string;
  uri?: string;
};

export type RoutesTransitDetails = {
  stopCount?: number;
  headway?: string;
  localizedValues?: {
    arrivalTime?: { time?: { text?: string }; timeZone?: string };
    departureTime?: { time?: { text?: string }; timeZone?: string };
  };
  stopDetails?: {
    arrivalStop?: { name?: string; location?: { latLng?: RoutesLatLng } };
    arrivalTime?: string;
    departureStop?: { name?: string; location?: { latLng?: RoutesLatLng } };
    departureTime?: string;
  };
  headsign?: string;
  tripDetail?: { nameShort?: string; name?: string };
  transitLine?: {
    name?: string;
    nameShort?: string;
    color?: string;
    textColor?: string;
    agencies?: RoutesAgency[];
    vehicle?: {
      name?: { text?: string };
      type?: string;
      iconUri?: string;
    };
  };
};

export type RoutesStep = {
  travelMode?: string;
  distanceMeters?: number;
  staticDuration?: string;
  polyline?: { encodedPolyline?: string };
  startLocation?: { latLng?: RoutesLatLng };
  endLocation?: { latLng?: RoutesLatLng };
  navigationInstruction?: { instructions?: string; maneuver?: string };
  transitDetails?: RoutesTransitDetails;
};

export type RoutesRoute = {
  distanceMeters?: number;
  duration?: string;
  staticDuration?: string;
  description?: string;
  warnings?: string[];
  routeLabels?: string[];
  polyline?: { encodedPolyline?: string };
  localizedValues?: {
    duration?: { text?: string };
    staticDuration?: { text?: string };
    distance?: { text?: string };
  };
  travelAdvisory?: {
    transitFare?: { units?: string; currencyCode?: string };
    tollInfo?: { estimatedPrice?: { currencyCode?: string; units?: string; nanos?: number }[] };
  };
  legs?: {
    distanceMeters?: number;
    duration?: string;
    staticDuration?: string;
    localizedValues?: { duration?: { text?: string }; distance?: { text?: string } };
    steps?: RoutesStep[];
  }[];
};

export function durationSeconds(value: string | undefined): number {
  if (!value) return 0;
  const match = /^(\d+)s$/.exec(value);
  return match ? Number(match[1]) : 0;
}

function asStop(
  stop?: { name?: string; location?: { latLng?: RoutesLatLng } }
): TransitStop | undefined {
  if (!stop?.name) return undefined;
  const lat = Number(stop.location?.latLng?.latitude);
  const lng = Number(stop.location?.latLng?.longitude);
  return {
    name: stop.name,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  };
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function formatTollLabel(
  prices: { currencyCode?: string; units?: string }[] | undefined
): string | null {
  if (!prices?.length) return null;
  const first = prices[0];
  if (!first.units) return null;
  return first.currencyCode ? `${first.currencyCode} ${first.units}` : first.units;
}

export function parseNavSteps(route: RoutesRoute | undefined): RouteNavStep[] {
  const steps = route?.legs?.flatMap((leg) => leg.steps ?? []) ?? [];
  return steps
    .map((step) => ({
      instruction: stripHtml(step.navigationInstruction?.instructions ?? ''),
      maneuver: step.navigationInstruction?.maneuver,
      travelMode: step.travelMode,
      distanceMeters: step.distanceMeters,
      durationSeconds: durationSeconds(step.staticDuration) || undefined,
    }))
    .filter((step) => step.instruction.length > 0 || (step.distanceMeters ?? 0) > 0);
}

export function hasTransitDetails(step: RoutesStep | undefined): boolean {
  const details = step?.transitDetails;
  return Boolean(
    details?.transitLine?.name ||
      details?.transitLine?.nameShort ||
      details?.stopDetails?.departureStop?.name ||
      details?.stopDetails?.arrivalStop?.name
  );
}

function clockFromIso(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = /T(\d{2}:\d{2})/.exec(value);
  return match?.[1];
}

function transitClock(details: RoutesTransitDetails | undefined, kind: 'departure' | 'arrival'): string | undefined {
  const localized =
    kind === 'departure'
      ? details?.localizedValues?.departureTime?.time?.text
      : details?.localizedValues?.arrivalTime?.time?.text;
  if (localized) return localized;
  return clockFromIso(
    kind === 'departure' ? details?.stopDetails?.departureTime : details?.stopDetails?.arrivalTime
  );
}

function stepTravelMode(step: RoutesStep): TransitLeg['travelMode'] {
  if (hasTransitDetails(step) || step.travelMode === 'TRANSIT') return 'TRANSIT';
  if (step.travelMode === 'WALK') return 'WALK';
  return 'OTHER';
}

export function parseTransitRoutes(routes: RoutesRoute[] | undefined): BusRouteOption[] {
  if (!routes?.length) return [];
  return routes.flatMap((route, index) => {
    const steps = route.legs?.flatMap((leg) => leg.steps ?? []) ?? [];
    const transitSteps = steps.filter((step) => hasTransitDetails(step) || step.travelMode === 'TRANSIT');
    if (!transitSteps.length) return [];
    const legs: TransitLeg[] = steps
      .map((step) => {
        const details = step.transitDetails;
        const mode = stepTravelMode(step);
        if (mode === 'OTHER' && !step.navigationInstruction?.instructions && !step.distanceMeters) {
          return null;
        }
        const agency = details?.transitLine?.agencies?.[0];
        const stopCount = typeof details?.stopCount === 'number' ? details.stopCount : undefined;
        return {
          instruction: stripHtml(step.navigationInstruction?.instructions ?? ''),
          travelMode: mode,
          distanceMeters: step.distanceMeters,
          durationSeconds: durationSeconds(step.staticDuration),
          lineName: details?.transitLine?.name,
          lineShortName: details?.transitLine?.nameShort,
          lineColor: details?.transitLine?.color,
          lineTextColor: details?.transitLine?.textColor,
          vehicleType: details?.transitLine?.vehicle?.name?.text || details?.transitLine?.vehicle?.type,
          vehicleIconUri: details?.transitLine?.vehicle?.iconUri,
          boardingStop: asStop(details?.stopDetails?.departureStop),
          alightingStop: asStop(details?.stopDetails?.arrivalStop),
          stopCount,
          intermediateStopCount: typeof stopCount === 'number' ? Math.max(0, stopCount - 1) : undefined,
          departureTime: transitClock(details, 'departure'),
          arrivalTime: transitClock(details, 'arrival'),
          headsign: details?.headsign,
          agencyName: agency?.name,
          agencyPhone: agency?.phoneNumber,
          agencyUri: agency?.uri,
          tripName: details?.tripDetail?.nameShort || details?.tripDetail?.name,
        } satisfies TransitLeg;
      })
      .filter((leg): leg is TransitLeg => Boolean(leg));
    const firstTransit = transitSteps[0]?.transitDetails;
    const lastTransit = transitSteps.at(-1)?.transitDetails;
    const fare = route.travelAdvisory?.transitFare;
    return [
      {
        id: `google-routes-${index}`,
        summary: transitSteps
          .map(
            (step) =>
              step.transitDetails?.transitLine?.nameShort || step.transitDetails?.transitLine?.name
          )
          .filter(Boolean)
          .join(' → ') ||
          route.description ||
          `Transit option ${index + 1}`,
        durationSeconds: durationSeconds(route.duration),
        distanceMeters: route.distanceMeters ?? 0,
        transferCount: Math.max(0, transitSteps.length - 1),
        departureTime: transitClock(firstTransit, 'departure'),
        arrivalTime: transitClock(lastTransit, 'arrival'),
        fareLabel: fare?.units && fare.currencyCode ? `${fare.currencyCode} ${fare.units}` : null,
        durationText: route.localizedValues?.duration?.text,
        distanceText: route.localizedValues?.distance?.text,
        warnings: route.warnings,
        walkToStopMeters: steps.find((step) => step.travelMode === 'WALK')?.distanceMeters,
        walkFromStopMeters: [...steps].reverse().find((step) => step.travelMode === 'WALK')?.distanceMeters,
        legs,
        geometry: decodePolyline(route.polyline?.encodedPolyline ?? ''),
        source: 'google_routes',
      } satisfies BusRouteOption,
    ];
  });
}

export function parseOverviewRoute(
  route: RoutesRoute | undefined,
  mode: OverviewRoute['mode'],
  label: string,
  trafficAware: boolean,
  note: string
): OverviewRoute | null {
  if (!route) return null;
  const seconds = durationSeconds(route.duration) || durationSeconds(route.staticDuration);
  const meters = Number.isFinite(route.distanceMeters) ? (route.distanceMeters ?? 0) : 0;
  if (!seconds && !meters) return null;
  return {
    mode,
    label,
    distanceMeters: meters,
    durationSeconds: seconds,
    durationIsTrafficAware: trafficAware,
    source: 'google_routes',
    geometry: decodePolyline(route.polyline?.encodedPolyline ?? ''),
    note,
    description: route.description,
    warnings: route.warnings,
    staticDurationSeconds: durationSeconds(route.staticDuration) || undefined,
    durationText: route.localizedValues?.duration?.text,
    distanceText: route.localizedValues?.distance?.text,
    tollLabel: formatTollLabel(route.travelAdvisory?.tollInfo?.estimatedPrice),
    steps: parseNavSteps(route),
  };
}
