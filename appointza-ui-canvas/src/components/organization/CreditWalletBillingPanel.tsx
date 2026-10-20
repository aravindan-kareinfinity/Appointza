import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSubscriptionApiErrorMessage,
  SubscriptionService,
} from "@/services/subscription.service";
import type { CreditWalletStatusRes, CreditWalletPack } from "@/models/subscription.model";
import { useWalletRecharge } from "@/hooks/useWalletRecharge";
import { Loader2, Star, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

type CreditWalletBillingPanelProps = {
  organisationId?: number;
};

export function CreditWalletBillingPanel({ organisationId: organisationIdProp }: CreditWalletBillingPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const subscriptionService = useMemo(() => new SubscriptionService(), []);
  const [wallet, setWallet] = useState<CreditWalletStatusRes | null>(null);
  const [loading, setLoading] = useState(true);

  const organisationId = organisationIdProp ?? user?.organisationid ?? 0;

  const loadWallet = useCallback(async () => {
    if (organisationId <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await subscriptionService.getWalletStatus(organisationId);
      setWallet(data);
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not load Credit Wallet",
        description: getSubscriptionApiErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [organisationId, subscriptionService, toast]);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const { payingPackId, rechargePack } = useWalletRecharge({
    organisationId,
    onRecharged: async () => {
      await loadWallet();
    },
  });

  if (loading) {
    return (
      <div className="flex min-h-[10rem] items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-label="Loading wallet" />
      </div>
    );
  }

  if (organisationId <= 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:p-6">
        Credit Wallet is available for organization accounts. Sign in as the organization owner to
        manage booking credits.
      </div>
    );
  }

  const packs = wallet?.packs ?? [];
  const transactions = wallet?.recent_transactions ?? [];
  const creditsPerBooking = Math.max(1, wallet?.credits_per_booking ?? 1);
  const signupCredits = wallet?.signup_free_credits ?? 50;
  const balance = wallet?.wallet_credit_balance ?? 0;

  const bookingsFromCredits = (credits: number) => Math.floor(credits / creditsPerBooking);

  const packMeta = (pack: CreditWalletPack) => {
    const bookingCount = bookingsFromCredits(pack.credits);
    const price = pack.price_label || `₹${pack.price_inr.toLocaleString("en-IN")}`;
    const busy = payingPackId !== null;
    const thisPackPaying = payingPackId === pack.id;
    return { bookingCount, price, busy, thisPackPaying };
  };

  const defaultOpenPack = packs.find((p) => p.highlighted)?.id ?? packs[0]?.id;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 sm:space-y-6">
      {/* Balance */}
      <section className="rounded-2xl border border-stone-200 bg-gradient-to-br from-blue-50 to-white p-4 sm:rounded-3xl sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Wallet className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-stone-600">Wallet balance</p>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-appointza-navy sm:text-4xl">
              {balance.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-sm text-stone-600">booking credits available</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-stone-500 sm:text-sm">
          {signupCredits} free credits are added once when you sign in. Each booking uses{" "}
          {creditsPerBooking} credit{creditsPerBooking === 1 ? "" : "s"}. Recharge below when you need
          more.
        </p>
      </section>

      {/* Packs — 2 cards on web, accordion on mobile */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-appointza-navy sm:text-lg">Credit packs</h2>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">
            1 credit = 1 customer booking. Pay with Razorpay — credits stay until used.
          </p>
        </div>

        {packs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500">
            No recharge packs available yet. Add paid plans in{" "}
            <code className="text-xs">subscription_plans</code> and refresh.
          </div>
        ) : (
          <>
            {/* Desktop / tablet: 2-column cards */}
            <ul className="hidden gap-4 md:grid md:grid-cols-2">
              {packs.map((pack) => {
                const { bookingCount, price, busy, thisPackPaying } = packMeta(pack);
                return (
                  <li
                    key={pack.id}
                    className={cn(
                      "flex flex-col rounded-2xl border bg-white p-5",
                      pack.highlighted
                        ? "border-blue-300 ring-1 ring-blue-100"
                        : "border-stone-200",
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-appointza-navy">{pack.name}</h3>
                        {pack.highlighted ? (
                          <Badge className="gap-0.5 bg-blue-600 hover:bg-blue-600">
                            <Star className="h-3 w-3 fill-current" />
                            Best value
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-stone-600">
                        {pack.credits.toLocaleString("en-IN")} credits
                        <span className="text-stone-400"> · </span>
                        ≈ {bookingCount.toLocaleString("en-IN")} bookings
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-blue-700">{price}</p>
                    </div>
                    <Button
                      type="button"
                      disabled={busy}
                      className={cn(
                        org.btnPrimary,
                        "mt-4 h-11 min-h-11 w-full touch-manipulation rounded-xl bg-none bg-blue-600 shadow-none hover:bg-blue-700",
                      )}
                      onClick={() => void rechargePack(pack.id)}
                    >
                      {thisPackPaying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Paying…
                        </>
                      ) : (
                        "Recharge"
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>

            {/* Mobile: accordion */}
            <Accordion
              type="single"
              collapsible
              defaultValue={defaultOpenPack ? String(defaultOpenPack) : undefined}
              className="rounded-2xl border border-stone-200 bg-white md:hidden"
            >
              {packs.map((pack) => {
                const { bookingCount, price, busy, thisPackPaying } = packMeta(pack);
                return (
                  <AccordionItem
                    key={pack.id}
                    value={String(pack.id)}
                    className={cn(
                      "border-stone-200 px-4 last:border-b-0",
                      pack.highlighted && "bg-blue-50/40",
                    )}
                  >
                    <AccordionTrigger className="gap-3 py-3.5 text-left hover:no-underline">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-appointza-navy">{pack.name}</span>
                          {pack.highlighted ? (
                            <Badge className="gap-0.5 bg-blue-600 hover:bg-blue-600">
                              <Star className="h-3 w-3 fill-current" />
                              Best value
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-sm font-bold tabular-nums text-blue-700">
                          {price}
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <p className="mb-3 text-sm text-stone-600">
                        {pack.credits.toLocaleString("en-IN")} credits
                        <span className="text-stone-400"> · </span>
                        ≈ {bookingCount.toLocaleString("en-IN")} bookings
                      </p>
                      <Button
                        type="button"
                        disabled={busy}
                        className={cn(
                          org.btnPrimary,
                          "h-11 min-h-11 w-full touch-manipulation rounded-xl bg-none bg-blue-600 shadow-none hover:bg-blue-700",
                        )}
                        onClick={() => void rechargePack(pack.id)}
                      >
                        {thisPackPaying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Paying…
                          </>
                        ) : (
                          "Recharge"
                        )}
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </>
        )}
      </section>

      {/* Activity */}
      {transactions.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-4 py-3 sm:px-5">
            <h2 className="text-base font-semibold text-appointza-navy">Recent activity</h2>
          </div>
          <ul className="divide-y divide-stone-100">
            {transactions.slice(0, 8).map((tx) => (
              <li
                key={tx.id}
                className="flex items-start justify-between gap-3 px-4 py-3.5 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">{tx.description}</p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {tx.created_at ? new Date(tx.created_at).toLocaleString("en-IN") : ""}
                  </p>
                </div>
                {tx.amount !== 0 ? (
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      tx.amount > 0 ? "text-emerald-600" : "text-stone-800",
                    )}
                  >
                    {tx.amount > 0 ? "+" : "−"}
                    {Math.abs(tx.amount)} cr
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
