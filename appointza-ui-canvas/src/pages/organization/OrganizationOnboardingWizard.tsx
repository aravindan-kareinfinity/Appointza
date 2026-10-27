import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { OrganisationOnboardingService } from "@/services/organisationOnboarding.service";
import { OrganisationService } from "@/services/organisation.service";
import { OrganisationSelectReq } from "@/models/organisation.model";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import {
  BUSINESS_LOCATION_PATH,
  BUSINESS_ONBOARDING_RETURN_PATH,
  businessOnboardingRouteForStep,
} from "@/utils/businessOnboarding.util";

/**
 * Hub entry for incomplete orgs. Screens 4–7 live on /register/* — this route
 * loads status and forwards to the matching screen. Draft orgs (Screen 1 only)
 * go to business profile first.
 */
const OrganizationOnboardingWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const organizationId = user?.organisationid ?? 0;
  const onboardingService = useMemo(() => new OrganisationOnboardingService(), []);
  const organisationService = useMemo(() => new OrganisationService(), []);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadAndRedirect = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      if (organizationId > 0) {
        const req = new OrganisationSelectReq();
        req.id = organizationId;
        const rows = await organisationService.select(req);
        const organisation = rows?.[0];
        const name = String(organisation?.name || "");
        const isDraft =
          !organisation ||
          Number(organisation.primarytype) <= 0 ||
          name.startsWith("Pending setup") ||
          String(organisation.notes || "") === "onboarding_draft";
        if (isDraft) {
          navigate(BUSINESS_ONBOARDING_RETURN_PATH, { replace: true });
          return;
        }

        // Profile done but no location yet → Screen 3.
        const locationId = Number(user?.locationid) || 0;
        if (locationId <= 0) {
          navigate(BUSINESS_LOCATION_PATH, { replace: true });
          return;
        }
      }

      const state = await onboardingService.getStatus();
      if (state.is_complete) {
        navigate("/organization/dashboard", { replace: true });
        return;
      }
      navigate(businessOnboardingRouteForStep(state.current_step), { replace: true });
    } catch (error: any) {
      setLoadError(
        error?.response?.data?.error || error?.message || "Could not load your setup progress.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [navigate, onboardingService, organisationService, organizationId, user?.locationid]);

  useEffect(() => {
    void loadAndRedirect();
  }, [loadAndRedirect]);

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <div className={cn(org.card, "space-y-4 p-6 text-center")}>
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <div>
            <h1 className="text-lg font-semibold text-appointza-navy">We couldn&apos;t load your setup</h1>
            <p className="mt-1 text-sm text-stone-600">{loadError}</p>
          </div>
          <Button type="button" className={org.btnPrimary} onClick={() => void loadAndRedirect()}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-2 text-[13px] text-[#6b7280]">
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Continuing setup…
    </div>
  );
};

export default OrganizationOnboardingWizard;
