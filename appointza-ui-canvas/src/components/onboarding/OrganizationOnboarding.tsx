import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Globe,
  LayoutTemplate,
  Package,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import {
  ORGANIZATION_ONBOARDING_WIZARD_ROUTE,
  onboardingStepRoute,
} from "@/utils/organizationOnboarding.util";

/**
 * Legacy per-page step ids (custom domain → service → website → hours) still drive the
 * OnboardingPageGuide on those pages. The wizard hub (offerings → create_items → website →
 * timing) lives in OrganizationOnboardingWizard and uses OnboardingWizardStep from the model.
 */
export type OnboardingStepId = "customDomain" | "services" | "website" | "timing";

export type OnboardingStep = {
  id: OnboardingStepId;
  stepNumber: number;
  title: string;
  shortTitle: string;
  description: string;
  pageHint: string;
  route: string;
  actionLabel: string;
  icon: typeof Package;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "customDomain",
    stepNumber: 1,
    title: "Choose your booking page address",
    shortTitle: "Custom domain",
    description:
      "Pick a subdomain for your public site — for example mysalon.appointza.com — so customers can find and book you.",
    pageHint:
      "Enter a short name (slug) below. Your full address will end with our default domain automatically.",
    route: "/organization/custom-domain",
    actionLabel: "Set custom domain",
    icon: Globe,
  },
  {
    id: "services",
    stepNumber: 2,
    title: "Add your first service",
    shortTitle: "Add a service",
    description:
      "Customers book what you offer. Create at least one service — for example Consultation, Haircut, or Dental Check-up.",
    pageHint:
      "Services are everyday bookable offerings (e.g. haircut, consultation). Events are dated workshops or classes. Add at least one service to continue setup.",
    route: "/organization/services?kind=services",
    actionLabel: "Add service",
    icon: Package,
  },
  {
    id: "website",
    stepNumber: 3,
    title: "Create your booking website",
    shortTitle: "Create website",
    description:
      "Design your public page so customers can browse your services and book online.",
    pageHint:
      "Build your page with blocks or AI-generated HTML, then save — it will be linked to your business location automatically.",
    route: "/organization/templates",
    actionLabel: "Create website",
    icon: LayoutTemplate,
  },
  {
    id: "timing",
    stepNumber: 4,
    title: "Set your business hours",
    shortTitle: "Business hours",
    description:
      "Choose when you're open each day so customers only see available time slots when booking.",
    pageHint:
      "Set opening and closing times for each day of the week, then save. You can add breaks and holidays later.",
    route: "/organization/timing",
    actionLabel: "Set hours",
    icon: Clock,
  },
];

export type OnboardingFlags = {
  hasCustomDomain: boolean;
  hasServices: boolean;
  hasWebsite: boolean;
  hasTiming: boolean;
};

export function getOnboardingProgress({
  hasCustomDomain,
  hasServices,
  hasWebsite,
  hasTiming,
}: OnboardingFlags) {
  const completedCount =
    (hasCustomDomain ? 1 : 0) +
    (hasServices ? 1 : 0) +
    (hasWebsite ? 1 : 0) +
    (hasTiming ? 1 : 0);
  const totalSteps = ONBOARDING_STEPS.length;
  const percent = Math.round((completedCount / totalSteps) * 100);
  const nextStep: OnboardingStepId | null = !hasCustomDomain
    ? "customDomain"
    : !hasServices
      ? "services"
      : !hasWebsite
        ? "website"
        : !hasTiming
          ? "timing"
          : null;
  const currentStep = ONBOARDING_STEPS.find((s) => s.id === nextStep) ?? null;
  return {
    completedCount,
    totalSteps,
    percent,
    nextStep,
    currentStep,
    isComplete: completedCount === totalSteps,
  };
}

type OnboardingProgressProps = OnboardingFlags & {
  className?: string;
};

