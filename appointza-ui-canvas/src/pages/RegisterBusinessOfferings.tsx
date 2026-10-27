import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import {
  BusinessOfferingsCards,
  filterVisibleOfferings,
} from "@/components/onboarding/BusinessOfferingsCards";
import { OrganisationOnboardingService } from "@/services/organisationOnboarding.service";
import type { OnboardingOfferingKey } from "@/models/organisationOnboarding.model";
import {
  BUSINESS_CREATE_PATH,
  BUSINESS_ONBOARDING_TOTAL_STEPS,
  isPendingBusinessOnboarding,
  setBusinessOnboardingStep,
} from "@/utils/businessOnboarding.util";
import { USER_POST_LOGIN_PATH } from "@/utils/postAuthNavigation";
import { RegisterOnboardingFormFrame } from "@/components/layout/RegisterOnboardingFormFrame";

const continueBtnClass =
  "h-12 min-h-12 w-full touch-manipulation rounded-md border border-[#528ff0] bg-[#528ff0] text-[15px] font-semibold text-white shadow-none hover:bg-[#3d7ae8] disabled:opacity-50 disabled:hover:bg-[#528ff0]";

/** Screen 4 of 7 — multi-select business offerings. Continues to create-item flows. */
const RegisterBusinessOfferings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { refetch: refetchOnboarding } = useOnboardingStatus();
  const onboardingService = useMemo(() => new OrganisationOnboardingService(), []);

  const [selected, setSelected] = useState<OnboardingOfferingKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadExisting = useCallback(async () => {
    setLoading(true);
    try {
      const status = await onboardingService.getStatus();
      if (status.is_complete) {
        navigate("/organization/dashboard", { replace: true });
        return;
      }
      // Always show the checkbox list when visiting this screen (sidebar or continue).
      // Prefill from prior selections so users can review/change them.
      setSelected(filterVisibleOfferings(status.selected_offerings));
      // Keep Setup sidebar in sync without a full page reload.
      await refetchOnboarding();
    } catch {
      setSelected([]);
    } finally {
      setLoading(false);
    }
  }, [navigate, onboardingService, refetchOnboarding]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/register?type=business", { replace: true });
      return;
    }
    if (!user?.organisationid) {
      if (isPendingBusinessOnboarding()) {
        navigate("/register/business", { replace: true });
      } else {
        navigate(USER_POST_LOGIN_PATH, { replace: true });
      }
      return;
    }
    void loadExisting();
  }, [isAuthenticated, user?.organisationid, navigate, loadExisting]);

  const onContinue = async () => {
    if (selected.length === 0) {
      toast({
        title: "Choose at least one offering",
        description: "Select everything that applies so we can customize Appointza for you.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await onboardingService.save({
        selected_offerings: filterVisibleOfferings(selected),
      });
      setBusinessOnboardingStep("create_items");
      toast({
        title: "Offerings saved",
        description: "Next: add your first bookable item.",
      });
      // Full reload so Setup sidebar + next create screen render with saved offerings
      // (same as a manual refresh on /register/offerings).
      window.location.assign(BUSINESS_CREATE_PATH);
    } catch (error: any) {
      toast({
        title: "Could not save offerings",
        description: error?.response?.data?.error || error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#528ff0]" />
      </div>
    );
  }

  const selectedCount = selected.length;

  return (
    <RegisterOnboardingFormFrame maxWidthClassName="max-w-2xl">
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#528ff0]">
            Step 4 of {BUSINESS_ONBOARDING_TOTAL_STEPS}
          </p>
          <h1 className="mb-2 text-[22px] font-semibold leading-snug tracking-tight text-[#1a1a1a]">
            What does your business offer?
          </h1>
          <p className="mb-6 text-[14px] leading-relaxed text-[#667085]">
            Select all that apply. We&apos;ll customize Appointza to suit your business.
          </p>

          <div className="space-y-5">
            <BusinessOfferingsCards
              selected={selected}
              onChange={setSelected}
              disabled={saving}
            />

            <p className="text-[13px] font-medium text-[#667085]" aria-live="polite">
              {selectedCount === 0 ? "None selected" : `${selectedCount} selected`}
            </p>

            <Button
              type="button"
              className={continueBtnClass}
              disabled={saving || selectedCount === 0}
              onClick={() => void onContinue()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue
            </Button>
          </div>
    </RegisterOnboardingFormFrame>
  );
};

export default RegisterBusinessOfferings;
