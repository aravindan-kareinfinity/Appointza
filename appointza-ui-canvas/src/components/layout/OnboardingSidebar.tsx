import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ConciergeBell,
  Globe,
  LayoutTemplate,
  MapPin,
  Package,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ORG_SIDEBAR_WIDTH_CLASS,
} from "@/utils/orgSidebar.util";
import { useIsMobile } from "@/hooks/use-mobile";
import type { OrganisationOnboardingState } from "@/models/organisationOnboarding.model";
import {
  BUSINESS_COMPLETE_PATH,
  BUSINESS_DOMAIN_PATH,
  BUSINESS_LOCATION_PATH,
  BUSINESS_OFFERINGS_PATH,
  BUSINESS_ONBOARDING_RETURN_PATH,
  BUSINESS_TIMING_PATH,
  BUSINESS_WEBSITE_PATH,
} from "@/utils/businessOnboarding.util";
import { onboardingOfferingCreateRoute } from "@/utils/organizationOnboarding.util";

type OnboardingSidebarProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  backendState: OrganisationOnboardingState | null;
  hasServices: boolean;
  hasWebsite: boolean;
  hasTiming: boolean;
};

type SetupStep = {
  id: string;
  label: string;
  to: string;
  icon: React.ElementType;
  done: boolean;
  match: (pathname: string, search: string) => boolean;
};

function offeringDone(
  state: OrganisationOnboardingState | null,
  offering: string,
  derivedFallback: boolean,
): boolean {
  if (!state) return derivedFallback;
  const configured = state.configured_offerings ?? [];
  const skipped = state.skipped_offerings ?? [];
  return (
    configured.some((o) => o.toLowerCase() === offering) ||
    skipped.some((o) => o.toLowerCase() === offering)
  );
}

function buildSteps(
  state: OrganisationOnboardingState | null,
  hasServices: boolean,
  hasWebsite: boolean,
  hasTiming: boolean,
): SetupStep[] {
  const selected = state?.selected_offerings ?? [];
  const steps: SetupStep[] = [
    {
      id: "business",
      label: "Business profile",
      to: BUSINESS_ONBOARDING_RETURN_PATH,
      icon: Building2,
      done: state?.profile_complete === true,
      match: (pathname) => pathname.startsWith("/register/business"),
    },
    {
      id: "location",
      label: "Location",
      to: BUSINESS_LOCATION_PATH,
      icon: MapPin,
      done: state?.location_complete === true || state?.derived?.has_location === true,
      match: (pathname) => pathname.startsWith("/register/location"),
    },
    {
      id: "offerings",
      label: "What you offer",
      to: BUSINESS_OFFERINGS_PATH,
      icon: Sparkles,
      done: selected.length > 0,
      match: (pathname) => pathname.startsWith("/register/offerings"),
    },
  ];

  // Only show create steps for offerings the user selected on "What you offer".
  const wantsServices = selected.some((o) => o === "services");
  const wantsEvents = selected.some((o) => o === "events" || o === "classes");
  const wantsStay = selected.some((o) => o === "stay");

  if (wantsServices) {
    steps.push({
      id: "services",
      label: "Services",
      to: onboardingOfferingCreateRoute("services") || "/organization/services?kind=services",
      icon: Package,
      done: offeringDone(state, "services", hasServices),
      match: (pathname, search) =>
        pathname.startsWith("/organization/services") &&
        (search.includes("kind=services") || (!search.includes("kind=") && !search.includes("kind=events"))),
    });
  }

  if (wantsEvents) {
    steps.push({
      id: "events",
      label: "Events",
      to: onboardingOfferingCreateRoute("events") || "/organization/services?kind=events",
      icon: CalendarDays,
      done: offeringDone(state, "events", false) || offeringDone(state, "classes", false),
      match: (pathname, search) =>
        pathname.startsWith("/organization/services") && search.includes("kind=events"),
    });
  }

  if (wantsStay) {
    steps.push({
      id: "rooms",
      label: "Rooms",
      to:
        onboardingOfferingCreateRoute("stay") ||
        "/organization/hospitality?section=room-status",
      icon: ConciergeBell,
      done: offeringDone(state, "stay", false),
      match: (pathname) => pathname.startsWith("/organization/hospitality"),
    });
  }

  steps.push(
    {
      id: "website",
      label: "Website",
      to: BUSINESS_WEBSITE_PATH,
      icon: LayoutTemplate,
      done: hasWebsite || state?.website_skipped === true,
      match: (pathname) =>
        pathname.startsWith("/register/website") ||
        pathname.startsWith("/organization/templates") ||
        pathname.startsWith("/organization/template-builder"),
    },
    {
      id: "domain",
      label: "Domain name",
      to: BUSINESS_DOMAIN_PATH,
      icon: Globe,
      done: state?.derived?.has_custom_domain === true,
      match: (pathname) =>
        pathname.startsWith("/register/domain") ||
        pathname.startsWith("/organization/custom-domain"),
    },
    {
      id: "timing",
      label: "Opening hours",
      to: BUSINESS_TIMING_PATH,
      icon: Clock,
      done: hasTiming || state?.derived?.has_timing === true,
      match: (pathname) => pathname.startsWith("/organization/timing"),
    },
    {
      id: "complete",
      label: "Finish setup",
      to: BUSINESS_COMPLETE_PATH,
      icon: PartyPopper,
      done: state?.is_complete === true,
      match: (pathname) => pathname.startsWith("/register/complete"),
    },
  );

  return steps;
}

