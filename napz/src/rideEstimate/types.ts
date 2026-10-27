export type RideLatLng = {
  lat: number;
  lng: number;
};

export type RidePlace = RideLatLng & {
  name: string;
};

export type RouteSource = 'osrm' | 'google_directions' | 'google_routes';

export type OverviewModeId = 'walking' | 'cycling' | 'two_wheeler' | 'car' | 'transit';

export type RouteNavStep = {
  instruction: string;
  maneuver?: string;
  travelMode?: string;
  distanceMeters?: number;
  durationSeconds?: number;
};

export type OverviewRoute = {
  mode: OverviewModeId;
  label: string;
  distanceMeters: number;
  durationSeconds: number;
  durationIsTrafficAware: boolean;
  source: RouteSource;
  geometry: RideLatLng[];
  note?: string;
  description?: string;
  warnings?: string[];
  staticDurationSeconds?: number;
  durationText?: string;
  distanceText?: string;
  tollLabel?: string | null;
  steps?: RouteNavStep[];
};

export type RideProviderId =
  | 'uber'
  | 'rapido'
  | 'ola'
  | 'namma_yatri'
  | 'indrive'
  | 'blablacar'
  | 'google_maps'
  | 'chalo'
  | 'redbus'
  | 'abhibus'
  | 'irctc'
  | 'where_is_my_train';

export type RideProviderCard = {
  id: RideProviderId;
  name: string;
  vehicleTypes: string[];
  fareLabel: string;
  fareIsEstimate: boolean;
  durationSeconds: number | null;
  durationLabel: string;
  durationNote: string;
  actionLabel: string;
};

export type TransitStop = {
  name: string;
  lat?: number;
  lng?: number;
};

export type TransitLeg = {
  instruction: string;
  travelMode: 'WALK' | 'TRANSIT' | 'OTHER';
  distanceMeters?: number;
  durationSeconds?: number;
  lineName?: string;
  lineShortName?: string;
  lineColor?: string;
  lineTextColor?: string;
  vehicleType?: string;
  vehicleIconUri?: string;
  boardingStop?: TransitStop;
  alightingStop?: TransitStop;
  /** Google Routes stopCount: includes arrival stop, excludes departure. */
  stopCount?: number;
  intermediateStopCount?: number;
  departureTime?: string;
  arrivalTime?: string;
  headsign?: string;
  agencyName?: string;
  agencyPhone?: string;
  agencyUri?: string;
  tripName?: string;
};

export type BusRouteOption = {
  id: string;
  summary: string;
  durationSeconds: number;
  distanceMeters: number;
  transferCount: number;
  departureTime?: string;
  arrivalTime?: string;
  fareLabel: string | null;
  durationText?: string;
  distanceText?: string;
  warnings?: string[];
  walkToStopMeters?: number;
  walkFromStopMeters?: number;
  legs: TransitLeg[];
  geometry: RideLatLng[];
  source: RouteSource;
};

export type TransitAvailability = {
  status: 'ok' | 'none' | 'unavailable';
  message: string;
};

export type JourneyEstimate = {
  overview: OverviewRoute[];
  providers: RideProviderCard[];
  busRoutes: BusRouteOption[];
  transit: TransitAvailability;
  previewGeometry: RideLatLng[];
  /** Smallest routed distance among available modes. */
  shortest: OverviewRoute | null;
  /** Lowest duration among available modes. */
  fastest: OverviewRoute | null;
};
