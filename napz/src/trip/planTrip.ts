import { pointAlong } from './geo';
import {
  ACTIVITIES,
  fill,
  fuelPerKm,
  mealCost,
  stayRate,
  t,
  ticketPerKm,
  tollPerKm,
} from './i18n';
import { isNight, nextDaylight, getSunTimes } from './sun';
import { addMinutes, DRIVE_BUFFER, DRIVE_CHUNK_MIN, localParts } from './time';
import type {
  BudgetBreakdown,
  BudgetLevel,
  DayWeather,
  GhatSpan,
  Interest,
  Lang,
  LatLng,
  PackingItem,
  RouteMeta,
  TravelMode,
  TripDay,
  TripPlace,
  TripPlan,
  TripRequest,
  TripStop,
} from './types';

export type BuildInput = {
  request: TripRequest;
  oneWayKm: number;
  oneWayMinutes: number;
  route: LatLng[];
  ghatSpans: GhatSpan[];
  utcOffsetMinutes: number;
  id?: string;
  now?: string;
};

type Leg = 'out' | 'back';

function uid(n: number) {
  return `s${n}`;
}

function blankStop(partial: Omit<TripStop, 'id'>): Omit<TripStop, 'id'> {
  return partial;
}

function effectiveBudget(budget: BudgetLevel, instruction: string): BudgetLevel {
  if (/cheap|budget|low cost|மலிவு|குறை/i.test(instruction)) return 'low';
  return budget;
}

function wantedInterests(interests: Interest[], instruction: string): { onRoute: Interest[]; detour: Interest[] } {
  const q = instruction.toLowerCase();
  const less = /less driv|shorter driv|fewer stop|குறைவான ஓட்டம்/i.test(q);
  const adventure = /adventure|trek|safari|சாகச/i.test(q);
  const moreFood = /food|eat|உணவு/i.test(q);
  if (less) return { onRoute: [], detour: [] };
  const selected = new Set(interests);
  if (adventure && !selected.has('trekking') && !selected.has('jeep_safari') && !selected.has('wildlife')) {
    selected.add('trekking');
  }
  if (moreFood && !selected.has('food')) selected.add('food');
  const onRoute: Interest[] = [];
  const detour: Interest[] = [];
  for (const activity of ACTIVITIES) {
    if (!selected.has(activity.interest)) continue;
    if (activity.onRoute) onRoute.push(activity.interest);
    else detour.push(activity.interest);
  }
  if (moreFood) onRoute.push('food');
  return { onRoute, detour };
}

function groupDays(stops: TripStop[], offset: number, lang: Lang): TripDay[] {
  const order: string[] = [];
  const buckets = new Map<string, TripStop[]>();
  for (const stop of stops) {
    const key = localParts(stop.at, offset).key;
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key)!.push(stop);
  }
  return order.map((date, index) => ({
    index,
    date,
    label: fill(t(lang, 'dayLabel'), { n: index + 1 }),
    stops: buckets.get(date) ?? [],
  }));
}

export function flattenPlan(plan: TripPlan): TripStop[] {
  return plan.days.flatMap((day) => day.stops);
}

function nightsBetween(stops: TripStop[], offset: number): number {
  const days = new Set(stops.map((stop) => localParts(stop.at, offset).key));
  return Math.max(0, days.size - 1);
}

export function quoteBudget(
  mode: TravelMode,
  budget: BudgetLevel,
  travellers: number,
  distanceKm: number,
  stops: TripStop[],
  offset: number
): BudgetBreakdown {
  const people = Math.max(1, travellers);
  const tickets = ticketPerKm(mode) * distanceKm * people;
  const fuel = fuelPerKm(mode) * distanceKm + tickets;
  const tolls = tollPerKm(mode) * distanceKm;
  const stay = stayRate(budget) * nightsBetween(stops, offset) * people;
  let food = 0;
  let activities = 0;
  for (const stop of stops) {
    const line = stop.costPerPerson * people;
    if (stop.bucket === 'food') food += line;
    if (stop.bucket === 'activity') activities += line;
  }
  const total = fuel + tolls + stay + activities + food;
  return {
    fuel: Math.round(fuel),
    tolls: Math.round(tolls),
    stay: Math.round(stay),
    activities: Math.round(activities),
    food: Math.round(food),
    total: Math.round(total),
    perPerson: Math.round(total / people),
  };
}

