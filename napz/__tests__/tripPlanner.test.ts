import { ghatSpansFromElevation } from '../src/trip/geo';
import { deleteStop, moveStop, setStopClock } from '../src/trip/editTrip';
import { buildTripPlan, flattenPlan, packingFor } from '../src/trip/planTrip';
import { isNight, getSunTimes } from '../src/trip/sun';
import { DRIVE_BUFFER } from '../src/trip/time';
import { adjustMinutesForMode, parseWeather } from '../src/trip/forecast';
import { pickTeaShop } from '../src/trip/teaShops';
import { breakTitle, mealSlot, pickListedPlace, townFromGeocode } from '../src/trip/breakLabels';
import type { TripRequest } from '../src/trip/types';

const route = [
  { lat: 13.08, lng: 80.27 },
  { lat: 12.2, lng: 78.1 },
  { lat: 11.41, lng: 76.69 },
];

function request(partial: Partial<TripRequest> = {}): TripRequest {
  return {
    origin: { name: 'Chennai', lat: 13.08, lng: 80.27 },
    destination: { name: 'Ooty', lat: 11.41, lng: 76.69 },
    departAt: '2026-10-23T02:30:00.000Z',
    backBy: '2026-10-23T16:30:00.000Z',
    mode: 'car',
    travellers: 2,
    drivers: 1,
    interests: [],
    budget: 'medium',
    lang: 'en',
    instruction: '',
    ...partial,
  };
}

function plan(partial: Partial<TripRequest> = {}, extra: { minutes?: number; km?: number; ghat?: { start: number; end: number }[] } = {}) {
  return buildTripPlan({
    request: request(partial),
    oneWayKm: extra.km ?? 100,
    oneWayMinutes: extra.minutes ?? 60,
    route,
    ghatSpans: extra.ghat ?? [],
    utcOffsetMinutes: 330,
    id: 'test-trip',
    now: '2026-10-22T00:00:00.000Z',
  });
}

