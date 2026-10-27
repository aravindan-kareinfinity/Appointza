import { t } from './i18n';
import type { DayWeather, Lang, TravelMode } from './types';

export function adjustMinutesForMode(osrmMinutes: number, mode: TravelMode): number {
  const factor = mode === 'bike' ? 1.25 : mode === 'bus' ? 1.35 : mode === 'train' ? 0.8 : 1;
  return osrmMinutes * factor;
}

export function weatherLabel(code: number, lang: Lang): string {
  if (code === 0) return t(lang, 'clear');
  if (code <= 3) return t(lang, 'cloudy');
  if (code === 45 || code === 48) return t(lang, 'fog');
  if (code >= 51 && code <= 57) return t(lang, 'drizzle');
  if (code >= 61 && code <= 67) return t(lang, 'rain');
  if (code >= 71 && code <= 77) return t(lang, 'snow');
  if (code >= 80 && code <= 82) return t(lang, 'showers');
  if (code >= 95) return t(lang, 'thunder');
  return t(lang, 'cloudy');
}

export function isRainCode(code: number): boolean {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
}

export function parseWeather(
  payload: {
    daily?: {
      time?: string[];
      weather_code?: number[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_probability_max?: number[];
    };
  },
  lang: Lang
): DayWeather[] {
  const daily = payload.daily;
  if (!daily?.time) return [];
  return daily.time.map((date, index) => {
    const code = daily.weather_code?.[index] ?? 0;
    const precipProb = daily.precipitation_probability_max?.[index] ?? 0;
    return {
      date,
      code,
      tempMax: Math.round(daily.temperature_2m_max?.[index] ?? 0),
      tempMin: Math.round(daily.temperature_2m_min?.[index] ?? 0),
      precipProb: Math.round(precipProb),
      rainWarning: precipProb >= 50 || isRainCode(code),
      label: weatherLabel(code, lang),
    };
  });
}