function backupText(lang: Lang, stops: TripStop[], backByLabel: string): string {
  const outdoor = stops
    .filter((stop) => stop.kind === 'activity' && stop.confirmBeforeGoing)
    .map((stop) => stop.name);
  if (outdoor.length === 0) return fill(t(lang, 'backupPlain'), { time: backByLabel });
  return fill(t(lang, 'backup'), { outdoor: outdoor.join(', '), time: backByLabel });
}

export function packingFor(
  lang: Lang,
  interests: Interest[],
  weather: DayWeather[],
  stops: TripStop[],
  offset: number,
  previous?: PackingItem[]
): PackingItem[] {
  const items: { id: string; label: string }[] = [
    { id: 'water', label: t(lang, 'packWater') },
    { id: 'charger', label: t(lang, 'packCharger') },
    { id: 'cash', label: t(lang, 'packCash') },
    { id: 'meds', label: t(lang, 'packMeds') },
    { id: 'snacks', label: t(lang, 'packSnacks') },
  ];
  const rainy = weather.some((day) => day.rainWarning || day.precipProb >= 40);
  const cold = weather.some((day) => day.tempMin <= 18);
  const hot = weather.some((day) => day.tempMax >= 34);
  if (rainy) items.push({ id: 'rain', label: t(lang, 'packRain') });
  if (cold) items.push({ id: 'layer', label: t(lang, 'packLayer') });
  if (hot) items.push({ id: 'sun', label: t(lang, 'packSun') });
  if (interests.includes('trekking')) items.push({ id: 'shoes', label: t(lang, 'packShoes') });
  if (interests.includes('photography')) items.push({ id: 'camera', label: t(lang, 'packCamera') });
  if (interests.includes('temples')) items.push({ id: 'scarf', label: t(lang, 'packScarf') });
  if (interests.some((item) => item === 'wildlife' || item === 'jeep_safari' || item === 'elephant_camp')) {
    items.push({ id: 'neutral', label: t(lang, 'packNeutral') });
  }
  if (interests.includes('boating')) items.push({ id: 'dry', label: t(lang, 'packDry') });
  if (nightsBetween(stops, offset) > 0) items.push({ id: 'night', label: t(lang, 'packNight') });
  const checked = new Set((previous ?? []).filter((item) => item.checked).map((item) => item.id));
  return items.map((item) => ({ ...item, checked: checked.has(item.id) }));
}

type SimOpts = {
  start: Date;
  forward: boolean;
  bufferedMin: number;
  route: LatLng[];
  spans: GhatSpan[];
  from: TripPlace;
  to: TripPlace;
  drivers: number;
  mode: TravelMode;
  budget: BudgetLevel;
  lang: Lang;
  leg: Leg;
};

function makeStop(opts: Omit<TripStop, 'id'>): TripStop {
  return { id: '', ...opts };
}

function clockTip(lang: Lang, drivers: number, mode: TravelMode, at: Date, lat: number, lng: number): string {
  const night = isNight(at, lat, lng);
  if (night) return t(lang, 'overnightTip');
  if (drivers >= 2 && (mode === 'car' || mode === 'bike')) return t(lang, 'swapTip');
  if (drivers < 2 && (mode === 'car' || mode === 'bike')) return t(lang, 'singleTip');
  return t(lang, 'dayTip');
}

