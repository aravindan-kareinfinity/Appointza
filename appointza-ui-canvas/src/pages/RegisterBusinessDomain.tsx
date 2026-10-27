import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisterOnboardingFormFrame } from "@/components/layout/RegisterOnboardingFormFrame";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useOrganisation } from "@/hooks/useOrganisation";
import { useOrganisationLocations } from "@/hooks/useOrganisationLocations";
import { OrganisationLocation } from "@/models/organisationlocation.model";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import {
  BUSINESS_LOCATION_PATH,
  BUSINESS_ONBOARDING_TOTAL_STEPS,
  BUSINESS_TIMING_PATH,
  isPendingBusinessOnboarding,
  setBusinessOnboardingStep,
} from "@/utils/businessOnboarding.util";
import { buildOrganisationCustomUrlHost } from "@/utils/orgPublicSiteUrl.util";
import { getDomainName } from "@/utils/environment";
import { normalizeCustomUrlSlug, toSlug } from "@/utils/slug.util";
import {
  invalidatePublicSiteCacheForLocation,
  markPublicSiteSubdomainStale,
} from "@/utils/publicSiteCache.util";
import { USER_POST_LOGIN_PATH } from "@/utils/postAuthNavigation";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 min-h-11 rounded-md border-[#dbe4f0] bg-white text-[14px] shadow-none placeholder:text-[#98a2b3] focus-visible:border-[#528ff0] focus-visible:ring-[#528ff0]/20";

const continueBtnClass =
  "h-12 min-h-12 w-full touch-manipulation rounded-md border border-[#528ff0] bg-[#528ff0] text-[15px] font-semibold text-white shadow-none hover:bg-[#3d7ae8] disabled:opacity-50 disabled:hover:bg-[#528ff0]";

/** Screen 7 of 8 — choose public booking subdomain after website. */
const RegisterBusinessDomain = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { refetch: refetchOnboarding } = useOnboardingStatus();
  const organizationId = user?.organisationid ?? 0;
  const locationService = useMemo(() => new OrganisationLocationService(), []);

  const { data: organisation } = useOrganisation({
    organisationId: organizationId,
    enabled: organizationId > 0,
  });
  const { data: locationsData, isLoading: locationsLoading } = useOrganisationLocations({
    organisationId: organizationId,
    enabled: isAuthenticated && organizationId > 0,
  });

  const [location, setLocation] = useState<OrganisationLocation | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [saving, setSaving] = useState(false);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const domainSuffix = getDomainName();
  const previewHost = buildOrganisationCustomUrlHost({ customUrl: customUrlInput });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/register?type=business", { replace: true });
      return;
    }
    if (!organizationId) {
      navigate(isPendingBusinessOnboarding() ? "/register/business" : USER_POST_LOGIN_PATH, {
        replace: true,
      });
    }
  }, [isAuthenticated, organizationId, navigate]);

  useEffect(() => {
    if (locationsLoading) return;
    const primary = locationsData?.[0] ?? null;
    if (!primary?.id) {
      navigate(BUSINESS_LOCATION_PATH, { replace: true });
      return;
    }
    setLocation(primary);
    const existing = normalizeCustomUrlSlug(primary.customurl);
    const suggested =
      existing ||
      toSlug(organisation?.organisationname || "") ||
      "";
    setCustomUrlInput(suggested);
  }, [locationsLoading, locationsData, organisation?.organisationname, navigate]);

  const handleSlugChange = useCallback(
    (value: string) => {
      const slug = normalizeCustomUrlSlug(value);
      setCustomUrlInput(slug);
      setIsSlugAvailable(null);
      setAvailabilityMessage("");

      if (checkTimerRef.current) {
        clearTimeout(checkTimerRef.current);
      }

      if (!slug) {
        setIsCheckingSlug(false);
        return;
      }

      setIsCheckingSlug(true);
      checkTimerRef.current = setTimeout(async () => {
        try {
          const result = await locationService.checkCustomUrlAvailability(slug, location?.id);
          setIsSlugAvailable(result?.available ?? false);
          setAvailabilityMessage(result?.message ?? "");
          if (result?.normalized_slug && result.normalized_slug !== slug) {
            setCustomUrlInput(result.normalized_slug);
          }
        } catch {
          setIsSlugAvailable(null);
          setAvailabilityMessage("Could not verify availability. Try again.");
        } finally {
          setIsCheckingSlug(false);
        }
      }, 450);
    },
    [location?.id, locationService],
  );

  useEffect(() => {
    if (!customUrlInput || !location?.id) return;
    handleSlugChange(customUrlInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- check once when location + suggested slug load
  }, [location?.id]);

  useEffect(() => {
    return () => {
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    };
  }, []);

  const handleContinue = async () => {
    const slug = normalizeCustomUrlSlug(customUrlInput);
    if (!slug) {
      toast({
        title: "Choose a domain name",
        description: "Enter a short name for your public booking page.",
        variant: "destructive",
      });
      return;
    }
    if (isCheckingSlug) {
      toast({
        title: "Checking availability",
        description: "Please wait while we verify this name.",
      });
      return;
    }
    if (isSlugAvailable === false) {
      toast({
        title: "Name unavailable",
        description: availabilityMessage || "This domain name is already taken.",
        variant: "destructive",
      });
      return;
    }
    if (!location?.id) {
      navigate(BUSINESS_LOCATION_PATH, { replace: true });
      return;
    }

    setSaving(true);
    try {
      await locationService.save({ ...location, customurl: slug });
      invalidatePublicSiteCacheForLocation(location.id);
      markPublicSiteSubdomainStale(slug);
      setBusinessOnboardingStep("timing");
      await queryClient.invalidateQueries({ queryKey: ["organisation-locations"] });
      await refetchOnboarding();
      toast({
        title: "Domain saved",
        description: `Your site will be at ${previewHost}. Next: set opening hours.`,
      });
      navigate(BUSINESS_TIMING_PATH, { replace: true });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data
          ?.error ||
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not save your domain name. Try a different one.";
      toast({
        title: "Save failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || locationsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#528ff0]" />
      </div>
    );
  }

  return (
    <RegisterOnboardingFormFrame>
      <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#528ff0]">
        Step 7 of {BUSINESS_ONBOARDING_TOTAL_STEPS}
      </p>
      <h1 className="mb-2 text-[22px] font-semibold leading-snug tracking-tight text-[#1a1a1a]">
        Choose your domain name
      </h1>
      <p className="mb-6 text-[14px] leading-relaxed text-[#667085]">
        This is the public address customers use to find and book with you.
      </p>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-[#6b7280]">Domain name *</Label>
          <div className="flex w-full overflow-hidden rounded-md border border-[#dbe4f0] bg-white focus-within:ring-2 focus-within:ring-[#528ff0]/20">
            <Input
              value={customUrlInput}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="e.g. mysalon"
              className={cn(fieldClass, "min-w-0 flex-1 border-0 focus-visible:ring-0")}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="flex max-w-[50%] shrink-0 items-center border-l border-[#dbe4f0] bg-[#f5f7f9] px-3 text-[13px] text-[#667085] sm:max-w-none">
              .{domainSuffix}
            </span>
          </div>
          <p className="text-[11px] text-[#98a2b3]">
            Lowercase letters, numbers, and hyphens only.
          </p>
          {customUrlInput ? (
            <div className="flex items-center gap-2 text-[13px]">
              {isCheckingSlug ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#98a2b3]" />
                  <span className="text-[#667085]">Checking availability…</span>
                </>
              ) : isSlugAvailable === true ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">{availabilityMessage || "Available"}</span>
                </>
              ) : isSlugAvailable === false ? (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-700">{availabilityMessage || "Already taken"}</span>
                </>
              ) : availabilityMessage ? (
                <span className="text-[#667085]">{availabilityMessage}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        {previewHost ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              Your public URL
            </p>
            <p className="mt-1 break-all font-mono text-[13px] text-emerald-900">{previewHost}</p>
          </div>
        ) : null}

        <Button
          type="button"
          className={continueBtnClass}
          disabled={
            saving ||
            isCheckingSlug ||
            !location?.id ||
            !customUrlInput.trim() ||
            isSlugAvailable === false
          }
          onClick={() => void handleContinue()}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save domain & continue"
          )}
        </Button>
      </div>
    </RegisterOnboardingFormFrame>
  );
};

export default RegisterBusinessDomain;
