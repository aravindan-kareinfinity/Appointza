export type PlatformGroupId = 'ride_booking' | 'bus_transit';
export type PlatformStatus = 'live' | 'next';

export type PlatformId =
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

export type PlatformCard = {
  id: PlatformId;
  name: string;
  group: PlatformGroupId;
  hint: string;
  status: PlatformStatus;
  androidPackage: string;
};

export const RIDE_BOOKING_PLATFORMS: PlatformCard[] = [
  {
    id: 'uber',
    name: 'Uber',
    group: 'ride_booking',
    hint: 'Car rides',
    status: 'live',
    androidPackage: 'com.ubercab',
  },
  {
    id: 'rapido',
    name: 'Rapido',
    group: 'ride_booking',
    hint: 'Bike, auto, cab',
    status: 'live',
    androidPackage: 'com.rapido.passenger',
  },
  {
    id: 'ola',
    name: 'Ola',
    group: 'ride_booking',
    hint: 'Auto, cab, bike',
    status: 'live',
    androidPackage: 'com.olacabs.customer',
  },
  {
    id: 'namma_yatri',
    name: 'Namma Yatri',
    group: 'ride_booking',
    hint: 'Open mobility',
    status: 'next',
    androidPackage: 'in.juspay.nammayatri',
  },
  {
    id: 'indrive',
    name: 'inDrive',
    group: 'ride_booking',
    hint: 'Bid for a ride',
    status: 'next',
    androidPackage: 'sinet.startup.inDriver',
  },
  {
    id: 'blablacar',
    name: 'BlaBlaCar',
    group: 'ride_booking',
    hint: 'Bus and carpool',
    status: 'live',
    androidPackage: 'com.comuto',
  },
];

export const BUS_TRANSIT_PLATFORMS: PlatformCard[] = [
  {
    id: 'google_maps',
    name: 'Google Maps',
    group: 'bus_transit',
    hint: 'Public transport',
    status: 'live',
    androidPackage: 'com.google.android.apps.maps',
  },
  {
    id: 'chalo',
    name: 'Chalo',
    group: 'bus_transit',
    hint: 'City buses',
    status: 'next',
    androidPackage: 'app.chalo',
  },
  {
    id: 'redbus',
    name: 'redBus',
    group: 'bus_transit',
    hint: 'Intercity buses',
    status: 'next',
    androidPackage: 'in.redbus.android',
  },
  {
    id: 'abhibus',
    name: 'AbhiBus',
    group: 'bus_transit',
    hint: 'Intercity buses',
    status: 'next',
    androidPackage: 'com.abhibus',
  },
  {
    id: 'irctc',
    name: 'IRCTC Rail Connect',
    group: 'bus_transit',
    hint: 'Train tickets',
    status: 'next',
    androidPackage: 'cris.org.in.prs.ima',
  },
  {
    id: 'where_is_my_train',
    name: 'Where is my Train',
    group: 'bus_transit',
    hint: 'Live train status',
    status: 'next',
    androidPackage: 'com.whereismytrain.android',
  },
];

export const ALL_PLATFORM_CARDS: PlatformCard[] = [
  ...RIDE_BOOKING_PLATFORMS,
  ...BUS_TRANSIT_PLATFORMS,
];
