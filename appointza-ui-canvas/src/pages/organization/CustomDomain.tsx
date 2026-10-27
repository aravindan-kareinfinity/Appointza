import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Globe, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { OnboardingPageGuide } from "@/components/onboarding/OrganizationOnboarding";
import { useOrganisationLocations } from "@/hooks/useOrganisationLocations";
import { OrganisationLocation } from "@/models/organisationlocation.model";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { buildOrganisationCustomUrlHost } from "@/utils/orgPublicSiteUrl.util";
import { getDomainName } from "@/utils/environment";
import { normalizeCustomUrlSlug } from "@/utils/slug.util";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";
import {
  invalidatePublicSiteCacheForLocation,
  markPublicSiteSubdomainStale,
} from "@/utils/publicSiteCache.util";

const CustomDomainScreen = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const organizationId = user?.organisationid || 0;
  const { hasCustomDomain, hasServices, hasWebsite, hasTiming, isComplete } = useOnboardingStatus();

  const locationService = useMemo(() => new OrganisationLocationService(), []);

  const { data: locationsData, isLoading } = useOrganisationLocations({
    organisationId: organizationId,
    enabled: isAuthenticated,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [location, setLocation] = useState<OrganisationLocation | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const domainSuffix = getDomainName();
  const previewHost = buildOrganisationCustomUrlHost({ customUrl: customUrlInput });

  const fetchLocation = useCallback(() => {
    const primary = locationsData?.[0] ?? null;
    setLocation(primary);
    setCustomUrlInput(normalizeCustomUrlSlug(primary?.customurl) || "");
  }, [locationsData]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    if (isLoading || !customUrlInput.trim() || !location?.id) return;
    handleSlugChange(customUrlInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when location slug is loaded
  }, [isLoading, location?.id]);

  const handleSlugChange = (value: string) => {
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
        const result = await locationService.checkCustomUrlAvailability(
          slug,
          location?.id,
        );
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
  };

  useEffect(() => {
    return () => {
      if (checkTimerRef.current) {
        clearTimeout(checkTimerRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    const slug = normalizeCustomUrlSlug(customUrlInput);
    if (!slug) {
      toast({
        title: "Choose a subdomain",
        description: "Enter a short name for your public booking page.",
        variant: "destructive",
      });
      return;
    }

    if (isCheckingSlug) {
      toast({
        title: "Checking availability",
        description: "Please wait while we verify this subdomain.",
      });
      return;
    }

    if (isSlugAvailable === false) {
      toast({
        title: "Subdomain unavailable",
        description: availabilityMessage || "This name is already taken.",
        variant: "destructive",
      });
      return;
    }

    if (!location?.id) {
      toast({
        title: "Location required",
        description: "Add a business location first, then set your custom domain.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const locationToSave: OrganisationLocation = {
        ...location,
        customurl: slug,
      };
      await locationService.save(locationToSave);
      invalidatePublicSiteCacheForLocation(location.id);
      markPublicSiteSubdomainStale(slug);
      await queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
      await queryClient.invalidateQueries({ queryKey: ["organisation-locations"] });

      toast({
        title: "Custom domain saved",
        description: `Your site will be available at ${previewHost}`,
      });

      if (!isComplete) {
        navigate("/register/website", { replace: true });
      }
    } catch (error: unknown) {
      console.error("Failed to save custom domain:", error);
      const message =
        (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data
          ?.error ||
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not save your custom domain. Try a different name.";
      toast({
        title: "Save failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-2rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-stone-600">Loading…</span>
      </div>
    );
  }

  return (
    <div className="org-page flex min-h-[calc(100dvh-2rem)] w-full flex-col">
      {!hasCustomDomain ? (
        <div className="org-page-section pb-0 pt-2 sm:pt-4">
          <OnboardingPageGuide
            compact
            stepId="customDomain"
            hasCustomDomain={hasCustomDomain}
            hasServices={hasServices}
            hasWebsite={hasWebsite}
            hasTiming={hasTiming}
          />
        </div>
      ) : null}

      <div className="org-panel-section flex flex-1 flex-col pb-8 pt-4 sm:pt-6">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <h1 className="org-title text-xl sm:text-2xl">Your public booking URL</h1>
              <p className="org-description mt-1">
                Customers will visit this address to book with you.
              </p>
            </div>
          </div>

          <div className={cn(org.card, "w-full space-y-5 rounded-3xl border-stone-100 p-5 sm:p-8")}>
            <div className="space-y-2">
              <Label htmlFor="custom-domain-slug">Subdomain name</Label>
              <div className="flex w-full overflow-hidden rounded-xl border border-stone-200 bg-white focus-within:ring-2 focus-within:ring-blue-500/30">
                <Input
                  id="custom-domain-slug"
                  value={customUrlInput}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="e.g. mysalon"
                  className="min-w-0 flex-1 border-0 shadow-none focus-visible:ring-0"
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className="flex max-w-[55%] shrink-0 items-center border-l border-stone-200 bg-stone-50 px-3 text-sm text-stone-500 sm:max-w-none">
                  .{domainSuffix}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Use lowercase letters, numbers, and hyphens only. No spaces.
              </p>
              {customUrlInput ? (
                <div className="flex items-center gap-2 text-sm">
                  {isCheckingSlug ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                      <span className="text-stone-500">Checking availability…</span>
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
                    <span className="text-stone-500">{availabilityMessage}</span>
                  ) : null}
                </div>
              ) : null}
            </div>

            {previewHost ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Your public URL
                </p>
                <p className="mt-1 break-all font-mono text-sm text-emerald-900">{previewHost}</p>
              </div>
            ) : null}

            {!location?.id ? (
              <p className="text-sm text-amber-700">
                No location found for your account. Complete registration with a business address, or
                add a location under Profile → Locations first.
              </p>
            ) : null}

            <Button
              type="button"
              className={cn(org.btnPrimary, "min-h-11 w-full sm:w-auto")}
              onClick={handleSave}
              disabled={
                isSaving ||
                isCheckingSlug ||
                !location?.id ||
                !customUrlInput.trim() ||
                isSlugAvailable === false
              }
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : hasCustomDomain ? (
                "Save changes"
              ) : (
                <>
                  Save &amp; continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDomainScreen;
