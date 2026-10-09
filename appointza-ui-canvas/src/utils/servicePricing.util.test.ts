import { describe, expect, it } from "vitest";
import {
  getServiceEffectivePriceForDate,
  getServiceStartingPrice,
  isOfferPriceApplicable,
} from "@/utils/servicePricing.util";

const MONDAY = new Date(2026, 9, 5);
const SATURDAY = new Date(2026, 9, 3);

describe("servicePricing", () => {
  it("uses the flat price when weekday/weekend pricing is off", () => {
    const result = getServiceEffectivePriceForDate({ prize: 500 }, SATURDAY);
    expect(result).toMatchObject({ effectivePrice: 500, basePrice: 500, isOfferApplied: false });
  });

  it("charges the weekend price on weekends when pricing differs", () => {
    const service = { prize: 500, weekday_price: 400, weekend_price: 700, is_price_different: true };
    expect(getServiceEffectivePriceForDate(service, SATURDAY).effectivePrice).toBe(700);
    expect(getServiceEffectivePriceForDate(service, MONDAY).effectivePrice).toBe(400);
  });

  it("applies an offer only when it is lower than the base price", () => {
    expect(getServiceEffectivePriceForDate({ prize: 500, offerprize: 350 }, MONDAY)).toMatchObject({
      effectivePrice: 350,
      isOfferApplied: true,
    });
    expect(getServiceEffectivePriceForDate({ prize: 500, offerprize: 600 }, MONDAY).effectivePrice).toBe(500);
  });

  it("ignores offers when weekday/weekend pricing differs", () => {
    const service = { prize: 500, weekday_price: 400, weekend_price: 700, is_price_different: true, offerprize: 100 };
    expect(isOfferPriceApplicable(service)).toBe(false);
    expect(getServiceEffectivePriceForDate(service, MONDAY).isOfferApplied).toBe(false);
  });

  it("returns 0 when the price is hidden", () => {
    expect(getServiceEffectivePriceForDate({ prize: 500, show_price: false }, MONDAY).effectivePrice).toBe(0);
    expect(getServiceStartingPrice({ prize: 500, show_price: false })).toBe(0);
  });

  it("starting price is the cheaper of weekday/weekend", () => {
    expect(
      getServiceStartingPrice({ prize: 500, weekday_price: 400, weekend_price: 700, is_price_different: true }),
    ).toBe(400);
  });

  it("tolerates string prices from the API", () => {
    expect(getServiceStartingPrice({ prize: "450" as unknown as number })).toBe(450);
  });
});
