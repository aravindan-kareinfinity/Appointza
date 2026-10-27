export const DRIVE_BUFFER = 1.2;
export const DRIVE_CHUNK_MIN = 165;

export function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

export function localParts(iso: string, offsetMin: number) {
  const d = new Date(new Date(iso).getTime() + offsetMin * 60000);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const hh = d.getUTCHours();
  const mm = d.getUTCMinutes();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    key: `${y}-${pad(m)}-${pad(day)}`,
    time: `${pad(hh)}:${pad(mm)}`,
    weekday: d.getUTCDay(),
  };
}

export function isoFromLocal(date: string, time: string, offsetMin: number): string | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!dateMatch || !timeMatch) return null;
  const y = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hh = Number(timeMatch[1]);
  const mm = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hh > 23 || mm > 59) return null;
  const utc = Date.UTC(y, month - 1, day, hh, mm) - offsetMin * 60000;
  const check = new Date(utc + offsetMin * 60000);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return new Date(utc).toISOString();
}

export function formatInr(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded));
  if (digits.length <= 3) return `${sign}₹${digits}`;
  const head = digits.slice(0, digits.length - 3);
  const tail = digits.slice(-3);
  const groups: string[] = [];
  let rest = head;
  while (rest.length > 2) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) groups.unshift(rest);
  return `${sign}₹${groups.join(',')},${tail}`;
}

export function formatHours(minutes: number): string {
  const hours = minutes / 60;
  if (hours < 1) return `${Math.round(minutes)} min`;
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} h`;
}
