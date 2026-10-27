import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { OrganisationOnboardingService } from "@/services/organisationOnboarding.service";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { BUSINESS_OFFERING_LABELS } from "@/components/onboarding/BusinessOfferingsCards";
import { businessOnboardingRouteForStep } from "@/utils/businessOnboarding.util";
import { onboardingOfferingCreateRoute } from "@/utils/organizationOnboarding.util";

/**
 * Dashboard setup checklist. Shown while onboarding is incomplete, or when the backend still
 * lists selected offerings that have not been configured or skipped.
 */
export function OnboardingChecklist({ className }: { className?: string }) {
  const { user } = useAuth();
  const organizationId = user?.organisationid ?? 0;
  const {
    isComplete,
    isLoading,
    backendState: hookBackendState,
    hasCustomDomain,
    hasServices,
    hasWebsite,
    hasTiming,
  } = useOnboardingStatus();

  // The status hook skips the backend call when onboarding is cached complete; still check
  // here so the dashboard can surface offerings that were never configured.
  const { data: fetchedState } = useQuery({
    queryKey: ["organisation-onboarding-state", organizationId],
    queryFn: () => new OrganisationOnboardingService().getStatus(),
    enabled: organizationId > 0 && user?.isStaff !== true && !isLoading && !hookBackendState,
    staleTime: 60_000,
    retry: false,
  });
  const backendState = hookBackendState ?? fetchedState ?? null;

  const pendingOfferings = (backendState?.selected_offerings ?? []).filter(
    (offering) =>
      offering !== "other" &&
      !backendState?.configured_offerings.includes(offering) &&
      !backendState?.skipped_offerings.includes(offering),
  );

  if (isLoading || (isComplete && pendingOfferings.length === 0)) return null;

  const derived = backendState?.derived;
  const rows = backendState
    ? [
        { label: "Choose what you offer", done: backendState.selected_offerings.length > 0 },
        { label: "Add your offerings", done: pendingOfferings.length === 0 && backendState.selected_offerings.length > 0 },
        {
          label: "Website address",
          done: !!derived?.has_custom_domain || backendState.website_skipped,
        },
        { label: "Website design", done: !!derived?.has_website },
        { label: "Business hours", done: !!derived?.has_timing },
      ]
    : [
        { label: "Add a service", done: hasServices },
        { label: "Custom domain", done: hasCustomDomain },
        { label: "Booking website", done: hasWebsite },
        { label: "Business hours", done: hasTiming },
      ];
  const doneCount = rows.filter((row) => row.done).length;

  return (
    <div className={cn("rounded-lg border border-[#e6eaf0] bg-white p-4 sm:p-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#FFF5F3] px-2.5 py-0.5 text-xs font-semibold text-[#E85D4C]">
              Setup checklist
            </span>
            <span className="text-xs text-stone-500">
              {doneCount} of {rows.length} done
            </span>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center gap-2 text-[13px]">
                {row.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-[#cfd6e0]" />
                )}
                <span className={row.done ? "text-[#6b7280]" : "font-medium text-[#1a1a1a]"}>{row.label}</span>
              </li>
            ))}
          </ul>
          {pendingOfferings.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-stone-600">
              <span>Still to set up:</span>
              {pendingOfferings.map((offering) => {
                const route = onboardingOfferingCreateRoute(offering);
                return route ? (
                  <Link key={offering} to={route} className="font-medium text-[#E85D4C] hover:underline">
                    {BUSINESS_OFFERING_LABELS[offering]}
                  </Link>
                ) : (
                  <span key={offering}>{BUSINESS_OFFERING_LABELS[offering]}</span>
                );
              })}
            </div>
          ) : null}
        </div>
        <Button asChild className={cn(org.btnPrimary, "shrink-0")}>
          <Link
            to={businessOnboardingRouteForStep(
              backendState?.current_step || "offerings",
            )}
          >
            Resume setup
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