function ghatCall(
  leg: number,
  sliceMin: number,
  t0: Date,
  forward: boolean,
  bufferedMin: number,
  spans: GhatSpan[],
  route: LatLng[]
): { type: 'ok' } | { type: 'shorten'; sliceMin: number } | { type: 'hold'; driveMin: number; legAt: number } {
  const nextLeg = Math.min(1, leg + sliceMin / bufferedMin);
  let soonest: { legAt: number; exitLeg: number } | null = null;
  for (const span of spans) {
    if (forward) {
      if (span.end <= leg + 0.004) continue;
      const legAt = Math.max(span.start, leg);
      if (legAt >= nextLeg - 1e-4) continue;
      const exitLeg = Math.min(1, span.end);
      if (!soonest || legAt < soonest.legAt) soonest = { legAt, exitLeg };
    } else {
      const outNow = 1 - leg;
      const outNext = 1 - nextLeg;
      if (span.start >= outNow - 0.004) continue;
      const hitOut = Math.min(span.end, outNow);
      if (hitOut <= outNext + 1e-4) continue;
      const legAt = 1 - hitOut;
      const exitLeg = Math.min(1, 1 - span.start);
      if (!soonest || legAt < soonest.legAt) soonest = { legAt, exitLeg };
    }
  }
  if (!soonest) return { type: 'ok' };
  const point = pointAlong(route, forward ? soonest.legAt : 1 - soonest.legAt);
  const exitPoint = pointAlong(route, forward ? soonest.exitLeg : 1 - soonest.exitLeg);
  const entrance = new Date(t0.getTime() + (soonest.legAt - leg) * bufferedMin * 60000);
  const exit = new Date(t0.getTime() + Math.max(0, soonest.exitLeg - leg) * bufferedMin * 60000);
  const sunset = Math.min(
    getSunTimes(entrance, point.lat, point.lng).sunset.getTime(),
    getSunTimes(exit, exitPoint.lat, exitPoint.lng).sunset.getTime()
  );
  const driveMin = Math.max(0, (soonest.legAt - leg) * bufferedMin);
  if (isNight(entrance, point.lat, point.lng) || entrance.getTime() >= sunset) {
    return { type: 'hold', driveMin, legAt: soonest.legAt };
  }
  if (exit.getTime() > sunset) {
    const allow = Math.floor((sunset - 15 * 60000 - t0.getTime()) / 60000);
    if (allow < 8) return { type: 'hold', driveMin, legAt: soonest.legAt };
    if (allow < sliceMin) return { type: 'shorten', sliceMin: allow };
  }
  return { type: 'ok' };
}

