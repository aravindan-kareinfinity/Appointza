export type Lang = 'en' | 'ta';
export type TravelMode = 'car' | 'bike' | 'bus' | 'train';
export type BudgetLevel = 'low' | 'medium' | 'premium';
export type Interest =
  | 'sightseeing'
  | 'trekking'
  | 'wildlife'
  | 'jeep_safari'
  | 'elephant_camp'
  | 'boating'
  | 'food'
  | 'photography'
  | 'temples';

export type TripPlace = { name: string; lat: number; lng: number };
export type LatLng = { lat: number; lng: number };
export type GhatSpan = { start: number; end: number };

export type StopKind = 'depart' | 'drive' | 'break' | 'ghat_hold' | 'activity' | 'free' | 'arrive';

export type TripStop = {
  id: string;
  kind: StopKind;
  at: string;
  durationMin: number;
  name: string;
  tip: string;
  description: string;
  costPerPerson: number;
  confirmBeforeGoing: boolean;
  lat: number;
  lng: number;
  leg: 'out' | 'dest' | 'back';
  outStart: number;
  outEnd: number;
  bucket: 'food' | 'activity' | 'none';
  photoUrl?: string;
};

export type TripRequest = {
  origin: TripPlace;
  destination: TripPlace;
  departAt: string;
  backBy: string;
  mode: TravelMode;
  travellers: number;
  drivers: number;
  interests: Interest[];
  budget: BudgetLevel;
  lang: Lang;
  instruction: string;
};

export type TripDay = {
  index: number;
  date: string;
  label: string;
  stops: TripStop[];
};

export type DayWeather = {
  date: string;
  tempMax: number;
  tempMin: number;
  precipProb: number;
  code: number;
  rainWarning: boolean;
  label: string;
};

export type BudgetBreakdown = {
  fuel: number;
  tolls: number;
  stay: number;
  activities: number;
  food: number;
  total: number;
  perPerson: number;
};

export type PackingItem = { id: string; label: string; checked: boolean };

export type RouteMeta = {
  oneWayKm: number;
  oneWayMinutes: number;
  route: LatLng[];
  ghatSpans: GhatSpan[];
};

export type TripPlan = {
  id: string;
  createdAt: string;
  request: TripRequest;
  routeMeta: RouteMeta;
  utcOffsetMinutes: number;
  distanceKm: number;
  driveMinutes: number;
  latestLeaveAt: string;
  homeAt: string;
  fits: boolean;
  shortfallMin: number;
  days: TripDay[];
  weather: DayWeather[];
  packing: PackingItem[];
  budget: BudgetBreakdown;
  backupPlan: string;
  shareCode?: string;
};
