import { formatBlaBlaCarFare, mapBlaBlaCarJourneys, parseIsoDurationLabel } from '../src/rideEstimate/blaBlaCarCatalog';
import { ALL_PLATFORM_CARDS } from '../src/rideEstimate/platformCatalog';
import {
  platformsForCategory,
  productMatchesCategory,
  RIDE_CATEGORY_TABS,
} from '../src/rideEstimate/rideCategories';
import { lineChips, scheduledFrom, tripMinutesLabel } from '../src/rideEstimate/transitUi';
import { mergeOlaProductFeeds } from '../src/rideEstimate/olaCatalog';
import { mergeUberProductFeeds } from '../src/rideEstimate/uberCatalog';
import { parseOverviewRoute, parseTransitRoutes as parseGoogleRoutesTransit } from '../src/rideEstimate/googleRoutesParse';
import { routesWaypoint } from '../src/rideEstimate/googleRoutesHttp';
import { decodePolyline } from '../src/rideEstimate/decodePolyline';
import { olaAppLaunchUrl } from '../src/rideEstimate/rideDeepLinks';
import { formatDurationSeconds, formatMeters, isValidRideCoord, simpleVehicleWord } from '../src/rideEstimate/formatJourney';
import {
  googleMapsFareLabel,
  mergeGoogleBusOptions,
  parseTransitRoutes,
  transitAvailabilityFromStatus,
} from '../src/rideEstimate/googleDirections';
import { buildProviderCards, headlineOfficialFare } from '../src/rideEstimate/providerCards';
import { sortModesLikeGoogleMaps } from '../src/rideEstimate/modeUi';
import {
  RAPIDO_ANDROID_APP_INTENT,
  RAPIDO_OFFICIAL_SITE,
  uberAndroidAppIntent,
  uberNativeSchemeUrl,
  uberPickupQuery,
  uberSetPickupUrl,
} from '../src/rideEstimate/rideDeepLinks';
import type { OverviewRoute } from '../src/rideEstimate/types';

