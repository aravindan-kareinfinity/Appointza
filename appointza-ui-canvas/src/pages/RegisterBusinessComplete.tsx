import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  Loader2,
  Users,
  Bell,
  Globe,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegisterOnboardingFormFrame } from "@/components/layout/RegisterOnboardingFormFrame";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { OrganisationOnboardingService } from "@/services/organisationOnboarding.service";
import type { OrganisationOnboardingState } from "@/models/organisationOnboarding.model";
import { BUSINESS_OFFERING_LABELS } from "@/components/onboarding/BusinessOfferingsCards";
import { cn } from "@/lib/utils";
import {
  BUSINESS_DOMAIN_PATH,
  BUSINESS_ONBOARDING_TOTAL_STEPS,
  BUSINESS_TIMING_PATH,
  BUSINESS_WEBSITE_PATH,
  clearPendingBusinessOnboarding,
  isPendingBusinessOnboarding,
  setBusinessOnboardingStep,
} from "@/utils/businessOnboarding.util";
import {
  onboardingOfferingCreateRoute,
  writeOnboardingCompleteCache,
} from "@/utils/organizationOnboarding.util";
import { USER_POST_LOGIN_PATH } from "@/utils/postAuthNavigation";

const continueBtnClass =
  "h-12 min-h-12 w-full touch-manipulation rounded-md border border-[#528ff0] bg-[#528ff0] text-[15px] font-semibold text-white shadow-none hover:bg-[#3d7ae8] disabled:opacity-50 disabled:hover:bg-[#528ff0]";

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  done: boolean;
  href?: string;
  icon: typeof Circle;
};

