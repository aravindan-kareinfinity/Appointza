import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { RegisterOnboardingFormFrame } from "@/components/layout/RegisterOnboardingFormFrame";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { OrganisationOnboardingService } from "@/services/organisationOnboarding.service";
import {
  BUSINESS_CREATE_PATH,
  BUSINESS_WEBSITE_PATH,
  businessOnboardingRouteForStep,
  isPendingBusinessOnboarding,
  setBusinessOnboardingStep,
  stashRegisterCreateReturn,
} from "@/utils/businessOnboarding.util";
import { onboardingOfferingCreateRoute } from "@/utils/organizationOnboarding.util";
import { USER_POST_LOGIN_PATH } from "@/utils/postAuthNavigation";

/**
 * Screen 5 router — no hub UI. Opens the normal org create screens
 * (e.g. /organization/services?kind=services) with return stashed in sessionStorage.
 */
const RegisterBusinessCreateItems = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const onboardingService = useMemo(() => new OrganisationOnboardingService(), []);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/register?type=business", { replace: true });
      return;
    }
    if (!user?.organisationid) {
      navigate(isPendingBusinessOnboarding() ? "/register/business" : USER_POST_LOGIN_PATH, {
        replace: true,
      });
      return;
    }

    let cancelled = false;

    const openCreateRoute = (route: string, offering?: string) => {
      stashRegisterCreateReturn(BUSINESS_CREATE_PATH, offering);
      navigate(route, { replace: true });
    };

    const routeNext = async () => {
      try {
        let state = await onboardingService.getStatus();
        if (cancelled) return;

        if (state.is_complete) {
          navigate("/organization/dashboard", { replace: true });
          return;
        }

        // Already past create_items — honor wizard step.
        if (state.current_step !== "create_items") {
          navigate(businessOnboardingRouteForStep(state.current_step), { replace: true });
          return;
        }

        // Skip "other" (no dedicated create screen) and keep resolving.
        let guard = 0;
        while (state.next_create_offering === "other" && guard < 3) {
          guard += 1;
          state = await onboardingService.markOffering("other", "skipped");
          if (cancelled) return;
        }

        const next = state.next_create_offering;
        if (!next) {
          setBusinessOnboardingStep("website");
          navigate(BUSINESS_WEBSITE_PATH, { replace: true });
          return;
        }

        const createRoute = onboardingOfferingCreateRoute(next);
        if (!createRoute) {
          state = await onboardingService.markOffering(next, "skipped");
          if (cancelled) return;
          if (!state.next_create_offering) {
            setBusinessOnboardingStep("website");
            navigate(BUSINESS_WEBSITE_PATH, { replace: true });
            return;
          }
          const retry = onboardingOfferingCreateRoute(state.next_create_offering);
          if (!retry) {
            setBusinessOnboardingStep("website");
            navigate(BUSINESS_WEBSITE_PATH, { replace: true });
            return;
          }
          openCreateRoute(retry, state.next_create_offering || undefined);
          return;
        }

        setBusinessOnboardingStep("create_items");
        openCreateRoute(createRoute, next);
      } catch (err: any) {
        if (cancelled) return;
        const message =
          err?.response?.data?.error || err?.message || "Could not continue setup.";
        setError(message);
        toast({
          title: "Could not open create screen",
          description: message,
          variant: "destructive",
        });
      }
    };

    void routeNext();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.organisationid, navigate, onboardingService, toast]);

  return (
    <RegisterOnboardingFormFrame maxWidthClassName="max-w-md">
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#528ff0]" />
        <p className="text-[14px] text-[#667085]">
          {error ? error : "Opening your create screen…"}
        </p>
      </div>
    </RegisterOnboardingFormFrame>
  );
};

export default RegisterBusinessCreateItems;
