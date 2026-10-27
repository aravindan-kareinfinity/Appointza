import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { OrganisationOnboardingService } from "@/services/organisationOnboarding.service";
import type { OnboardingOfferingKey } from "@/models/organisationOnboarding.model";
import {
  BUSINESS_CREATE_PATH,
  clearRegisterCreateReturn,
  isRegisterCreateFlow,
  readRegisterCreateOffering,
  readRegisterCreateReturn,
} from "@/utils/businessOnboarding.util";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

type RegisterCreateSkipButtonProps = {
  /** Used when session stash has no offering key. */
  fallbackOffering?: OnboardingOfferingKey;
  className?: string;
  label?: string;
};

/**
 * Screen 5 create flow: skip the current offering and return to /register/create
 * so the router can open the next item or website.
 */
export function RegisterCreateSkipButton({
  fallbackOffering = "services",
  className,
  label = "Skip for now",
}: RegisterCreateSkipButtonProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!isRegisterCreateFlow()) return null;

  const handleSkip = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const onboardingService = new OrganisationOnboardingService();
      const stashed = readRegisterCreateOffering();
      let offering = (stashed as OnboardingOfferingKey | null) || null;
      if (!offering) {
        const status = await onboardingService.getStatus();
        offering = status.next_create_offering || fallbackOffering;
      }
      await onboardingService.markOffering(offering, "skipped");
      const returnTo = readRegisterCreateReturn() || BUSINESS_CREATE_PATH;
      clearRegisterCreateReturn();
      navigate(returnTo, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data
          ?.error ||
        (err as Error)?.message ||
        "Please try again.";
      toast({
        title: "Could not skip",
        description: message,
        variant: "destructive",
      });
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      disabled={busy}
      onClick={() => void handleSkip()}
      className={cn(org.btnOutline, "h-8", className)}
    >
      {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
      {label}
    </Button>
  );
}
