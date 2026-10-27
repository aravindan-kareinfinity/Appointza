export type OlaProductOffer = {
  categoryId: string;
  displayName: string;
  available: boolean;
  etaMinutes: number | null;
  estimate: string | null;
  durationMinutes: number | null;
};

type OlaCategory = {
  id?: string;
  display_name?: string;
  eta?: number;
};

type OlaUpfront = {
  fare?: number;
  is_upfront_applicable?: boolean;
};

type OlaRideEstimate = {
  category?: string;
  amount_min?: number;
  amount_max?: number;
  travel_time_in_minutes?: number;
  upfront?: OlaUpfront;
};

function finite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function rupeeRange(min: number | null, max: number | null, upfront: OlaUpfront | undefined): string | null {
  if (upfront?.is_upfront_applicable === true) {
    const fare = finite(upfront.fare);
    if (fare != null) return `₹${fare}`;
  }
  if (min != null && max != null) {
    return min === max ? `₹${min}` : `₹${min}–${max}`;
  }
  if (min != null) return `₹${min}`;
  if (max != null) return `₹${max}`;
  return null;
}

/** Maps official Ola /v1/products JSON. Never computes a fare from rate-card fields. */
export function mergeOlaProductFeeds(
  categories: OlaCategory[] | undefined,
  estimates: OlaRideEstimate[] | undefined
): OlaProductOffer[] {
  const estimateByCategory = new Map(
    (estimates ?? []).filter((row) => row.category).map((row) => [row.category as string, row])
  );

  return (categories ?? [])
    .filter((row) => row.id && row.display_name)
    .map((row) => {
      const id = row.id as string;
      const eta = finite(row.eta);
      const quote = estimateByCategory.get(id);
      return {
        categoryId: id,
        displayName: row.display_name as string,
        available: eta != null && eta >= 0,
        etaMinutes: eta != null && eta >= 0 ? eta : null,
        estimate: rupeeRange(finite(quote?.amount_min), finite(quote?.amount_max), quote?.upfront),
        durationMinutes: finite(quote?.travel_time_in_minutes),
      };
    });
}