export default function OnboardingSidebar({
  collapsed,
  onCollapsedChange,
  backendState,
  hasServices,
  hasWebsite,
  hasTiming,
}: OnboardingSidebarProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isCollapsed = collapsed;
  const steps = buildSteps(backendState, hasServices, hasWebsite, hasTiming);
  const doneCount = steps.filter((s) => s.done).length;

  if (isMobile) {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e6eaf0] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex items-stretch gap-0.5 overflow-x-auto px-2 py-1.5">
          {steps.map((step) => {
            const active = step.match(location.pathname, location.search);
            const Icon = step.icon;
            return (
              <Link
                key={step.id}
                to={step.to}
                className={cn(
                  "flex min-w-[4.5rem] flex-1 flex-col items-center gap-0.5 rounded-md px-1.5 py-1.5 text-[10px] font-medium no-underline",
                  active ? "bg-[#eef2f7] text-[#1a1a1a]" : "text-[#667085]",
                )}
              >
                <span className="relative">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {step.done ? (
                    <span className="absolute -right-1.5 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-2 w-2" strokeWidth={3} />
                    </span>
                  ) : null}
                </span>
                <span className="truncate">{step.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <aside
      className={cn(
        "org-workspace-curve fixed left-0 top-12 z-40 hidden h-[calc(100dvh-3rem)] flex-col overflow-hidden border-r border-[#e6eaf0] bg-white shadow-none lg:flex transition-all duration-200",
        isCollapsed ? ORG_SIDEBAR_WIDTH_CLASS.collapsed : ORG_SIDEBAR_WIDTH_CLASS.expanded,
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center border-b border-[#e6eaf0]",
          isCollapsed ? "justify-center p-3" : "justify-between gap-2 px-3 py-3",
        )}
      >
        {!isCollapsed ? (
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#1a1a1a]">Setup</p>
            <p className="text-[11px] text-[#9aa3b2]">
              {doneCount} of {steps.length} done
            </p>
          </div>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapsedChange(!isCollapsed)}
          className={cn(
            "h-7 w-7 text-[#7a8494] hover:bg-[#f4f6f9] hover:text-[#1a1a1a]",
            isCollapsed && "mx-auto",
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col">
        <div className={cn("flex-1 overflow-y-auto", isCollapsed ? "px-2 py-3" : "px-2 py-3")}>
          {!isCollapsed ? (
            <p className="mb-1 mt-0 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa3b2]">
              Get started
            </p>
          ) : (
            <div className="my-2 border-t border-[#e8ecf1]" />
          )}

          {steps.map((step) => {
            const active = step.match(location.pathname, location.search);
            const Icon = step.icon;
            return (
              <Link
                key={step.id}
                to={step.to}
                title={isCollapsed ? step.label : undefined}
                className={cn(
                  "relative mb-0.5 flex items-center gap-2.5 rounded-md py-2 text-[13px] font-medium transition-colors",
                  isCollapsed ? "justify-center px-2" : "px-3",
                  active
                    ? "bg-[#eef2f7] text-[#1a1a1a]"
                    : "text-[#5b6572] hover:bg-[#f4f6f9] hover:text-[#1a1a1a]",
                )}
              >
                {active && !isCollapsed ? (
                  <span
                    className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-full bg-[#528ff0]"
                    aria-hidden
                  />
                ) : null}
                <span className="relative shrink-0">
                  <Icon
                    className={cn(
                      "size-[18px]",
                      active ? "text-[#528ff0]" : step.done ? "text-emerald-500" : "text-[#7a8494]",
                    )}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  {step.done && isCollapsed ? (
                    <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-2 w-2" strokeWidth={3} />
                    </span>
                  ) : null}
                </span>
                {!isCollapsed ? (
                  <>
                    <span className="min-w-0 flex-1 truncate">{step.label}</span>
                    {step.done ? (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                    ) : null}
                  </>
                ) : null}
              </Link>
            );
          })}
        </div>

        <div className={cn("mt-auto shrink-0 border-t border-[#e6eaf0] p-2")}>
          {!isCollapsed ? (
            <p className="px-3 py-2 text-[11px] leading-snug text-[#9aa3b2]">
              Complete these steps to unlock your full workspace.
            </p>
          ) : null}
        </div>
      </nav>
    </aside>
  );
}