function simulateLeg(opts: SimOpts): { stops: TripStop[]; end: Date } {
  const { lang, budget, drivers, mode } = opts;
  const stops: TripStop[] = [];
  let cursor = opts.start;
  let driven = 0;
  let breaks = 0;
  let guard = 0;
  const canSwap = drivers >= 2 && (mode === 'car' || mode === 'bike');
  const push = (stop: Omit<TripStop, 'id'>) => {
    stops.push(makeStop(stop));
  };
  const fromPoint = opts.forward ? pointAlong(opts.route, 0) : pointAlong(opts.route, 1);
  push(blankStop({
    kind: 'depart',
    at: cursor.toISOString(),
    durationMin: 0,
    name: fill(t(lang, 'leave'), { place: opts.from.name }),
    tip: t(lang, 'dayTip'),
    description: fill(t(lang, 'leave'), { place: opts.from.name }),
    costPerPerson: 0,
    confirmBeforeGoing: false,
    lat: fromPoint.lat,
    lng: fromPoint.lng,
    leg: opts.leg,
    outStart: opts.forward ? 0 : 1,
    outEnd: opts.forward ? 0 : 1,
    bucket: 'none',
  }));

  while (driven < opts.bufferedMin - 0.5 && guard++ < 80) {
    const remain = opts.bufferedMin - driven;
    let slice = Math.min(DRIVE_CHUNK_MIN, remain);
    const leg = driven / opts.bufferedMin;
    const here = pointAlong(opts.route, opts.forward ? leg : 1 - leg);
    const call = ghatCall(leg, slice, cursor, opts.forward, opts.bufferedMin, opts.spans, opts.route);
    if (call.type === 'hold') {
      const driveMin = Math.min(remain, Math.round(call.driveMin));
      if (driveMin >= 1) {
        const nextDriven = driven + driveMin;
        const outEnd = opts.forward ? nextDriven / opts.bufferedMin : 1 - nextDriven / opts.bufferedMin;
        const atPoint = pointAlong(opts.route, opts.forward ? nextDriven / opts.bufferedMin : outEnd);
        push(blankStop({
          kind: 'drive',
          at: cursor.toISOString(),
          durationMin: driveMin,
          name: fill(t(lang, 'drive'), { place: opts.to.name }),
          tip: clockTip(lang, drivers, mode, cursor, here.lat, here.lng),
          description: fill(t(lang, 'driveDesc'), { min: `${driveMin} min` }),
          costPerPerson: 0,
          confirmBeforeGoing: false,
          lat: atPoint.lat,
          lng: atPoint.lng,
          leg: opts.leg,
          outStart: opts.forward ? leg : 1 - leg,
          outEnd,
          bucket: 'none',
        }));
        cursor = new Date(cursor.getTime() + driveMin * 60000);
        driven = nextDriven;
      }
      const holdPoint = pointAlong(opts.route, opts.forward ? driven / opts.bufferedMin : 1 - driven / opts.bufferedMin);
      const resume = nextDaylight(cursor, holdPoint.lat, holdPoint.lng);
      let holdMin = Math.round((resume.getTime() - cursor.getTime()) / 60000);
      if (holdMin < 15) holdMin = 15;
      push(blankStop({
        kind: 'ghat_hold',
        at: cursor.toISOString(),
        durationMin: holdMin,
        name: t(lang, 'ghatName'),
        tip: t(lang, 'ghatTip'),
        description: t(lang, 'ghatDesc'),
        costPerPerson: 0,
        confirmBeforeGoing: true,
        lat: holdPoint.lat,
        lng: holdPoint.lng,
        leg: opts.leg,
        outStart: opts.forward ? driven / opts.bufferedMin : 1 - driven / opts.bufferedMin,
        outEnd: opts.forward ? driven / opts.bufferedMin : 1 - driven / opts.bufferedMin,
        bucket: 'none',
      }));
      cursor = new Date(cursor.getTime() + holdMin * 60000);
      continue;
    }
    const shortened = call.type === 'shorten';
    if (shortened) slice = Math.min(slice, call.sliceMin);
    slice = Math.max(1, Math.round(slice));
    if (driven + slice > opts.bufferedMin) slice = Math.round(opts.bufferedMin - driven);
    const nextDriven = driven + slice;
    const endFrac = nextDriven / opts.bufferedMin;
    const outEnd = opts.forward ? endFrac : 1 - endFrac;
    const atPoint = pointAlong(opts.route, opts.forward ? endFrac : outEnd);
    push(blankStop({
      kind: 'drive',
      at: cursor.toISOString(),
      durationMin: slice,
      name: fill(t(lang, 'drive'), { place: opts.to.name }),
      tip: clockTip(lang, drivers, mode, cursor, here.lat, here.lng),
      description: fill(t(lang, 'driveDesc'), { min: `${slice} min` }),
      costPerPerson: 0,
      confirmBeforeGoing: false,
      lat: atPoint.lat,
      lng: atPoint.lng,
      leg: opts.leg,
      outStart: opts.forward ? leg : 1 - leg,
      outEnd,
      bucket: 'none',
    }));
    cursor = new Date(cursor.getTime() + slice * 60000);
    driven = nextDriven;
    if (driven >= opts.bufferedMin - 0.5) break;
    if (shortened) continue;
    const meal = breaks % 2 === 1;
    breaks += 1;
    const durationMin = meal ? 45 : 20;
    const swapName = meal ? t(lang, 'mealSwap') : t(lang, 'teaSwap');
    const plainName = meal ? t(lang, 'meal') : t(lang, 'tea');
    push(blankStop({
      kind: 'break',
      at: cursor.toISOString(),
      durationMin,
      name: canSwap ? swapName : plainName,
      tip: canSwap ? t(lang, 'swapTip') : t(lang, 'breakTip'),
      description: t(lang, 'breakTip'),
      costPerPerson: mealCost(budget, meal),
      confirmBeforeGoing: false,
      lat: atPoint.lat,
      lng: atPoint.lng,
      leg: opts.leg,
      outStart: outEnd,
      outEnd,
      bucket: 'food',
    }));
    cursor = new Date(cursor.getTime() + durationMin * 60000);
  }

  const endPoint = opts.forward ? pointAlong(opts.route, 1) : pointAlong(opts.route, 0);
  push(blankStop({
    kind: 'arrive',
    at: cursor.toISOString(),
    durationMin: 0,
    name: fill(t(lang, 'arrive'), { place: opts.to.name }),
    tip: t(lang, 'dayTip'),
    description: fill(t(lang, 'arrive'), { place: opts.to.name }),
    costPerPerson: 0,
    confirmBeforeGoing: false,
    lat: endPoint.lat,
    lng: endPoint.lng,
    leg: opts.leg,
    outStart: opts.forward ? 1 : 0,
    outEnd: opts.forward ? 1 : 0,
    bucket: 'none',
  }));
  return { stops, end: cursor };
}

