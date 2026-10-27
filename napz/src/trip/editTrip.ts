import { assemblePlan, flattenPlan } from './planTrip';
import { addMinutes, isoFromLocal, localParts } from './time';
import type { TripPlan, TripStop } from './types';

function finish(plan: TripPlan, stops: TripStop[]): TripPlan {
  return assemblePlan({
    request: plan.request,
    routeMeta: plan.routeMeta,
    utcOffsetMinutes: plan.utcOffsetMinutes,
    stops,
    latestLeaveAt: plan.latestLeaveAt,
    id: plan.id,
    now: plan.createdAt,
    previousPacking: plan.packing,
    weather: plan.weather,
    shareCode: plan.shareCode,
  });
}

export function setStopClock(plan: TripPlan, id: string, hhmm: string): TripPlan {
  const stops = flattenPlan(plan);
  const index = stops.findIndex((stop) => stop.id === id);
  if (index < 0) return plan;
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return plan;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (hh > 23 || mm > 59) return plan;
  const date = localParts(stops[index].at, plan.utcOffsetMinutes).key;
  const nextAt = isoFromLocal(date, `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, plan.utcOffsetMinutes);
  if (!nextAt) return plan;
  const deltaMin = Math.round((new Date(nextAt).getTime() - new Date(stops[index].at).getTime()) / 60000);
  const shifted = stops.map((stop, i) => (i < index ? stop : { ...stop, at: addMinutes(stop.at, deltaMin) }));
  return finish(plan, shifted);
}

export function deleteStop(plan: TripPlan, id: string): TripPlan {
  const stops = flattenPlan(plan);
  const index = stops.findIndex((stop) => stop.id === id);
  if (index <= 0 || index >= stops.length - 1) return plan;
  const removed = stops[index];
  const next = stops.filter((stop) => stop.id !== id);
  for (let i = index; i < next.length; i++) {
    next[i] = { ...next[i], at: addMinutes(next[i].at, -removed.durationMin) };
  }
  return finish(plan, next);
}

export function moveStop(plan: TripPlan, id: string, direction: -1 | 1): TripPlan {
  const stops = flattenPlan(plan);
  const index = stops.findIndex((stop) => stop.id === id);
  const target = index + direction;
  if (index <= 0 || target <= 0 || index >= stops.length - 1 || target >= stops.length - 1) return plan;
  const next = stops.slice();
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  const from = Math.min(index, target);
  const anchor = stops[from].at;
  next[from] = { ...next[from], at: anchor };
  for (let k = from; k < next.length - 1; k++) {
    next[k + 1] = { ...next[k + 1], at: addMinutes(next[k].at, next[k].durationMin) };
  }
  return finish(plan, next);
}

export function togglePacking(plan: TripPlan, id: string): TripPlan {
  return {
    ...plan,
    packing: plan.packing.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
  };
}
