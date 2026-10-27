export type BlaBlaCarRideOffer = {
  id: string;
  summary: string;
  origin: string | null;
  destination: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  durationLabel: string | null;
  fareLabel: string | null;
  carrierName: string | null;
};

type Moneyish = number | string | { amount?: number; currency_code?: string; currency_symbol?: string };

type TicketPricing = {
  currency_code?: string;
  currency_symbol?: string;
  base_ticket_price?: Moneyish;
  ticket_price_with_automatic_discount?: Moneyish;
};

type RideJson = {
  id?: string;
  duration?: string;
  departure?: { date_time?: string; point?: { name?: string; location?: { name?: string } } };
  arrival?: { date_time?: string; point?: { name?: string; location?: { name?: string } } };
  ticket_pricing?: TicketPricing;
  bus_line?: { name?: string; number?: string };
  branding?: { organization?: { name?: string } };
  carrier?: { name?: string };
};

type JourneyJson = {
  id?: string;
  rides?: RideJson[];
};

function finite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function amountOf(value: Moneyish | undefined): number | null {
  if (value == null) return null;
  if (typeof value === 'object') return finite(value.amount);
  return finite(value);
}

export function formatBlaBlaCarFare(pricing: TicketPricing | undefined): string | null {
  if (!pricing) return null;
  const discounted = amountOf(pricing.ticket_price_with_automatic_discount);
  const base = amountOf(pricing.base_ticket_price);
  const amount = discounted ?? base;
  if (amount == null) return null;
  const symbol = text(pricing.currency_symbol) ?? (pricing.currency_code === 'INR' ? '₹' : text(pricing.currency_code));
  return symbol ? `${symbol}${amount}` : String(amount);
}

export function parseIsoDurationLabel(value: string | undefined): string | null {
  if (!value) return null;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(value.trim());
  if (!match) return text(value);
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  if (!hours && !minutes) return null;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

export function mapBlaBlaCarJourneys(journeys: JourneyJson[] | undefined): BlaBlaCarRideOffer[] {
  return (journeys ?? [])
    .filter((item) => item.id && Array.isArray(item.rides) && item.rides.length > 0)
    .map((item) => {
      const ride = item.rides![0];
      const origin =
        text(ride.departure?.point?.name) ?? text(ride.departure?.point?.location?.name);
      const destination =
        text(ride.arrival?.point?.name) ?? text(ride.arrival?.point?.location?.name);
      const line = text(ride.bus_line?.name) ?? text(ride.bus_line?.number);
      return {
        id: item.id as string,
        summary: line || [origin, destination].filter(Boolean).join(' → ') || 'BlaBlaCar Pro bus',
        origin,
        destination,
        departureTime: text(ride.departure?.date_time),
        arrivalTime: text(ride.arrival?.date_time),
        durationLabel: parseIsoDurationLabel(ride.duration),
        fareLabel: formatBlaBlaCarFare(ride.ticket_pricing),
        carrierName: text(ride.carrier?.name) ?? text(ride.branding?.organization?.name),
      };
    });
}