function scheduleReturn(base: Omit<SimOpts, 'start' | 'forward' | 'leg' | 'from' | 'to'> & { from: TripPlace; to: TripPlace }, backBy: Date) {
  const bufferedMin = base.bufferedMin;
  const maxBack = bufferedMin + 60 * 48;
  let chosen: { stops: TripStop[]; end: Date; leave: Date } | null = null;
  for (let earlier = 10; earlier <= maxBack; earlier += 10) {
    const leave = new Date(backBy.getTime() - earlier * 60000);
    const sim = simulateLeg({ ...base, start: leave, forward: false, leg: 'back', from: base.from, to: base.to });
    if (sim.end.getTime() <= backBy.getTime() + 30000) {
      chosen = { ...sim, leave };
      break;
    }
  }
  if (!chosen) {
    const leave = new Date(backBy.getTime() - maxBack * 60000);
    const sim = simulateLeg({ ...base, start: leave, forward: false, leg: 'back', from: base.from, to: base.to });
    chosen = { ...sim, leave };
  }
  const slackMin = (backBy.getTime() - chosen.end.getTime()) / 60000;
  if (slackMin >= 2) {
    const nudgedLeave = new Date(chosen.leave.getTime() + Math.floor(slackMin) * 60000);
    const nudged = simulateLeg({ ...base, start: nudgedLeave, forward: false, leg: 'back', from: base.from, to: base.to });
    if (nudged.end.getTime() <= backBy.getTime() + 30000) return { stops: nudged.stops, end: nudged.end, leave: nudgedLeave };
  }
  return chosen;
}

function activityStop(
  interest: Interest,
  at: string,
  budget: BudgetLevel,
  lang: Lang,
  place: LatLng,
  leg: TripStop['leg'],
  fraction: number
): TripStop | null {
  const def = ACTIVITIES.find((item) => item.interest === interest);
  if (!def) return null;
  return makeStop({
    kind: 'activity',
    at,
    durationMin: def.durationMin,
    name: def.name[lang],
    tip: def.tip[lang],
    description: def.description[lang],
    costPerPerson: def.cost[budget],
    confirmBeforeGoing: def.confirm,
    lat: place.lat,
    lng: place.lng,
    leg,
    outStart: fraction,
    outEnd: fraction,
    bucket: interest === 'food' ? 'food' : 'activity',
  });
}

