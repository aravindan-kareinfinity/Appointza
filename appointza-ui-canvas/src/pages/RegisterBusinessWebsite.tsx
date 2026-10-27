import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { RegisterOnboardingFormFrame } from "@/components/layout/RegisterOnboardingFormFrame";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganisation } from "@/hooks/useOrganisation";
import { useOrganisationLocations } from "@/hooks/useOrganisationLocations";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { OrganisationOnboardingService } from "@/services/organisationOnboarding.service";
import {
  BUSINESS_DOMAIN_PATH,
  BUSINESS_LOCATION_PATH,
  isPendingBusinessOnboarding,
  setBusinessOnboardingStep,
} from "@/utils/businessOnboarding.util";
import { buildTemplateBuilderPath } from "@/utils/organizationOnboarding.util";
import { normalizeCustomUrlSlug, toSlug } from "@/utils/slug.util";
import {
  invalidatePublicSiteCacheForLocation,
  markPublicSiteSubdomainStale,
} from "@/utils/publicSiteCache.util";
import { USER_POST_LOGIN_PATH } from "@/utils/postAuthNavigation";

/**
 * Screen 6 router — no form UI. Sends the user straight to the template builder
 * for their primary location (website creation).
 */
const RegisterBusinessWebsite = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const organizationId = user?.organisationid ?? 0;
  const locationService = useMemo(() => new OrganisationLocationService(), []);
  const onboardingService = useMemo(() => new OrganisationOnboardingService(), []);
  const [error, setError] = useState("");

  const { data: organisation } = useOrganisation({
    organisationId: organizationId,
    enabled: organizationId > 0,
  });
  const { data: locationsData, isLoading: locationsLoading } = useOrganisationLocations({
    organisationId: organizationId,
    enabled: isAuthenticated && organizationId > 0,
  });

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
    if (locationsLoading) return;

    let cancelled = false;

    const routeToBuilder = async () => {
      try {
        const status = await onboardingService.getStatus();
        if (cancelled) return;

        if (status.is_complete) {
          navigate("/organization/dashboard", { replace: true });
          return;
        }

        // Sidebar "Website" (or Continue) should always open the edit/builder screen.
        const location = locationsData?.[0] ?? null;
        if (!location?.id) {
          navigate(BUSINESS_LOCATION_PATH, { replace: true });
          return;
        }

        // Prefer existing subdomain; otherwise derive from organisation name.
        let slug = normalizeCustomUrlSlug(location.customurl);
        if (!slug && organisation?.organisationname) {
          slug = toSlug(organisation.organisationname);
        }
        if (slug && slug !== normalizeCustomUrlSlug(location.customurl)) {
          try {
            await locationService.save({ ...location, customurl: slug });
            invalidatePublicSiteCacheForLocation(location.id);
            markPublicSiteSubdomainStale(slug);
          } catch {
            // Still open the builder even if subdomain save fails.
          }
        }

        setBusinessOnboardingStep("website");
        const templateId =
          location.templateid && location.templateid > 0 ? location.templateid : undefined;
        const builderPath = buildTemplateBuilderPath(location.id, templateId);
        const sep = builderPath.includes("?") ? "&" : "?";
        navigate(
          `${builderPath}${sep}onboarding=1&return=${encodeURIComponent(BUSINESS_DOMAIN_PATH)}`,
          { replace: true },
        );
      } catch (err: any) {
        if (cancelled) return;
        const message =
          err?.response?.data?.error || err?.message || "Could not open website builder.";
        setError(message);
        toast({
          title: "Could not open website builder",
          description: message,
          variant: "destructive",
        });
      }
    };

    void routeToBuilder();
    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    organizationId,
    locationsLoading,
    locationsData,
    organisation?.organisationname,
    navigate,
    onboardingService,
    locationService,
    toast,
  ]);

  return (
    <RegisterOnboardingFormFrame maxWidthClassName="max-w-md">
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#528ff0]" />
        <p className="text-[14px] text-[#667085]">
          {error ? error : "Opening website builder…"}
        </p>
      </div>
    </RegisterOnboardingFormFrame>
  );
};

export default RegisterBusinessWebsite;
