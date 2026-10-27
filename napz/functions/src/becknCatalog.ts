export type NammaYatriOffer = {
  bppId: string;
  sellerName: string;
  vehicle: string;
  estimate: string | null;
  durationMinutes: number | null;
};

type BecknItem = {
  descriptor?: { name?: string; code?: string };
  price?: { currency?: string; value?: string; minimum_value?: string; maximum_value?: string };
  category_ids?: string[];
  fulfillment_ids?: string[];
};

type BecknOnSearch = {
  context?: { bpp_id?: string };
  message?: {
    catalog?: {
      providers?: Array<{
        descriptor?: { name?: string };
        items?: BecknItem[];
        fulfillments?: Array<{ id?: string; vehicle?: { category?: string } }>;
      }>;
    };
  };
};

function finite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function rupees(price: BecknItem['price']): string | null {
  const min = finite(price?.minimum_value);
  const max = finite(price?.maximum_value);
  const value = finite(price?.value);
  if (min != null && max != null && min !== max) return `₹${Math.round(min)}–${Math.round(max)}`;
  const single = value ?? max ?? min;
  return single != null ? `₹${Math.round(single)}` : null;
}

/** Maps Beckn `on_search` payloads. Prices are only what the network returns, never computed. */
export function parseOnSearch(payloads: BecknOnSearch[]): NammaYatriOffer[] {
  const offers: NammaYatriOffer[] = [];
  for (const payload of payloads) {
    const bppId = payload.context?.bpp_id ?? '';
    for (const provider of payload.message?.catalog?.providers ?? []) {
      const vehicleByFulfillment = new Map(
        (provider.fulfillments ?? []).filter((f) => f.id).map((f) => [f.id as string, f.vehicle?.category ?? ''])
      );
      for (const item of provider.items ?? []) {
        const vehicle =
          item.descriptor?.name ||
          vehicleByFulfillment.get(item.fulfillment_ids?.[0] ?? '') ||
          item.descriptor?.code ||
          '';
        if (!vehicle) continue;
        offers.push({
          bppId,
          sellerName: provider.descriptor?.name ?? bppId,
          vehicle,
          estimate: rupees(item.price),
          durationMinutes: null,
        });
      }
    }
  }
  return offers;
}
