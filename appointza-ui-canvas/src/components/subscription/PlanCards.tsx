import React from "react";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "@/models/subscription.model";
import { getPlanPresentation } from "@/utils/subscriptionPlanPresentation";

type PlanCardsProps = {
  plans: SubscriptionPlan[];
  className?: string;
  currentPlanCode?: string;
  getCta: (plan: SubscriptionPlan, ctx: { isCurrent: boolean; isPopular: boolean }) => React.ReactNode;
  showFootnote?: boolean;
};

const normalizeCode = (code?: string | null) => (code ?? "").trim().toLowerCase();

function formatPercent(value: number) {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(value % 1 === 0 ? 0 : 1);
}

function simplifiedAfterNote(plan: SubscriptionPlan) {
  const inr = Number(plan.booking_fee_inr ?? 0);
  const pct = Number(plan.booking_fee_percent ?? 0);
  if (!Number.isFinite(inr) && !Number.isFinite(pct)) return "";
  if (!Number.isFinite(pct) || pct <= 0) return `Then: ₹${inr} per booking`;
  if (!Number.isFinite(inr) || inr <= 0) return `Then: ${formatPercent(pct)}% per booking`;
  return `Then: ₹${inr} or ${formatPercent(pct)}% per booking`;
}

export const PlanCards: React.FC<PlanCardsProps> = ({
  plans,
  className,
  currentPlanCode,
  getCta,
  showFootnote = true,
}) => {
  const normalizedCurrent = normalizeCode(currentPlanCode);
  const displayPlans = [...plans].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6">
        {displayPlans.map((plan) => {
          const code = normalizeCode(plan.plan_code);
          const pres = getPlanPresentation(plan);
          const isPopular = !!pres.popular;
          const isCurrent = normalizedCurrent !== "" && code === normalizedCurrent;
          const bookings = Number(plan.free_bookings_per_month ?? 0);
          const bookingsLabel = bookings > 0 ? `${bookings.toLocaleString("en-IN")} free bookings` : "Unlimited bookings";
          const after = simplifiedAfterNote(plan);

          return (
            <article
              key={plan.plan_code ?? plan.display_name}
              className={cn(
                "relative flex flex-col rounded-xl border bg-white/90 px-6 pb-6 pt-6 shadow-sm",
                "transition-transform duration-200",
                isPopular
                  ? "border-transparent bg-gradient-to-br from-[#528ff0] to-[#3d7ae8] text-white shadow-lg"
                  : "border-[#e6eaf0]",
              )}
            >
              {isPopular ? (
                <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-950 px-4 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow">
                  Most popular
                </div>
              ) : null}

              {isCurrent ? (
                <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-zinc-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Current
                </div>
              ) : null}

              <p
                className={cn(
                  "text-[11px] font-extrabold uppercase tracking-[0.22em]",
                  isPopular ? "text-white/85" : "text-[#98a2b3]",
                )}
              >
                {plan.display_name}
              </p>

              <div className="mt-2 flex items-end gap-1">
                <span className={cn("text-4xl font-black tracking-tight", isPopular ? "text-white" : "text-[#1a1a1a]")}>
                  {pres.monthlyPriceLabel}
                </span>
              </div>

              <div className="mt-4 space-y-1">
                <p className={cn("text-sm font-extrabold", isPopular ? "text-white" : "text-[#1a1a1a]")}>
                  {bookingsLabel}
                </p>
                {Number(plan.monthly_price_inr) > 0 && bookings > 0 ? (
                  <p className={cn("text-xs font-semibold", isPopular ? "text-white/90" : "text-emerald-700")}>
                    Effective ₹{(Number(plan.monthly_price_inr) / bookings).toLocaleString("en-IN", { maximumFractionDigits: 2 })} / included booking
                  </p>
                ) : null}
                {after ? (
                  <p className={cn("text-xs leading-relaxed", isPopular ? "text-white/80" : "text-[#667085]")}>{after}</p>
                ) : null}
              </div>

              <div className="mt-5 flex-1" />

              <div className="mt-4">
                {getCta(plan, { isCurrent, isPopular })}
              </div>
            </article>
          );
        })}
      </div>

      {showFootnote ? (
        <p className="text-center text-xs text-[#667085]">
          Booking fee applies after your free booking quota — whichever is higher.
        </p>
      ) : null}
    </div>
  );
};

