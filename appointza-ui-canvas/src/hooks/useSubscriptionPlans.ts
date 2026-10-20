import { useEffect, useState } from "react";
import type { SubscriptionPlan } from "@/models/subscription.model";
import { SubscriptionService } from "@/services/subscription.service";
import { ensurePlansForDisplay } from "@/utils/subscriptionPlanPresentation";

/**
 * Loads active subscription plans from PostgreSQL via /Subscription/SelectPlans.
 * Falls back to canonical marketing plans if the API is down or returns no rows
 * so the homepage pricing section still renders.
 */
export function useSubscriptionPlans(projectName = "appointza") {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const service = new SubscriptionService();

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await service.selectPlans(projectName);
        if (cancelled) return;
        const active = [...list]
          .filter((p) => p.isactive !== false)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        const { plans: displayPlans } = ensurePlansForDisplay(active);
        setPlans(displayPlans);
      } catch {
        if (cancelled) return;
        // API/proxy down (often Vite → wrong port) — still show fallback pricing cards.
        const { plans: displayPlans } = ensurePlansForDisplay([]);
        setPlans(displayPlans);
        setError(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectName]);

  return { plans, loading, error };
}