describe('ride estimate helpers', () => {
  it('decodes a google polyline', () => {
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(points.length).toBeGreaterThan(1);
    expect(points[0].lat).toBeCloseTo(38.5, 1);
    expect(points[0].lng).toBeCloseTo(-120.2, 1);
  });

  it('formats duration and distance', () => {
    expect(formatDurationSeconds(45)).toBe('45s');
    expect(formatDurationSeconds(120)).toBe('2 min');
    expect(formatDurationSeconds(3600)).toBe('1 hr');
    expect(formatMeters(250)).toBe('250 m');
    expect(formatMeters(1500)).toBe('1.5 km');
    expect(simpleVehicleWord('SUBWAY')).toBe('Metro');
    expect(simpleVehicleWord('BUS')).toBe('Bus');
  });

  it('rejects invalid coordinates', () => {
    expect(isValidRideCoord(12.9, 77.6)).toBe(true);
    expect(isValidRideCoord(100, 0)).toBe(false);
  });

  it('sends plus-code and place names as Routes API address waypoints', () => {
    expect(
      routesWaypoint({ name: 'H8MW+WP Kolkata India', lat: 22.57, lng: 88.36 })
    ).toEqual({ address: 'H8MW+WP Kolkata India' });
    expect(routesWaypoint({ name: 'Current location', lat: 22.57, lng: 88.36 })).toEqual({
      location: { latLng: { latitude: 22.57, longitude: 88.36 } },
    });
  });

  it('parses Google Routes drive and transit details without inventing fares', () => {
    const car = parseOverviewRoute(
      {
        distanceMeters: 1200,
        duration: '300s',
        staticDuration: '240s',
        description: 'via Anna Salai',
        warnings: ['Check traffic'],
        localizedValues: { duration: { text: '5 min' }, distance: { text: '1.2 km' } },
        travelAdvisory: { tollInfo: { estimatedPrice: [{ currencyCode: 'INR', units: '40' }] } },
        legs: [
          {
            steps: [
              {
                travelMode: 'DRIVE',
                distanceMeters: 400,
                staticDuration: '60s',
                navigationInstruction: { instructions: 'Turn right', maneuver: 'TURN_RIGHT' },
              },
            ],
          },
        ],
      },
      'car',
      'Car',
      true,
      'note'
    );
    expect(car?.durationText).toBe('5 min');
    expect(car?.tollLabel).toBe('INR 40');
    expect(car?.steps?.[0].instruction).toBe('Turn right');
    const buses = parseGoogleRoutesTransit([
      {
        duration: '1800s',
        distanceMeters: 8000,
        travelAdvisory: { transitFare: { units: '25', currencyCode: 'INR' } },
        legs: [
          {
            steps: [
              {
                travelMode: 'TRANSIT',
                transitDetails: {
                  stopCount: 6,
                  headsign: 'Airport',
                  stopDetails: {
                    departureStop: { name: 'T Nagar', location: { latLng: { latitude: 13.04, longitude: 80.23 } } },
                    arrivalStop: { name: 'Airport' },
                  },
                  transitLine: { nameShort: 'MTC', agencies: [{ name: 'MTC Chennai' }] },
                },
              },
            ],
          },
        ],
      },
    ]);
    expect(buses[0].fareLabel).toBe('INR 25');
    expect(buses[0].legs[0].headsign).toBe('Airport');
    expect(buses[0].legs[0].boardingStop?.lat).toBeCloseTo(13.04);
  });

  it('parses Google Routes transitDetails even when travelMode is omitted', () => {
    const buses = parseGoogleRoutesTransit([
      {
        legs: [
          {
            steps: [
              {},
              {},
              {},
              {
                transitDetails: {
                  stopDetails: {
                    arrivalStop: {
                      name: 'Saldanha',
                      location: { latLng: { latitude: 38.73532, longitude: -9.14543 } },
                    },
                    arrivalTime: '2023-08-26T10:49:42Z',
                    departureStop: {
                      name: 'Aeroporto',
                      location: { latLng: { latitude: 38.769047799999996, longitude: -9.1284593 } },
                    },
                    departureTime: '2023-08-26T10:32:10Z',
                  },
                  localizedValues: {
                    arrivalTime: { time: { text: '11:49' }, timeZone: 'Europe/Lisbon' },
                    departureTime: { time: { text: '11:32' }, timeZone: 'Europe/Lisbon' },
                  },
                  headsign: 'São Sebastião',
                  transitLine: {
                    agencies: [{ name: 'Metropolitano de Lisboa, E.P.E.', phoneNumber: '+351 21 350 0115' }],
                    name: 'Vermelha',
                    color: '#f23061',
                    nameShort: 'Vm',
                    textColor: '#000000',
                    vehicle: { name: { text: 'Metrô' }, type: 'SUBWAY' },
                  },
                  stopCount: 11,
                },
              },
              {},
              {
                transitDetails: {
                  stopDetails: {
                    arrivalStop: { name: 'Rato' },
                    arrivalTime: '2023-08-26T11:01:37Z',
                    departureStop: { name: 'Saldanha' },
                    departureTime: '2023-08-26T10:57:57Z',
                  },
                  localizedValues: {
                    arrivalTime: { time: { text: '12:01' } },
                    departureTime: { time: { text: '11:57' } },
                  },
                  headsign: 'Rato',
                  transitLine: {
                    agencies: [{ name: 'Metropolitano de Lisboa, E.P.E.' }],
                    name: 'Amarela',
                    color: '#f2c200',
                    nameShort: 'Am',
                    vehicle: { name: { text: 'Metrô' }, type: 'SUBWAY' },
                  },
                  stopCount: 4,
                },
              },
            ],
          },
        ],
      },
    ]);
    expect(buses).toHaveLength(1);
    expect(buses[0].summary).toBe('Vm → Am');
    expect(buses[0].transferCount).toBe(1);
    expect(buses[0].departureTime).toBe('11:32');
    expect(buses[0].arrivalTime).toBe('12:01');
    const [red, yellow] = buses[0].legs.filter((leg) => leg.travelMode === 'TRANSIT');
    expect(red.lineName).toBe('Vermelha');
    expect(red.vehicleType).toBe('Metrô');
    expect(red.boardingStop?.name).toBe('Aeroporto');
    expect(red.alightingStop?.name).toBe('Saldanha');
    expect(red.stopCount).toBe(11);
    expect(red.headsign).toBe('São Sebastião');
    expect(red.agencyName).toBe('Metropolitano de Lisboa, E.P.E.');
    expect(yellow.lineName).toBe('Amarela');
    expect(yellow.boardingStop?.name).toBe('Saldanha');
    expect(yellow.alightingStop?.name).toBe('Rato');
    expect(lineChips(buses[0])).toEqual(['Vm', 'Am']);
    expect(scheduledFrom(buses[0])).toBe('Scheduled at 11:32 from Aeroporto');
    expect(tripMinutesLabel({ ...buses[0], durationSeconds: 1860 })).toBe('31');
  });

  it('parses google transit without inventing fare', () => {
    const routes = parseTransitRoutes({
      status: 'OK',
      routes: [
        {
          summary: '500D',
          overview_polyline: { points: '' },
          legs: [
            {
              distance: { value: 8000 },
              duration: { value: 1800 },
              departure_time: { text: '9:10 AM' },
              arrival_time: { text: '9:40 AM' },
              steps: [
                {
                  travel_mode: 'WALKING',
                  html_instructions: 'Walk to stop',
                  distance: { value: 240 },
                  duration: { value: 180 },
                },
                {
                  travel_mode: 'TRANSIT',
                  html_instructions: 'Bus 500D',
                  distance: { value: 7400 },
                  duration: { value: 1500 },
                  transit_details: {
                    departure_stop: { name: 'Silk Board' },
                    arrival_stop: { name: 'Kempegowda' },
                    departure_time: { text: '9:12 AM' },
                    arrival_time: { text: '9:37 AM' },
                    num_stops: 12,
                    line: { short_name: '500D', name: 'BMTC 500D', vehicle: { type: 'BUS', name: 'Bus' } },
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    expect(routes).toHaveLength(1);
    expect(routes[0].summary).toBe('500D');
    expect(routes[0].fareLabel).toBeNull();
    expect(googleMapsFareLabel({ text: '₹12.00' })).toBe('₹12.00');
    expect(googleMapsFareLabel({ value: 15, currency: 'INR' })).toBe('INR 15');
    expect(googleMapsFareLabel(undefined)).toBeNull();
    const priced = parseTransitRoutes({
      status: 'OK',
      routes: [
        {
          summary: '21G',
          fare: { text: '₹12.00', value: 12, currency: 'INR' },
          overview_polyline: { points: '' },
          legs: [
            {
              distance: { value: 4000 },
              duration: { value: 900 },
              steps: [
                {
                  travel_mode: 'TRANSIT',
                  transit_details: { line: { short_name: '21G', vehicle: { type: 'BUS' } } },
                },
              ],
            },
          ],
        },
      ],
    });
    expect(priced[0].fareLabel).toBe('₹12.00');
    expect(
      mergeGoogleBusOptions(
        [{ ...priced[0], id: 'a', fareLabel: null, legs: [], geometry: [], source: 'google_routes' }],
        priced
      )[0].fareLabel
    ).toBe('₹12.00');
    expect(routes[0].transferCount).toBe(0);
    expect(routes[0].walkToStopMeters).toBe(240);
    expect(routes[0].legs[1].boardingStop?.name).toBe('Silk Board');
    expect(routes[0].legs[1].intermediateStopCount).toBe(11);
  });

  it('marks missing transit clearly', () => {
    expect(transitAvailabilityFromStatus('ZERO_RESULTS', []).status).toBe('none');
    expect(transitAvailabilityFromStatus('REQUEST_DENIED', []).status).toBe('unavailable');
  });

  it('filters ride categories like the compare screen', () => {
    expect(RIDE_CATEGORY_TABS.map((tab) => tab.label)).toEqual([
      'All',
      'Bike',
      'Auto',
      'Cab',
      'Car',
      'Bus & train',
    ]);
    expect(productMatchesCategory('Ola Bike', 'bike')).toBe(true);
    expect(productMatchesCategory('Uber Auto', 'auto')).toBe(true);
    expect(productMatchesCategory('Uber Auto', 'cab')).toBe(false);
    expect(productMatchesCategory('Uber Go', 'cab')).toBe(true);
    expect(platformsForCategory('bike')).toEqual(['rapido', 'ola', 'namma_yatri']);
  });

  it('lists all ride and transit platform cards in order', () => {
    expect(ALL_PLATFORM_CARDS.map((card) => card.name)).toEqual([
      'Uber',
      'Rapido',
      'Ola',
      'Namma Yatri',
      'inDrive',
      'BlaBlaCar',
      'Google Maps',
      'Chalo',
      'redBus',
      'AbhiBus',
      'IRCTC Rail Connect',
      'Where is my Train',
    ]);
  });

  it('never fabricates uber or rapido fares', () => {
    const cards = buildProviderCards([
      {
        mode: 'car',
        label: 'Car',
        distanceMeters: 1000,
        durationSeconds: 300,
        durationIsTrafficAware: false,
        source: 'osrm',
        geometry: [],
      },
    ]);
    expect(cards.map((card) => card.fareLabel)).toEqual([
      'Check fare in app',
      'Check fare in app',
      'Check fare in app',
    ]);
    expect(headlineOfficialFare(['₹220–260', '₹180-220'])).toBe('₹180-220');
  });

  it('maps official Uber products and prices without inventing fares', () => {
    const offers = mergeUberProductFeeds(
      [{ product_id: 'go', display_name: 'Uber Go', description: 'Affordable', capacity: 4 }],
      [{ product_id: 'go', display_name: 'Uber Go', estimate: '₹180-220', duration: 720 }],
      [{ product_id: 'go', estimate: 180 }]
    );
    expect(offers[0].estimate).toBe('₹180-220');
    expect(mergeUberProductFeeds([{ product_id: 'xl', display_name: 'XL' }], [], [])[0].estimate).toBeNull();
    expect(
      mergeUberProductFeeds(
        [],
        [{ product_id: 'go', display_name: 'Uber Go', currency_code: 'INR', low_estimate: 180, high_estimate: 220 }],
        []
      )[0].estimate
    ).toBe('₹180–220');
  });

  it('maps official Ola estimates from amount_min/max only', () => {
    const offers = mergeOlaProductFeeds(
      [
        { id: 'auto', display_name: 'Auto', eta: 1 },
        { id: 'prime', display_name: 'Prime', eta: -1 },
      ],
      [{ category: 'auto', amount_min: 227, amount_max: 249, travel_time_in_minutes: 93 }]
    );
    expect(offers[0].estimate).toBe('₹227–249');
    expect(offers[0].available).toBe(true);
    expect(offers[1].available).toBe(false);
    expect(offers[1].estimate).toBeNull();
  });

  it('maps BlaBlaCar Pro search prices from ticket_pricing only', () => {
    expect(parseIsoDurationLabel('PT7H30M')).toBe('7h 30m');
    expect(
      formatBlaBlaCarFare({
        currency_code: 'UAH',
        currency_symbol: '₴',
        base_ticket_price: 42.5,
        ticket_price_with_automatic_discount: 39.1,
      })
    ).toBe('₴39.1');
    const rides = mapBlaBlaCarJourneys([
      {
        id: 'j1',
        rides: [
          {
            duration: 'PT7H30M',
            departure: { date_time: '2022-07-20T10:00:00', point: { name: 'Kyiv' } },
            arrival: { date_time: '2022-07-20T17:30:00', point: { name: 'Lviv' } },
            bus_line: { name: 'Kyiv - Lviv' },
            ticket_pricing: { currency_symbol: '₴', base_ticket_price: 42.5 },
          },
        ],
      },
    ]);
    expect(rides[0].fareLabel).toBe('₴42.5');
    expect(rides[0].summary).toBe('Kyiv - Lviv');
  });

  it('builds an Ola app launch url with pickup and drop', () => {
    const url = olaAppLaunchUrl(
      { name: 'T Nagar', lat: 13.04, lng: 80.23 },
      { name: 'Marina', lat: 13.05, lng: 80.28 },
      'auto'
    );
    expect(url.startsWith('olacabs://app/launch?')).toBe(true);
    expect(url).toContain('lat=13.04');
    expect(url).toContain('drop_lat=13.05');
    expect(url).toContain('category=auto');
  });

  it('orders travel modes like Google Maps', () => {
    const stub = (mode: OverviewRoute['mode']): OverviewRoute => ({
      mode,
      label: mode,
      distanceMeters: 1,
      durationSeconds: 1,
      durationIsTrafficAware: false,
      source: 'osrm',
      geometry: [],
    });
    const ordered = sortModesLikeGoogleMaps([
      stub('walking'),
      stub('car'),
      stub('transit'),
    ]);
    expect(ordered.map((item) => item.mode)).toEqual(['car', 'transit', 'walking']);
  });

  it('builds an official uber pickup url with entered addresses', () => {
    const url = uberSetPickupUrl(
      { name: 'T Nagar, Chennai', lat: 13.04, lng: 80.23 },
      { name: 'Marina Beach, Chennai', lat: 13.05, lng: 80.28 }
    );
    expect(url.startsWith('https://m.uber.com/ul/?')).toBe(true);
    expect(url).toContain('action=setPickup');
    const decoded = decodeURIComponent(url.replace(/\+/g, ' '));
    expect(decoded).toContain('T Nagar, Chennai');
    expect(decoded).toContain('Marina Beach, Chennai');
    const native = uberNativeSchemeUrl(
      { name: 'T Nagar, Chennai', lat: 13.04, lng: 80.23 },
      { name: 'Marina Beach, Chennai', lat: 13.05, lng: 80.28 }
    );
    expect(native.startsWith('uber://?')).toBe(true);
    expect(native).toContain('pickup[latitude]=13.04');
    expect(uberPickupQuery(
      { name: 'A', lat: 13, lng: 80 },
      { name: 'B', lat: 13.1, lng: 80.1 }
    )).not.toContain('%5B');
    expect(uberAndroidAppIntent(
      { name: 'A', lat: 13, lng: 80 },
      { name: 'B', lat: 13.1, lng: 80.1 }
    )).toContain('package=com.ubercab');
  });

  it('targets the Rapido mobile app package, not the website', () => {
    expect(RAPIDO_ANDROID_APP_INTENT).toContain('package=com.rapido.passenger');
    expect(RAPIDO_ANDROID_APP_INTENT).toContain('LAUNCHER');
    expect(RAPIDO_ANDROID_APP_INTENT).not.toContain('http');
    expect(RAPIDO_OFFICIAL_SITE).toContain('rapido.bike');
  });
});
