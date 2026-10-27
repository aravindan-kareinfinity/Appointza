const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = RAD * 23.4397;

function toJulian(date: Date) {
  return date.valueOf() / DAY_MS - 0.5 + J1970;
}
function fromJulian(j: number) {
  return new Date((j + 0.5 - J1970) * DAY_MS);
}
function toDays(date: Date) {
  return toJulian(date) - J2000;
}
function solarMeanAnomaly(d: number) {
  return RAD * (357.5291 + 0.98560028 * d);
}
function eclipticLongitude(m: number) {
  const c = RAD * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m));
  return m + c + RAD * 102.9372 + Math.PI;
}
function declination(lng: number) {
  return Math.asin(Math.sin(lng) * Math.sin(OBLIQUITY));
}
function julianCycle(d: number, lw: number) {
  return Math.round(d - 0.0009 - lw / (2 * Math.PI));
}
function approxTransit(h: number, lw: number, n: number) {
  return 0.0009 + (h + lw) / (2 * Math.PI) + n;
}
function solarTransit(ds: number, m: number, lng: number) {
  return J2000 + ds + 0.0053 * Math.sin(m) - 0.0069 * Math.sin(2 * lng);
}
function hourAngle(h: number, phi: number, dec: number) {
  const cos = Math.cos(phi) * Math.cos(dec);
  const num = Math.sin(h) - Math.sin(phi) * Math.sin(dec);
  return Math.acos(Math.min(1, Math.max(-1, num / (cos || 1))));
}

export function getSunTimes(date: Date, lat: number, lng: number): { sunrise: Date; sunset: Date } {
  const lw = RAD * -lng;
  const phi = RAD * lat;
  const d = toDays(date);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const m = solarMeanAnomaly(ds);
  const ecl = eclipticLongitude(m);
  const dec = declination(ecl);
  const noon = solarTransit(ds, m, ecl);
  const h0 = -0.833 * RAD;
  const w = hourAngle(h0, phi, dec);
  const setJ = solarTransit(approxTransit(w, lw, n), m, ecl);
  const riseJ = noon - (setJ - noon);
  const sunrise = fromJulian(riseJ);
  const sunset = fromJulian(setJ);
  if (!Number.isFinite(sunrise.getTime()) || !Number.isFinite(sunset.getTime())) {
    return fallbackSun(date, lat, lng);
  }
  return { sunrise, sunset };
}

function fallbackSun(date: Date, lat: number, lng: number) {
  const offset = lat >= 6 && lat <= 37 && lng >= 68 && lng <= 97 ? 330 : Math.round((lng / 15) * 60);
  const local = new Date(date.getTime() + offset * 60000);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  return {
    sunrise: new Date(Date.UTC(y, m, d, 6, 15) - offset * 60000),
    sunset: new Date(Date.UTC(y, m, d, 18, 0) - offset * 60000),
  };
}

export function isNight(at: Date, lat: number, lng: number): boolean {
  const { sunrise, sunset } = getSunTimes(at, lat, lng);
  return at.getTime() < sunrise.getTime() || at.getTime() >= sunset.getTime();
}

export function nextDaylight(at: Date, lat: number, lng: number): Date {
  const times = getSunTimes(at, lat, lng);
  if (at.getTime() < times.sunrise.getTime()) return new Date(times.sunrise.getTime() + 20 * 60000);
  if (at.getTime() < times.sunset.getTime()) return at;
  const later = new Date(at.getTime() + 18 * 3600000);
  const next = getSunTimes(later, lat, lng);
  return new Date(next.sunrise.getTime() + 20 * 60000);
}