function insertOnRoute(stops: TripStop[], extras: TripStop[]): TripStop[] {
  if (extras.length === 0) return stops;
  const pivot = stops.findIndex((stop) => stop.kind === 'drive' && stop.leg === 'out' && stop.outEnd >= 0.35);
  const at = pivot >= 0 ? pivot + 1 : Math.max(0, stops.length - 1);
  const added = extras.reduce((sum, stop) => sum + stop.durationMin, 0);
  const startAt = stops[at]?.at ?? extras[0].at;
  let cursor = startAt;
  const timed = extras.map((stop) => {
    const next = { ...stop, at: cursor };
    cursor = addMinutes(cursor, stop.durationMin);
    return next;
  });
  const shifted = stops.map((stop, index) => (index >= at ? { ...stop, at: addMinutes(stop.at, added) } : stop));
  shifted.splice(at, 0, ...timed);
  return shifted;
}

export function assemblePlan(input: {
  request: TripRequest;
  routeMeta: RouteMeta;
  utcOffsetMinutes: number;
  stops: TripStop[];
  latestLeaveAt: string;
  id?: string;
  now?: string;
  previousPacking?: PackingItem[];
  weather?: DayWeather[];
  shareCode?: string;
}): TripPlan {
  const stops = input.stops.map((stop, index) => ({ ...stop, id: uid(index + 1) }));
  const home = stops[stops.length - 1];
  const homeAt = home?.at ?? input.request.backBy;
  const shortfallMin = Math.max(0, Math.round((new Date(homeAt).getTime() - new Date(input.request.backBy).getTime()) / 60000));
  const driveMinutes = stops.filter((stop) => stop.kind === 'drive').reduce((sum, stop) => sum + stop.durationMin, 0);
  const backLabel = localParts(input.request.backBy, input.utcOffsetMinutes).time;
  const weather = input.weather ?? [];
  const budget = quoteBudget(
    input.request.mode,
    effectiveBudget(input.request.budget, input.request.instruction),
    input.request.travellers,
    input.routeMeta.oneWayKm * 2,
    stops,
    input.utcOffsetMinutes
  );
  return {
    id: input.id ?? `t${Date.now().toString(36)}`,
    createdAt: input.now ?? new Date().toISOString(),
    request: input.request,
    routeMeta: {
      ...input.routeMeta,
      route: input.routeMeta.route,
    },
    utcOffsetMinutes: input.utcOffsetMinutes,
    distanceKm: Math.round(input.routeMeta.oneWayKm * 2),
    driveMinutes,
    latestLeaveAt: input.latestLeaveAt,
    homeAt,
    fits: shortfallMin <= 1,
    shortfallMin,
    days: groupDays(stops, input.utcOffsetMinutes, input.request.lang),
    weather,
    packing: packingFor(input.request.lang, input.request.interests, weather, stops, input.utcOffsetMinutes, input.previousPacking),
    budget,
    backupPlan: backupText(input.request.lang, stops, backLabel),
    shareCode: input.shareCode,
  };
}