describe('trip planner', () => {
  it('adds a 20% buffer to drive time', () => {
    const built = plan({}, { minutes: 100 });
    const outbound = flattenPlan(built).filter((stop) => stop.kind === 'drive' && stop.leg === 'out');
    const minutes = outbound.reduce((sum, stop) => sum + stop.durationMin, 0);
    expect(minutes).toBe(Math.round(100 * DRIVE_BUFFER));
  });

  it('gets home at the back-by time when the window is wide enough', () => {
    const built = plan();
    const home = new Date(built.homeAt).getTime();
    const back = new Date(built.request.backBy).getTime();
    expect(built.fits).toBe(true);
    expect(home).toBeLessThanOrEqual(back + 60 * 1000);
    expect(back - home).toBeLessThanOrEqual(15 * 60 * 1000);
    expect(new Date(built.latestLeaveAt).getTime()).toBeLessThan(back);
  });

  it('inserts a rest before a ghat that would be driven at night', () => {
    const built = plan(
      { departAt: '2026-10-23T16:30:00.000Z', backBy: '2026-10-24T16:30:00.000Z' },
      { minutes: 180, ghat: [{ start: 0.12, end: 0.4 }] }
    );
    expect(flattenPlan(built).some((stop) => stop.kind === 'ghat_hold' && stop.leg === 'out')).toBe(true);
  });

  it('keeps ghat driving in daylight on a morning start', () => {
    const spans = [{ start: 0.3, end: 0.55 }];
    const built = plan({}, { minutes: 150, ghat: spans });
    const drives = flattenPlan(built).filter((stop) => stop.kind === 'drive');
    let checked = 0;
    for (const stop of drives) {
      const lo = Math.min(stop.outStart, stop.outEnd);
      const hi = Math.max(stop.outStart, stop.outEnd);
      const width = Math.abs(stop.outEnd - stop.outStart) || 1;
      for (const span of spans) {
        const enter = Math.max(lo, span.start + 0.01);
        const exit = Math.min(hi, span.end - 0.01);
        if (exit <= enter) continue;
        const at = (fraction: number) => {
          const along = Math.abs(fraction - stop.outStart) / width;
          return new Date(new Date(stop.at).getTime() + along * stop.durationMin * 60000);
        };
        expect(isNight(at(enter), stop.lat, stop.lng)).toBe(false);
        expect(isNight(at(exit), stop.lat, stop.lng)).toBe(false);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('breaks a long drive at least every 3 hours and swaps drivers', () => {
    const built = plan(
      { drivers: 2, backBy: '2026-10-25T16:30:00.000Z' },
      { minutes: 400 }
    );
    const drives = flattenPlan(built).filter((stop) => stop.kind === 'drive');
    expect(drives.every((stop) => stop.durationMin <= 180)).toBe(true);
    expect(flattenPlan(built).some((stop) => /swap|மாற்றம்/i.test(`${stop.name} ${stop.tip}`))).toBe(true);
  });

  it('puts an on-route stop before a detour and prices the detour', () => {
    const built = plan(
      {
        interests: ['sightseeing', 'trekking'],
        departAt: '2026-10-23T00:30:00.000Z',
        backBy: '2026-10-24T15:30:00.000Z',
      },
      { minutes: 90 }
    );
    const names = flattenPlan(built).map((stop) => stop.name);
    const view = names.indexOf('Viewpoint stop');
    const trek = names.indexOf('Short trek');
    expect(view).toBeGreaterThanOrEqual(0);
    expect(trek).toBeGreaterThan(view);
    const trekStop = flattenPlan(built).find((stop) => stop.name === 'Short trek');
    expect(trekStop?.confirmBeforeGoing).toBe(true);
    expect(trekStop?.costPerPerson).toBeGreaterThan(0);
    expect(built.backupPlan.length).toBeGreaterThan(10);
  });

  it('skips detours when asked for less driving', () => {
    const built = plan(
      {
        interests: ['sightseeing', 'trekking'],
        instruction: 'less driving',
        departAt: '2026-10-23T00:30:00.000Z',
        backBy: '2026-10-24T15:30:00.000Z',
      },
      { minutes: 90 }
    );
    expect(flattenPlan(built).some((stop) => stop.name === 'Short trek')).toBe(false);
  });

  it('shifts later stops when a time changes or a stop is removed', () => {
    const built = plan(
      {
        interests: ['sightseeing', 'food'],
        departAt: '2026-10-23T00:30:00.000Z',
        backBy: '2026-10-24T15:30:00.000Z',
      },
      { minutes: 90 }
    );
    const before = flattenPlan(built);
    const activity = before.find((stop) => stop.kind === 'activity');
    expect(activity).toBeTruthy();
    const index = before.findIndex((stop) => stop.id === activity!.id);
    const changed = setStopClock(built, activity!.id, '15:00');
    const after = flattenPlan(changed);
    const delta = new Date(after[index].at).getTime() - new Date(before[index].at).getTime();
    expect(new Date(after[index + 1].at).getTime() - new Date(before[index + 1].at).getTime()).toBe(delta);

    const meal = before.find((stop) => stop.kind === 'break');
    if (meal) {
      const mealIndex = before.findIndex((stop) => stop.id === meal.id);
      const removed = deleteStop(built, meal.id);
      const flat = flattenPlan(removed);
      expect(flat.some((stop) => stop.id === meal.id)).toBe(false);
      expect(new Date(flat[mealIndex].at).getTime()).toBeLessThan(new Date(before[mealIndex].at).getTime());
    }
  });

  it('reorders a stop and rechains the following time', () => {
    const built = plan(
      {
        interests: ['sightseeing', 'food'],
        departAt: '2026-10-23T00:30:00.000Z',
        backBy: '2026-10-24T15:30:00.000Z',
      },
      { minutes: 90 }
    );
    const activities = flattenPlan(built).filter((stop) => stop.kind === 'activity');
    expect(activities.length).toBeGreaterThan(1);
    const moved = moveStop(built, activities[1].id, -1);
    const next = flattenPlan(moved).filter((stop) => stop.kind === 'activity');
    expect(next[0].name).toBe(activities[1].name);
    expect(new Date(next[1].at).getTime()).toBe(new Date(next[0].at).getTime() + next[0].durationMin * 60000);
  });

  it('splits fuel and tolls across travellers', () => {
    const built = plan({}, { km: 100, minutes: 60 });
    expect(built.budget.stay).toBe(0);
    expect(built.budget.perPerson * built.request.travellers).toBe(built.budget.total);
    expect(built.budget.fuel).toBe(1500);
    expect(built.budget.tolls).toBe(230);
  });

  it('writes the plan in Tamil and packs for rain', () => {
    const built = plan({ lang: 'ta' });
    expect(flattenPlan(built)[0].name).toContain('புறப்படுதல்');
    const packing = packingFor('en', ['trekking'], [{
      date: '2026-10-23', tempMax: 24, tempMin: 16, precipProb: 80, code: 61, rainWarning: true, label: 'Rain',
    }], [], 330);
    expect(packing.some((item) => item.id === 'rain')).toBe(true);
    expect(packing.some((item) => item.id === 'shoes')).toBe(true);
  });

  it('flags a window that cannot hold the round trip', () => {
    const built = plan({ backBy: '2026-10-23T04:00:00.000Z' }, { minutes: 180 });
    expect(built.fits).toBe(false);
    expect(built.shortfallMin).toBeGreaterThan(0);
  });
});

describe('trip helpers', () => {
  it('knows a June morning in Delhi is after sunrise', () => {
    const { sunrise, sunset } = getSunTimes(new Date('2024-06-21T06:00:00.000Z'), 28.61, 77.21);
    const hour = new Date(sunrise.getTime() + 330 * 60000).getUTCHours();
    const setHour = new Date(sunset.getTime() + 330 * 60000).getUTCHours();
    expect(hour).toBeGreaterThanOrEqual(5);
    expect(hour).toBeLessThanOrEqual(6);
    expect(setHour).toBeGreaterThanOrEqual(18);
    expect(setHour).toBeLessThanOrEqual(20);
    expect(isNight(new Date('2026-10-23T16:30:00.000Z'), 13.08, 80.27)).toBe(true);
  });

  it('marks a steep climb as a ghat', () => {
    const spans = ghatSpansFromElevation([
      { fraction: 0, elevation: 100 },
      { fraction: 0.25, elevation: 110 },
      { fraction: 0.5, elevation: 400 },
      { fraction: 0.75, elevation: 420 },
      { fraction: 1, elevation: 430 },
    ]);
    expect(spans).toEqual([{ start: 0.25, end: 0.5 }]);
  });

  it('names dinner by the town reached at that clock time', () => {
    expect(mealSlot(21 * 60 + 30)).toBe('dinner');
    expect(mealSlot(30)).toBe('tea');
    expect(mealSlot(8 * 60)).toBe('breakfast');
    expect(breakTitle('en', 'dinner', 'Ulundurpet', 'Hotel Sangam')).toBe('Dinner near Ulundurpet – Hotel Sangam');
    expect(breakTitle('en', 'tea', 'Trichy')).toBe('Tea near Trichy');
    expect(townFromGeocode([
      { address_components: [{ long_name: 'Ulundurpet', types: ['locality', 'political'] }] },
    ])).toBe('Ulundurpet');
    expect(pickListedPlace([
      { name: 'Low Rated', rating: 3.2, lat: 1, lng: 1 },
      { name: 'Hotel Sangam', rating: 4.4, lat: 2, lng: 2 },
    ])?.name).toBe('Hotel Sangam');
    expect(pickListedPlace([
      { name: 'No Photo', rating: 4.8, lat: 1, lng: 1 },
      { name: 'With Photo', rating: 4.2, lat: 2, lng: 2, photoRef: 'abc' },
    ])?.name).toBe('With Photo');
  });

  it('picks a named tea shop close to the break', () => {
    const shop = pickTeaShop(
      [
        { lat: 12.5, lng: 78.2, name: 'Highway Dhaba', amenity: 'fast_food' },
        { lat: 12.52, lng: 78.18, name: 'Annapoorna Tea Stall', shop: 'tea' },
        { lat: 13.9, lng: 80.2, name: 'Far Cafe', amenity: 'cafe' },
      ],
      { lat: 12.51, lng: 78.19 }
    );
    expect(shop?.name).toBe('Annapoorna Tea Stall');
    expect(pickTeaShop([{ lat: 12.5, lng: 78.2, amenity: 'cafe' }], { lat: 12.51, lng: 78.19 })).toBeNull();
  });

  it('scales mode time and reads a weather day', () => {
    expect(adjustMinutesForMode(100, 'car')).toBe(100);
    expect(adjustMinutesForMode(100, 'bike')).toBe(125);
    expect(adjustMinutesForMode(100, 'bus')).toBe(135);
    expect(adjustMinutesForMode(100, 'train')).toBe(80);
    const days = parseWeather({
      daily: {
        time: ['2026-10-23'],
        weather_code: [61],
        temperature_2m_max: [29.2],
        temperature_2m_min: [22.4],
        precipitation_probability_max: [70],
      },
    }, 'en');
    expect(days[0].rainWarning).toBe(true);
    expect(days[0].label).toBe('Rain');
  });
});
