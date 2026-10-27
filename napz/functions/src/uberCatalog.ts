export type UberProductOffer = {
  productId: string;
  displayName: string;
  description: string | null;
  capacity: number | null;
  estimate: string | null;
  durationSeconds: number | null;
  surgeMultiplier: number | null;
};

type UberProductRow = {
  product_id?: string;
  display_name?: string;
  description?: string;
  capacity?: number;
};

type UberPriceRow = {
  product_id?: string;
  display_name?: string;
  estimate?: string;
  currency_code?: string;
  low_estimate?: number;
  high_estimate?: number;
  duration?: number;
  surge_multiplier?: number;
};

type UberTimeRow = {
  product_id?: string;
  estimate?: number;
};

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function finite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Uses Uber's estimate string, or official low/high fields. Never invents amounts. */
export function formatUberPrice(row: UberPriceRow): string | null {
  const labeled = text(row.estimate);
  if (labeled) return labeled;
  const low = finite(row.low_estimate);
  const high = finite(row.high_estimate);
  const currency = text(row.currency_code);
  const symbol = !currency || currency === 'INR' ? '₹' : `${currency} `;
  if (low != null && high != null) return low === high ? `${symbol}${low}` : `${symbol}${low}–${high}`;
  if (low != null) return `${symbol}${low}`;
  if (high != null) return `${symbol}${high}`;
  return null;
}

/** Maps official Uber JSON only. Never invents a fare string. */
export function mergeUberProductFeeds(
  products: UberProductRow[] | undefined,
  prices: UberPriceRow[] | undefined,
  times: UberTimeRow[] | undefined
): UberProductOffer[] {
  const priceById = new Map((prices ?? []).filter((row) => row.product_id).map((row) => [row.product_id as string, row]));
  const timeById = new Map((times ?? []).filter((row) => row.product_id).map((row) => [row.product_id as string, row]));
  const fromProducts = (products ?? [])
    .filter((row) => row.product_id && row.display_name)
    .map((row) => {
      const id = row.product_id as string;
      const price = priceById.get(id);
      const time = timeById.get(id);
      const etaSeconds = finite(time?.estimate);
      const tripSeconds = finite(price?.duration);
      return {
        productId: id,
        displayName: row.display_name as string,
        description: text(row.description),
        capacity: finite(row.capacity),
        estimate: price ? formatUberPrice(price) : null,
        durationSeconds: tripSeconds ?? etaSeconds,
        surgeMultiplier: finite(price?.surge_multiplier),
      };
    });
  if (fromProducts.length > 0) return fromProducts;

  return (prices ?? [])
    .filter((row) => row.product_id && row.display_name)
    .map((row) => ({
      productId: row.product_id as string,
      displayName: row.display_name as string,
      description: null,
      capacity: null,
      estimate: formatUberPrice(row),
      durationSeconds: finite(row.duration),
      surgeMultiplier: finite(row.surge_multiplier),
    }));
}
