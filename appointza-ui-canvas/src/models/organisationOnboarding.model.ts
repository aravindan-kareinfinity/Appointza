export type OnboardingOfferingKey =
  | "stay"
  | "services"
  | "events"
  | "facilities"
  | "classes"
  | "other";

export const ONBOARDING_OFFERING_KEYS: OnboardingOfferingKey[] = [
  "stay",
  "services",
  "events",
  "facilities",
  "classes",
  "other",
];

export type OnboardingWizardStep =
  | "offerings"
  | "create_items"
  | "website"
  | "timing"
  | "complete";

export type OnboardingMarkAction = "configured" | "skipped";

export class OrganisationOnboardingDerived {
  has_location: boolean = false;
  has_custom_domain: boolean = false;
  has_website: boolean = false;
  has_timing: boolean = false;
  has_services: boolean = false;
  has_events: boolean = false;
  has_rooms: boolean = false;
  has_facilities: boolean = false;
  primary_location_customurl?: string | null = null;
  primary_location_id: number = 0;
}

export class OrganisationOnboardingState {
  organisation_id: number = 0;
  current_step: OnboardingWizardStep = "offerings";
  selected_offerings: OnboardingOfferingKey[] = [];
  configured_offerings: OnboardingOfferingKey[] = [];
  skipped_offerings: OnboardingOfferingKey[] = [];
  profile_complete: boolean = false;
  location_complete: boolean = false;
  website_skipped: boolean = false;
  is_complete: boolean = false;
  completed_at?: string | null = null;
  derived: OrganisationOnboardingDerived = new OrganisationOnboardingDerived();
  next_create_offering?: OnboardingOfferingKey | null = null;
  notes: string[] = [];
}

export class OrganisationOnboardingSaveReq {
  current_step?: OnboardingWizardStep;
  selected_offerings?: OnboardingOfferingKey[];
  configured_offerings?: OnboardingOfferingKey[];
  skipped_offerings?: OnboardingOfferingKey[];
  profile_complete?: boolean;
  location_complete?: boolean;
  website_skipped?: boolean;
  is_complete?: boolean;
}

export class OrganisationOnboardingMarkOfferingReq {
  offering: OnboardingOfferingKey = "services";
  action: OnboardingMarkAction = "configured";
}

export class OrganisationReferralVerifyReq {
  referral_code: string = "";
}

export class OrganisationReferralVerifyRes {
  valid: boolean = false;
  message: string = "";
  normalized_code?: string = "";
}
