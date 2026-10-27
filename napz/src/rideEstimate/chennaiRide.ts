export const CHENNAI_RIDE_META = {
  title: 'Chennai ride options',
  description:
    'Enter a Chennai pickup and destination, then open Uber, Ola, or Rapido. Napz does not book rides or take ride payments.',
} as const;

export const CHENNAI_CENTER = { lat: 13.0827, lng: 80.2707 };

export type ChennaiVehicle = 'bike' | 'auto' | 'cab';

export const CHENNAI_VEHICLES: { id: ChennaiVehicle; label: string; hint: string }[] = [
  { id: 'bike', label: 'Bike', hint: 'Two-wheeler' },
  { id: 'auto', label: 'Auto', hint: 'Three-wheeler' },
  { id: 'cab', label: 'Cab', hint: 'Car' },
];

export type RideProviderId = 'uber' | 'rapido' | 'ola';

/** Which official apps typically serve the selected vehicle in Chennai. */
export function providersForVehicle(vehicle: ChennaiVehicle): RideProviderId[] {
  if (vehicle === 'cab') return ['uber', 'ola', 'rapido'];
  if (vehicle === 'auto' || vehicle === 'bike') return ['ola', 'rapido'];
  return ['rapido'];
}

export const FARE_CHECK_COPY = 'Check the fare in the provider app. Napz does not list prices.';