export function buildTripPlan(input: BuildInput): TripPlan {
  const budget = effectiveBudget(input.request.budget, input.request.instruction);
  const bufferedMin = Math.max(1, Math.round(input.oneWayMinutes * DRIVE_BUFFER));
  const route = input.route.length >= 2
    ? input.route
    : [input.request.origin, input.request.destination];
  const base = {
    bufferedMin,
    route,
    spans: input.ghatSpans,
    drivers: input.request.drivers,
    mode: input.request.mode,
    budget,
    lang: input.request.lang,
  };
  const legalReturn = scheduleReturn(
    { ...base, from: input.request.destination, to: input.request.origin },
    new Date(input.request.backBy)
  );
  let outbound = simulateLeg({
    ...base,
    start: new Date(input.request.departAt),
    forward: true,
    leg: 'out',
    from: input.request.origin,
    to: input.request.destination,
  });
  let returnSim = legalReturn;
  let fitsGap = outbound.end.getTime() <= legalReturn.leave.getTime();
  if (!fitsGap) {
    returnSim = {
      ...simulateLeg({
        ...base,
        start: outbound.end,
        forward: false,
        leg: 'back',
        from: input.request.destination,
        to: input.request.origin,
      }),
      leave: outbound.end,
    };
  }

  const wishes = wantedInterests(input.request.interests, input.request.instruction);
  if (fitsGap) {
    const leaveMs = legalReturn.leave.getTime();
    const onRoute: TripStop[] = [];
    let arrivalMs = outbound.end.getTime();
    for (const interest of wishes.onRoute) {
      const def = ACTIVITIES.find((item) => item.interest === interest);
      if (!def) continue;
      if (arrivalMs + def.durationMin * 60000 > leaveMs - 15 * 60000) continue;
      const fraction = 0.45;
      const stop = activityStop(interest, new Date(arrivalMs).toISOString(), budget, input.request.lang, pointAlong(route, fraction), 'out', fraction);
      if (!stop) continue;
      onRoute.push(stop);
      arrivalMs += def.durationMin * 60000;
    }
    if (onRoute.length) outbound = { ...outbound, stops: insertOnRoute(outbound.stops, onRoute), end: new Date(arrivalMs) };

    const destStops: TripStop[] = [];
    let cursor = outbound.end.getTime();
    for (const interest of wishes.detour) {
      const def = ACTIVITIES.find((item) => item.interest === interest);
      if (!def) continue;
      if (cursor + def.durationMin * 60000 > leaveMs - 10 * 60000) continue;
      const stop = activityStop(
        interest,
        new Date(cursor).toISOString(),
        budget,
        input.request.lang,
        input.request.destination,
        'dest',
        1
      );
      if (!stop) continue;
      destStops.push(stop);
      cursor += def.durationMin * 60000;
    }
    const freeMin = Math.round((leaveMs - cursor) / 60000);
    if (freeMin >= 20) {
      destStops.push(makeStop({
        kind: 'free',
        at: new Date(cursor).toISOString(),
        durationMin: freeMin,
        name: fill(t(input.request.lang, 'freeName'), { place: input.request.destination.name }),
        tip: t(input.request.lang, 'freeTip'),
        description: t(input.request.lang, 'freeDesc'),
        costPerPerson: 0,
        confirmBeforeGoing: false,
        lat: input.request.destination.lat,
        lng: input.request.destination.lng,
        leg: 'dest',
        outStart: 1,
        outEnd: 1,
        bucket: 'none',
      }));
    }
    const arriveIndex = outbound.stops.findIndex((stop) => stop.kind === 'arrive' && stop.leg === 'out');
    const head = arriveIndex >= 0 ? outbound.stops.slice(0, arriveIndex + 1) : outbound.stops;
    const tail = returnSim.stops;
    return assemblePlan({
      request: { ...input.request, budget },
      routeMeta: {
        oneWayKm: input.oneWayKm,
        oneWayMinutes: input.oneWayMinutes,
        route,
        ghatSpans: input.ghatSpans,
      },
      utcOffsetMinutes: input.utcOffsetMinutes,
      stops: [...head, ...destStops, ...tail],
      latestLeaveAt: legalReturn.leave.toISOString(),
      id: input.id,
      now: input.now,
    });
  }

  return assemblePlan({
    request: input.request,
    routeMeta: {
      oneWayKm: input.oneWayKm,
      oneWayMinutes: input.oneWayMinutes,
      route,
      ghatSpans: input.ghatSpans,
    },
    utcOffsetMinutes: input.utcOffsetMinutes,
    stops: [...outbound.stops, ...returnSim.stops],
    latestLeaveAt: legalReturn.leave.toISOString(),
    id: input.id,
    now: input.now,
  });
}

export function applyDescriptions(plan: TripPlan, descriptions: Record<string, string>): TripPlan {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      stops: day.stops.map((stop) => {
        const next = descriptions[stop.id];
        if (!next) return stop;
        return { ...stop, description: next };
      }),
    })),
  };
}