/** Screen 7 of 7 — what's next + unfinished checklist + open dashboard. */
const RegisterBusinessComplete = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const organizationId = user?.organisationid ?? 0;
  const onboardingService = useMemo(() => new OrganisationOnboardingService(), []);

  const [state, setState] = useState<OrganisationOnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  const load = useCallback(async () => {
    const next = await onboardingService.getStatus();
    setState(next);
    return next;
  }, [onboardingService]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/register?type=business", { replace: true });
      return;
    }
    if (!organizationId) {
      navigate(isPendingBusinessOnboarding() ? "/register/business" : USER_POST_LOGIN_PATH, {
        replace: true,
      });
      return;
    }

    setLoading(true);
    load()
      .then((next) => {
        // If website step isn't done yet, send them back.
        // Template assigned (has_website) or subdomain / skip all count as done.
        const websiteDone =
          !!next.derived?.has_website || !!next.website_skipped;
        const domainDone = !!next.derived?.has_custom_domain;
        const timingDone = !!next.derived?.has_timing;
        if (!next.is_complete && next.current_step !== "complete") {
          if (!websiteDone) {
            navigate(BUSINESS_WEBSITE_PATH, { replace: true });
          } else if (!domainDone) {
            navigate(BUSINESS_DOMAIN_PATH, { replace: true });
          } else if (!timingDone) {
            navigate(BUSINESS_TIMING_PATH, { replace: true });
          }
        }
      })
      .catch((error: any) => {
        toast({
          title: "Could not load setup",
          description: error?.response?.data?.error || error?.message || "Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, organizationId, navigate, load, toast]);

  const openDashboard = async () => {
    setFinishing(true);
    try {
      const next = await onboardingService.complete();
      setState(next);
      if (organizationId > 0) writeOnboardingCompleteCache(organizationId, true);
      void queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
      clearPendingBusinessOnboarding();
      setBusinessOnboardingStep("complete");
      navigate("/organization/dashboard", { replace: true });
    } catch (error: any) {
      toast({
        title: "Could not open dashboard",
        description: error?.response?.data?.error || error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setFinishing(false);
    }
  };

  if (loading || !state) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#fffaf8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" />
      </div>
    );
  }

  const derived = state.derived;
  const pendingOfferings = (state.selected_offerings ?? []).filter(
    (offering) =>
      offering !== "other" &&
      !state.configured_offerings.includes(offering) &&
      !state.skipped_offerings.includes(offering),
  );

  const checklist: ChecklistItem[] = [
    {
      id: "offerings",
      label: "Create more offerings",
      description:
        pendingOfferings.length > 0
          ? `Still to add: ${pendingOfferings.map((o) => BUSINESS_OFFERING_LABELS[o]).join(", ")}`
          : "Add more services, events, rooms or facilities anytime.",
      done: pendingOfferings.length === 0,
      href:
        pendingOfferings.length > 0
          ? onboardingOfferingCreateRoute(pendingOfferings[0]) ??
            "/organization/services?kind=services"
          : "/organization/services?kind=services",
      icon: Package,
    },
    {
      id: "website",
      label: "Finish your website design",
      description: derived.has_website
        ? "Your booking page template is assigned."
        : state.website_skipped
          ? "You skipped website setup — design a page when you’re ready."
          : "Design and publish your branded booking page.",
      done: !!derived.has_website,
      href: "/organization/templates",
      icon: Globe,
    },
    {
      id: "hours",
      label: "Set business hours",
      description: "So customers only see available booking slots.",
      done: !!derived.has_timing,
      href: "/organization/timing",
      icon: Clock,
    },
    {
      id: "staff",
      label: "Add staff",
      description: "Invite team members who take appointments.",
      done: false,
      href: "/organization/staff",
      icon: Users,
    },
    {
      id: "payments",
      label: "Connect payments",
      description: "Collect online payments for bookings.",
      done: false,
      href: "/organization/payment-settings",
      icon: CreditCard,
    },
    {
      id: "notifications",
      label: "Set up notifications",
      description: "WhatsApp, email or SMS reminders for customers.",
      done: false,
      href: "/organization/crm/whatsapp/automations",
      icon: Bell,
    },
  ];

  const unfinished = checklist.filter((item) => !item.done);

  return (
    <RegisterOnboardingFormFrame maxWidthClassName="max-w-2xl">
        <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#528ff0]">
          Step 9 of {BUSINESS_ONBOARDING_TOTAL_STEPS}
        </p>
        <p className="mb-3 text-[13px] font-medium text-[#667085]">What&apos;s next?</p>

        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight text-[#1a1a1a]">
              You&apos;re ready to go
            </h1>
            <p className="mt-1 text-[14px] leading-relaxed text-[#667085]">
              Your business profile is set up. Open the dashboard anytime — unfinished items stay on
              this checklist so you can finish them later.
            </p>
          </div>
        </div>

        <div className="space-y-5 rounded-lg border border-[#f0e6e3] bg-white p-5 sm:p-6">
          <div>
            <p className="text-[13px] font-semibold text-[#1a1a1a]">
              {unfinished.length === 0
                ? "Everything looks complete"
                : `${unfinished.length} optional item${unfinished.length === 1 ? "" : "s"} to finish`}
            </p>
            <p className="mt-0.5 text-[12px] text-[#667085]">
              None of these block your dashboard — complete them when it suits you.
            </p>
          </div>

          <ul className="space-y-2">
            {checklist.map((item) => {
              const Icon = item.icon;
              const body = (
                <>
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                      item.done ? "bg-emerald-50 text-emerald-700" : "bg-[#FFF0EB] text-[#E85D4C]",
                    )}
                  >
                    {item.done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-[14px] font-medium",
                        item.done ? "text-[#667085] line-through" : "text-[#1a1a1a]",
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-[#667085]">{item.description}</span>
                  </span>
                  {!item.done && item.href ? (
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#E85D4C]" />
                  ) : null}
                </>
              );

              return (
                <li key={item.id}>
                  {item.done || !item.href ? (
                    <div className="flex items-center gap-3 rounded-md border border-[#f0e6e3] px-3 py-2.5">
                      {body}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      className="flex items-center gap-3 rounded-md border border-[#f0e6e3] px-3 py-2.5 transition-colors hover:border-[#E85D4C]/40 hover:bg-[#fffaf8]"
                    >
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <Button
            type="button"
            className={continueBtnClass}
            disabled={finishing}
            onClick={() => void openDashboard()}
          >
            {finishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Open organization dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
    </RegisterOnboardingFormFrame>
  );
};

export default RegisterBusinessComplete;