export function OnboardingProgressBar({
  hasCustomDomain,
  hasServices,
  hasWebsite,
  hasTiming,
  className,
}: OnboardingProgressProps) {
  const { completedCount, totalSteps, percent } = getOnboardingProgress({
    hasCustomDomain,
    hasServices,
    hasWebsite,
    hasTiming,
  });

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs font-medium text-stone-500">
        <span>
          Step {Math.min(completedCount + 1, totalSteps)} of {totalSteps}
        </span>
        <span>{percent}% complete</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-gradient-coral transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

type OnboardingStepListProps = OnboardingFlags & {
  nextStep: OnboardingStepId | null;
  onNavigate?: (route: string) => void;
};

function stepCompletion(id: OnboardingStepId, flags: OnboardingFlags): boolean {
  if (id === "customDomain") return flags.hasCustomDomain;
  if (id === "services") return flags.hasServices;
  if (id === "website") return flags.hasWebsite;
  return flags.hasTiming;
}

function stepLocked(id: OnboardingStepId, flags: OnboardingFlags): boolean {
  if (id === "customDomain") return false;
  if (id === "services") return !flags.hasCustomDomain;
  if (id === "website") return !flags.hasServices;
  return !flags.hasWebsite;
}

function lockedHint(id: OnboardingStepId, flags: OnboardingFlags): string | null {
  if (id === "services" && !flags.hasCustomDomain) return "Complete step 1 first";
  if (id === "website" && !flags.hasCustomDomain) return "Complete step 1 first";
  if (id === "website" && !flags.hasServices) return "Complete step 2 first";
  if (id === "timing" && !flags.hasCustomDomain) return "Complete step 1 first";
  if (id === "timing" && !flags.hasServices) return "Complete step 2 first";
  if (id === "timing" && !flags.hasWebsite) return "Create your website first (step 3)";
  return null;
}

export function OnboardingStepList({
  hasCustomDomain,
  hasServices,
  hasWebsite,
  hasTiming,
  nextStep,
  onNavigate,
}: OnboardingStepListProps) {
  const navigate = useNavigate();
  const flags = { hasCustomDomain, hasServices, hasWebsite, hasTiming };

  const go = (route: string) => {
    if (onNavigate) onNavigate(route);
    else navigate(route);
  };

  const statusFor = (id: OnboardingStepId) => {
    if (stepCompletion(id, flags)) return "done";
    if (nextStep === id) return "current";
    if (stepLocked(id, flags)) return "locked";
    return "pending";
  };

  return (
    <ol className="space-y-3">
      {ONBOARDING_STEPS.map((step) => {
        const status = statusFor(step.id);
        const Icon = step.icon;
        const isDone = status === "done";
        const isCurrent = status === "current";
        const hint = status === "locked" ? lockedHint(step.id, flags) : null;

        return (
          <li
            key={step.id}
            className={cn(
              "flex gap-4 rounded-2xl border p-4 transition-colors",
              isDone && "border-emerald-200 bg-emerald-50/60",
              isCurrent && "border-blue-200 bg-blue-50/50 shadow-sm",
              status === "locked" && "border-stone-100 bg-stone-50/80 opacity-80",
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                isDone && "bg-emerald-100 text-emerald-700",
                isCurrent && "bg-blue-50 text-blue-600",
                status === "locked" && "bg-stone-100 text-stone-400",
              )}
            >
              {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Step {step.stepNumber}
                </span>
                {isDone && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Done
                  </span>
                )}
                {isCurrent && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                    Up next
                  </span>
                )}
              </div>
              <h3 className={cn("mt-0.5 font-semibold text-appointza-navy", isDone && "text-emerald-800")}>
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-stone-600">{step.description}</p>
              {isCurrent && (
                <Button
                  type="button"
                  size="sm"
                  className={cn(org.btnPrimary, "mt-3 min-h-9")}
                  onClick={() => go(onboardingStepRoute(step.id))}
                >
                  {step.actionLabel}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              )}
              {hint ? <p className="mt-2 text-xs text-stone-500">{hint}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

type OnboardingSetupScreenProps = OnboardingFlags & {
  nextStep: OnboardingStepId | null;
};

/** Full-screen guide when user tries to open dashboard before setup is done. */
export function OnboardingSetupScreen({
  hasCustomDomain,
  hasServices,
  hasWebsite,
  hasTiming,
  nextStep,
}: OnboardingSetupScreenProps) {
  const navigate = useNavigate();
  const { currentStep } = getOnboardingProgress({
    hasCustomDomain,
    hasServices,
    hasWebsite,
    hasTiming,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-appointza-cream p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-stone-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-appointza-navy">Welcome — let&apos;s set up your business</h1>
            <p className="mt-1 text-sm text-stone-600">
              Four quick steps and you&apos;re ready to take bookings. Follow the guide below — we&apos;ll tell you
              exactly what to do next.
            </p>
          </div>
        </div>

        <OnboardingProgressBar
          hasCustomDomain={hasCustomDomain}
          hasServices={hasServices}
          hasWebsite={hasWebsite}
          hasTiming={hasTiming}
          className="mb-6"
        />

        <OnboardingStepList
          hasCustomDomain={hasCustomDomain}
          hasServices={hasServices}
          hasWebsite={hasWebsite}
          hasTiming={hasTiming}
          nextStep={nextStep}
        />

        {currentStep && (
          <Button
            type="button"
            className={cn(org.btnPrimary, "mt-6 min-h-11 w-full")}
            onClick={() => navigate(ORGANIZATION_ONBOARDING_WIZARD_ROUTE)}
          >
            Continue setup
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

type OnboardingBannerProps = OnboardingFlags & {
  nextStep: OnboardingStepId | null;
};

/** Compact strip shown at top of org pages while setup is in progress. */
export function OnboardingBanner({
  hasCustomDomain,
  hasServices,
  hasWebsite,
  hasTiming,
  nextStep,
}: OnboardingBannerProps) {
  const navigate = useNavigate();
  const { currentStep, completedCount, totalSteps } = getOnboardingProgress({
    hasCustomDomain,
    hasServices,
    hasWebsite,
    hasTiming,
  });
  if (!currentStep || !nextStep) return null;

  return (
    <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
              Setup guide
            </span>
            <span className="text-xs text-stone-500">
              {completedCount} of {totalSteps} steps done
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-appointza-navy">Next: {currentStep.title}</p>
            <p className="mt-0.5 text-sm text-stone-600">{currentStep.description}</p>
          </div>
          <OnboardingProgressBar
            hasCustomDomain={hasCustomDomain}
            hasServices={hasServices}
            hasWebsite={hasWebsite}
            hasTiming={hasTiming}
          />
        </div>
        <Button
          type="button"
          className={cn(org.btnPrimary, "min-h-11 shrink-0 touch-manipulation")}
          onClick={() => navigate(onboardingStepRoute(currentStep.id))}
        >
          {currentStep.actionLabel}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function isOnboardingStepComplete(stepId: OnboardingStepId, flags: OnboardingFlags): boolean {
  if (stepId === "customDomain") return flags.hasCustomDomain;
  if (stepId === "services") return flags.hasServices;
  if (stepId === "website") return flags.hasWebsite;
  if (stepId === "timing") return flags.hasTiming;
  return false;
}

type OnboardingPageGuideProps = OnboardingFlags & {
  stepId: OnboardingStepId;
  /** Slimmer layout when the page already has its own title */
  compact?: boolean;
  /** Used to open template builder directly from the website step */
  locationId?: number;
};

/** Contextual help at the top of onboarding step pages. */
export function OnboardingPageGuide({
  stepId,
  hasCustomDomain,
  hasServices,
  hasWebsite,
  hasTiming,
  compact = false,
  locationId,
}: OnboardingPageGuideProps) {
  const navigate = useNavigate();
  const step = ONBOARDING_STEPS.find((s) => s.id === stepId);
  if (!step) return null;

  const flags = { hasCustomDomain, hasServices, hasWebsite, hasTiming };
  const { completedCount, totalSteps, nextStep, percent, currentStep } = getOnboardingProgress(flags);
  if (!nextStep) return null;

  const stepIndex = ONBOARDING_STEPS.findIndex((s) => s.id === stepId);
  const isActiveStep = nextStep === stepId;
  const isStepComplete = isOnboardingStepComplete(stepId, flags);
  const showContinue =
    isStepComplete && nextStep !== stepId && currentStep != null;

  if (compact) {
    return (
      <div
        className={cn(
          "mb-5 rounded-2xl border px-4 py-3 sm:px-5",
          isActiveStep ? "border-blue-200 bg-blue-50/50" : "border-stone-100 bg-white",
        )}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
            Setup · step {step.stepNumber} of {totalSteps}
          </span>
          {isActiveStep ? <span className="text-xs text-stone-500">{percent}% complete</span> : null}
        </div>
        <OnboardingProgressBar {...flags} className="mb-2" />
        <p className="text-sm text-stone-600">
          {isActiveStep ? step.pageHint : isStepComplete ? `${step.title} — done` : step.pageHint}
        </p>
        {showContinue ? (
          <Button
            type="button"
            className={cn(org.btnPrimary, "mt-3 min-h-10 touch-manipulation")}
            onClick={() =>
              navigate(onboardingStepRoute(nextStep, locationId && locationId > 0 ? locationId : undefined))
            }
          >
            Continue — {currentStep.shortTitle}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-6 rounded-2xl border p-4 sm:p-5",
        isActiveStep ? "border-blue-200 bg-blue-50/50" : "border-stone-100 bg-white",
      )}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
          Setup guide
        </span>
        <span className="text-xs text-stone-500">
          {completedCount} of {totalSteps} steps done
        </span>
      </div>
      <OnboardingProgressBar {...flags} className="mb-4" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3 sm:block">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <step.icon className="h-5 w-5" />
          </div>
          <div className="sm:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Step {step.stepNumber} of {totalSteps}
            </p>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="hidden items-center gap-2 sm:flex">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Step {step.stepNumber} of {totalSteps}
            </p>
            {isActiveStep ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                <Circle className="h-2 w-2 fill-current" />
                You are here
              </span>
            ) : stepIndex < completedCount ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Completed
              </span>
            ) : null}
          </div>
          <h2 className="mt-1 text-lg font-semibold text-appointza-navy">{step.title}</h2>
          <p className="mt-1 text-sm text-stone-600">{step.pageHint}</p>
          {!isActiveStep && nextStep === "customDomain" && stepId !== "customDomain" && (
            <p className="mt-2 text-sm font-medium text-blue-600">
              Finish choosing your custom domain first, then come back here.
            </p>
          )}
          {!isActiveStep && nextStep === "services" && stepId === "timing" && (
            <p className="mt-2 text-sm font-medium text-blue-600">
              Finish adding a service first, then come back here.
            </p>
          )}
          {!isActiveStep && nextStep === "website" && stepId === "timing" && (
            <p className="mt-2 text-sm font-medium text-blue-600">
              Create your booking website first (step 3), then return here to set hours.
            </p>
          )}
          {isActiveStep && stepId === "website" && hasServices && hasCustomDomain && (
            <p className="mt-2 text-sm text-stone-500">
              After you save your page, the next step is setting your business hours.
            </p>
          )}
          {isActiveStep && stepId === "timing" && hasServices && hasCustomDomain && hasWebsite && (
            <p className="mt-2 text-sm text-stone-500">
              After saving your hours, your dashboard and booking page will unlock automatically.
            </p>
          )}
          {showContinue ? (
            <Button
              type="button"
              className={cn(org.btnPrimary, "mt-4 min-h-11 touch-manipulation")}
              onClick={() =>
                navigate(onboardingStepRoute(nextStep, locationId && locationId > 0 ? locationId : undefined))
              }
            >
              Continue — {currentStep.shortTitle}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
