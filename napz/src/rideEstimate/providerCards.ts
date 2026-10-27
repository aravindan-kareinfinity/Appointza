import { formatDurationSeconds } from './formatJourney';
import type { OverviewRoute, RideProviderCard } from './types';

const FARE_UNAVAILABLE = 'Check fare in app';

export function headlineOfficialFare(estimates: Array<string | null | undefined>): string | null {
  const labels = estimates.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  if (labels.length === 0) return null;
  const scored = labels.map((label) => {
    const match = label.match(/(\d+(?:\.\d+)?)/);
    return { label, amount: match ? Number(match[1]) : Number.POSITIVE_INFINITY };
  });
  scored.sort((a, b) => a.amount - b.amount);
  return scored[0].label;
}

export function buildProviderCards(overview: OverviewRoute[]): RideProviderCard[] {
  const road = overview.find((item) => item.mode === 'car' || item.mode === 'two_wheeler');
  const durationSeconds = road?.durationSeconds ?? null;
  const durationLabel = durationSeconds != null ? formatDurationSeconds(durationSeconds) : 'See in app';

  return [
    {
      id: 'uber',
      name: 'Uber',
      vehicleTypes: ['Car'],
      fareLabel: FARE_UNAVAILABLE,
      fareIsEstimate: false,
      durationSeconds,
      durationLabel,
      actionLabel: 'Open Uber',
      durationNote: 'Prices below are from Uber’s estimate API for this pickup and drop.',
    },
    {
      id: 'ola',
      name: 'Ola',
      vehicleTypes: ['Auto', 'Cab', 'Bike'],
      fareLabel: FARE_UNAVAILABLE,
      fareIsEstimate: false,
      durationSeconds,
      durationLabel,
      actionLabel: 'Open Ola',
      durationNote:
        'Prices below are from Ola’s ride estimate API for this pickup and drop.',
    },
    {
      id: 'rapido',
      name: 'Rapido',
      vehicleTypes: ['Bike', 'Auto', 'Cab'],
      fareLabel: FARE_UNAVAILABLE,
      fareIsEstimate: false,
      durationSeconds,
      durationLabel,
      durationNote:
        'Opens the Rapido app on your phone. Confirm pickup and drop in Rapido.',
      actionLabel: 'Open Rapido',
    },
  ];
}
