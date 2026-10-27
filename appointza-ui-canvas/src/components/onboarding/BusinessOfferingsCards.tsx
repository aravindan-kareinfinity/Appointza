import { BedDouble, CalendarCheck, CalendarDays, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingOfferingKey } from "@/models/organisationOnboarding.model";

export type BusinessOfferingOption = {
  key: OnboardingOfferingKey;
  title: string;
  description: string;
  icon: typeof BedDouble;
};

export const BUSINESS_OFFERING_OPTIONS: BusinessOfferingOption[] = [
  {
    key: "stay",
    title: "Stay & Accommodation",
    description: "Hotels, resorts, hostels and homestays",
    icon: BedDouble,
  },
  {
    key: "services",
    title: "Services & Appointments",
    description: "Salons, spas, clinics and fitness centers",
    icon: CalendarCheck,
  },
  {
    key: "events",
    title: "Events & Registrations",
    description: "College events, workshops, tournaments and camps",
    icon: CalendarDays,
  },
];

/** Display labels for all known offering keys (includes hidden options for older orgs). */
export const BUSINESS_OFFERING_LABELS: Record<OnboardingOfferingKey, string> = {
  stay: "Stay & Accommodation",
  services: "Services & Appointments",
  events: "Events & Registrations",
  facilities: "Facilities & Slot Booking",
  classes: "Classes & Courses",
  other: "Other Business",
};

const VISIBLE_OFFERING_KEYS = new Set(
  BUSINESS_OFFERING_OPTIONS.map((option) => option.key),
);

/** Keep only offerings currently shown on the What you offer screen. */
export function filterVisibleOfferings(
  keys: OnboardingOfferingKey[] | null | undefined,
): OnboardingOfferingKey[] {
  return (keys ?? []).filter((key) => VISIBLE_OFFERING_KEYS.has(key));
}

type BusinessOfferingsCardsProps = {
  selected: OnboardingOfferingKey[];
  onChange: (next: OnboardingOfferingKey[]) => void;
  disabled?: boolean;
  className?: string;
};

/** Multi-select cards for the business types an organisation offers. */
export function BusinessOfferingsCards({
  selected,
  onChange,
  disabled = false,
  className,
}: BusinessOfferingsCardsProps) {
  return (
    <div
      role="group"
      aria-label="What does your business offer?"
      className={cn("grid gap-3 sm:grid-cols-2", className)}
    >
      {BUSINESS_OFFERING_OPTIONS.map((option) => {
        const isSelected = selected.includes(option.key);
        const Icon = option.icon;
        return (
          <button
            key={option.key}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() =>
              onChange(
                isSelected
                  ? selected.filter((key) => key !== option.key)
                  : [...selected, option.key],
              )
            }
            className={cn(
              "relative flex min-h-[120px] touch-manipulation flex-col items-start gap-3 rounded-lg border bg-white p-4 text-left shadow-none transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#528ff0]/30",
              "disabled:cursor-not-allowed disabled:opacity-60",
              isSelected
                ? "border-[#528ff0] bg-[#eef4ff]"
                : "border-[#dbe4f0] hover:border-[#528ff0]/50 hover:bg-[#f5f9ff]",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md",
                isSelected ? "bg-[#528ff0] text-white" : "bg-[#e0efff] text-[#528ff0]",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 pr-6">
              <span className="block text-[14px] font-semibold text-[#1a1a1a]">{option.title}</span>
              <span className="mt-1 block text-[12px] leading-snug text-[#667085]">
                {option.description}
              </span>
            </span>
            {isSelected ? (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#528ff0] text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            ) : (
              <span className="absolute right-3 top-3 h-5 w-5 rounded-full border border-[#dbe4f0] bg-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}
