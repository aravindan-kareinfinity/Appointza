import { useState, useEffect, useCallback, useMemo, type MouseEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { OrganizationPageShell } from "@/components/layout/OrganizationPageShell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Template, TemplateType } from "@/models/TemplateModels";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Copy,
  Share2,
  ExternalLink,
  MapPin,
  CheckCircle,
  AlertCircle,
  Wand2,
  PencilLine,
  FileText,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ReferenceValueDeleteReq } from "@/models/referencevalue.model";
import { referenceValuesQueryKey } from "@/hooks/useReferenceValues";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { OrganisationLocation, UpdateLocationTemplateIdReq } from "@/models/organisationlocation.model";
import { ReferenceValue } from "@/models/referencevalue.model";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganisationLocations, organisationLocationsQueryKey } from "@/hooks/useOrganisationLocations";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { OnboardingPageGuide } from "@/components/onboarding/OrganizationOnboarding";
import {
  buildTemplateBuilderPath,
  ORG_WEBSITE_TEMPLATE_MAX_PER_ORG,
  ORG_WEBSITE_TEMPLATE_REFERENCE_TYPE_ID,
} from "@/utils/organizationOnboarding.util";
import { ORG_TEMPLATE_ASSETS_IDENTIFIER } from "@/types/orgAssets.types";
import { useOrganisation } from "@/hooks/useOrganisation";
import { useReferenceValues } from "@/hooks/useReferenceValues";
import {
  buildOrganisationTemplateBookingUrl,
  buildOrganisationCustomUrlHost,
  buildOrganisationPublicSiteOriginFromHost,
} from "@/utils/orgPublicSiteUrl.util";
import { SiteDetailsService } from "@/services/siteDetails.service";
import { EventService } from "@/services/event.service";
import { SiteDetailsItem } from "@/models/sitedetail.model";
import { renderSiteTemplateHtml } from "@/utils/templateRenderer.util";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { invalidatePublicSiteCacheForLocation } from "@/utils/publicSiteCache.util";

const templatesSectionIconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600";

const OrganizationTemplates = ({ embedded = false }: { embedded?: boolean }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { isComplete, hasCustomDomain, hasServices, hasWebsite, hasTiming, nextStep } = useOnboardingStatus();
  const inOnboarding = !embedded && !isComplete && hasCustomDomain && hasServices;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Legacy ?view=booking — single screen now; drop the query param
  useEffect(() => {
    if (searchParams.get("tab") !== "templates" || !searchParams.get("view")) return;
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("view");
        return n;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | string>("");
  const [primaryColor, setPrimaryColor] = useState("#1AAFCC");
  const [secondaryColor, setSecondaryColor] = useState("#F04E98");
  const [showServices, setShowServices] = useState(true);
  const [showHours, setShowHours] = useState(true);
  const [showSpecializations, setShowSpecializations] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  
  // Location selection state
  const [locations, setLocations] = useState<OrganisationLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [existingTemplate, setExistingTemplate] = useState<ReferenceValue | null>(null);
  
  // Booking page URL (same location as template assignment)
  const [bookingUrl, setBookingUrl] = useState<string>('');
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [previewSiteData, setPreviewSiteData] = useState<SiteDetailsItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [templatePendingDelete, setTemplatePendingDelete] = useState<ReferenceValue | null>(null);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  // Get organization ID from user context
  const organizationId = useMemo(() => {
    return user?.organisationid || 0;
  }, [user]);

  const { data: cachedLocations = [], isFetching: isLocationsFetching } = useOrganisationLocations({
    organisationId: user?.organisationid || 0,
    staffLocationId: user?.locationid || 0,
    enabled: isAuthenticated,
  });

  const { data: templateReferenceValues = [], isFetching: isLoadingTemplates } = useReferenceValues({
    organisationId: organizationId,
    referencetypeid: ORG_WEBSITE_TEMPLATE_REFERENCE_TYPE_ID,
    enabled: isAuthenticated && organizationId > 0,
  });

  const { data: organisationDetails = null } = useOrganisation({
    organisationId: organizationId,
    enabled: isAuthenticated && organizationId > 0,
  });

  const fetchedTemplates = useMemo((): Template[] => {
    return templateReferenceValues
      .filter((refValue) => refValue.identifier !== ORG_TEMPLATE_ASSETS_IDENTIFIER)
      .map((refValue) => ({
        id: refValue.id.toString(),
        name: refValue.displaytext,
        description: refValue.notes || "",
        content: refValue.description || "",
        isactive: refValue.isactive,
        previewImage: "/placeholder.svg",
      }));
  }, [templateReferenceValues]);

  const availableTemplates = fetchedTemplates;

  const orgOwnedTemplates = useMemo(
    () =>
      templateReferenceValues.filter(
        (rv) =>
          rv.identifier !== ORG_TEMPLATE_ASSETS_IDENTIFIER &&
          Number(rv.organizationid) === Number(organizationId) &&
          organizationId > 0,
      ),
    [templateReferenceValues, organizationId],
  );

  const atTemplateLimit = orgOwnedTemplates.length >= ORG_WEBSITE_TEMPLATE_MAX_PER_ORG;

  const referenceValueService = useMemo(() => new ReferenceValueService(), []);

  // API services
  const locationService = useMemo(() => new OrganisationLocationService(), []);
  const siteDetailsService = useMemo(() => new SiteDetailsService(), []);
  const eventService = useMemo(() => new EventService(), []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (cachedLocations.length > 0) {
      setLocations(cachedLocations);
      setSelectedLocationId((prev) => prev ?? cachedLocations[0].id);
    } else {
      setLocations([]);
    }
  }, [cachedLocations, isAuthenticated]);

  useEffect(() => {
    if (fetchedTemplates.length > 0) {
      setSelectedTemplate((current) => current || (fetchedTemplates[0].id as TemplateType));
    }
  }, [fetchedTemplates]);

  const renderTemplatePreviewHtml = useCallback(
    (templateContent: string) => {
      if (!templateContent?.includes("<!DOCTYPE html")) {
        return templateContent;
      }
      if (!previewSiteData) {
        return templateContent;
      }
      return renderSiteTemplateHtml(templateContent, previewSiteData);
    },
    [previewSiteData],
  );

  const syncExistingTemplateForLocation = useCallback(
    (locationId: number) => {
      const selectedLocation = locations.find((loc) => loc.id === locationId);
      if (!selectedLocation?.templateid) {
        setExistingTemplate(null);
        return;
      }
      const template =
        templateReferenceValues.find((item) => item.id === selectedLocation.templateid) ?? null;
      setExistingTemplate(template);
    },
    [locations, templateReferenceValues],
  );

  // Update location's templateid field using dedicated API
  const updateLocationTemplateId = async (locationId: number, templateId: string): Promise<boolean> => {
    try {
      console.log('🔗 Updating location templateid:', { locationId, templateId });
      
      // Use the template ID directly (it's already a number from ReferenceValue.id)
      const numericTemplateId = parseInt(templateId) || 0;
      
      console.log('🔢 Using template ID directly:', { original: templateId, numeric: numericTemplateId });
      
      // Use the dedicated API to update only the templateid
      const req = new UpdateLocationTemplateIdReq();
      req.organisationlocationid = locationId;
      req.templateid = numericTemplateId;
      
      const response = await locationService.updateLocationTemplateId(req);
      console.log('✅ Location templateid updated successfully:', response);
      
      if (response) {
        // Update the local state to reflect the change
        setLocations(prevLocations => 
          prevLocations.map(loc => 
            loc.id === locationId 
              ? { ...loc, templateid: numericTemplateId }
              : loc
          )
        );
        queryClient.setQueryData<OrganisationLocation[]>(
          organisationLocationsQueryKey(user?.organisationid || 0, user?.locationid || 0),
          (prev) =>
            (prev ?? []).map((loc) =>
              loc.id === locationId ? { ...loc, templateid: numericTemplateId } : loc,
            ),
        );
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error updating location templateid:', error);
      return false;
    }
  };

  const assignTemplateToLocation = async (locationId: number, templateId: string) => {
    if (!locationId) {
      toast({
        title: "Select a location",
        description: "Choose a business location first, then pick a template.",
        variant: "destructive",
      });
      return;
    }

    if (!templateId) {
      toast({
        title: "Select a template",
        description: "Choose a template to assign to this location.",
        variant: "destructive",
      });
      return;
    }

    const numericTemplateId = parseInt(templateId, 10) || 0;
    const currentLocation = locations.find((loc) => loc.id === locationId);
    if (currentLocation?.templateid === numericTemplateId) {
      return;
    }

    setIsCreatingTemplate(true);
    try {
      const success = await updateLocationTemplateId(locationId, templateId);

      if (success) {
        invalidatePublicSiteCacheForLocation(locationId);
        void queryClient.invalidateQueries({
          queryKey: organisationLocationsQueryKey(
            user?.organisationid || 0,
            user?.locationid || 0,
          ),
        });
        toast({
          title: "Template updated",
          description: "This location now uses the selected template.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update template for location",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Error updating location templateid:", error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const selectAndAssignTemplate = (templateId: string) => {
    setSelectedTemplate(templateId as TemplateType);
    if (!selectedLocationId) {
      toast({
        title: "Select a location",
        description: "Choose a business location first, then pick a template.",
        variant: "destructive",
      });
      return;
    }
    void assignTemplateToLocation(selectedLocationId, templateId);
  };

  // Update location's templateid field using dedicated API
  const generateCustomUrl = (location: OrganisationLocation) => {
    if (!location) return "";
    return buildOrganisationCustomUrlHost({ customUrl: location.customurl });
  };

  // Generate booking URL for location (/template/{orgloctempid})
  const generateBookingUrl = useCallback(async (locationId: number) => {
    if (locationId > 0) {
      setIsGeneratingUrl(true);
      try {
        const selectedLocation = locations.find((loc) => loc.id === locationId);
        const url = buildOrganisationTemplateBookingUrl(selectedLocation?.orgloctempid);
        setBookingUrl(url);
        if (!url) {
          toast({
            title: "Booking link unavailable",
            description:
              "This location has no booking GUID yet. Run the orgloctempid backfill on the database, then refresh this page.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error generating encrypted URL:', error);
        setBookingUrl('');
        toast({
          title: "Error",
          description: "Failed to generate booking URL",
          variant: "destructive"
        });
      } finally {
        setIsGeneratingUrl(false);
      }
    } else {
      setBookingUrl('');
    }
  }, [locations, toast]);

  const requestDeleteTemplate = (refValue: ReferenceValue, e?: MouseEvent) => {
    e?.stopPropagation();
    if (Number(refValue.organizationid) !== Number(organizationId) || organizationId <= 0) {
      return;
    }
    setTemplatePendingDelete(refValue);
  };

  const confirmDeleteTemplate = async () => {
    if (!templatePendingDelete || organizationId <= 0) return;

    setIsDeletingTemplate(true);
    try {
      const deletedNumericId = templatePendingDelete.id;
      const assignedLocations = locations.filter((loc) => loc.templateid === deletedNumericId);
      for (const loc of assignedLocations) {
        const unassign = new UpdateLocationTemplateIdReq();
        unassign.organisationlocationid = loc.id;
        unassign.templateid = 0;
        await locationService.updateLocationTemplateId(unassign);
        invalidatePublicSiteCacheForLocation(loc.id);
      }

      const deleteReq = new ReferenceValueDeleteReq();
      deleteReq.id = templatePendingDelete.id;
      deleteReq.version = templatePendingDelete.version;
      const deleted = await referenceValueService.delete(deleteReq);
      if (!deleted) {
        throw new Error("Delete did not remove the template.");
      }

      const deletedId = templatePendingDelete.id.toString();

      setLocations((prev) =>
        prev.map((loc) =>
          loc.templateid === deletedNumericId ? { ...loc, templateid: 0 } : loc,
        ),
      );

      if (selectedTemplate === deletedId) {
        const remaining = templateReferenceValues.filter((rv) => rv.id !== deletedNumericId);
        setSelectedTemplate(remaining[0]?.id.toString() ?? "");
      }

      await queryClient.invalidateQueries({
        queryKey: referenceValuesQueryKey(organizationId, ORG_WEBSITE_TEMPLATE_REFERENCE_TYPE_ID),
      });
      await queryClient.invalidateQueries({
        queryKey: organisationLocationsQueryKey(organizationId, user?.locationid || 0),
      });

      toast({
        title: "Template deleted",
        description: `"${templatePendingDelete.displaytext}" was removed.`,
      });
      setTemplatePendingDelete(null);
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast({
        title: "Error",
        description: "Could not delete this template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  const openTemplateBuilder = (mode: "new" | "edit" = "new", templateIdOverride?: number) => {
    if (mode === "new" && atTemplateLimit) {
      toast({
        title: "Limit reached",
        description: `You can save up to ${ORG_WEBSITE_TEMPLATE_MAX_PER_ORG} templates. Delete one to create another.`,
        variant: "destructive",
      });
      return;
    }
    const templateId =
      templateIdOverride && templateIdOverride > 0
        ? templateIdOverride
        : mode === "edit" && selectedTemplate
          ? Number(selectedTemplate)
          : undefined;
    navigate(
      buildTemplateBuilderPath(
        selectedLocationId || 0,
        mode === "edit" && templateId && templateId > 0 ? templateId : undefined,
      ),
    );
  };

  // Copy URL to clipboard
  const copyUrlToClipboard = async () => {
    if (bookingUrl) {
      try {
        await navigator.clipboard.writeText(bookingUrl);
        toast({
          title: "URL Copied",
          description: "Booking URL has been copied to clipboard",
        });
      } catch (error) {
        console.error('Error copying URL:', error);
        toast({
          title: "Error",
          description: "Failed to copy URL to clipboard",
          variant: "destructive"
        });
      }
    }
  };

  const customUrlOrigin = customUrl ? buildOrganisationPublicSiteOriginFromHost(customUrl) : "";

  // Copy custom URL to clipboard
  const copyCustomUrlToClipboard = async () => {
    if (customUrlOrigin) {
      try {
        await navigator.clipboard.writeText(customUrlOrigin);
        toast({
          title: "Custom URL Copied",
          description: "Custom booking URL has been copied to clipboard",
        });
      } catch (error) {
        console.error('Error copying custom URL:', error);
        toast({
          title: "Error",
          description: "Failed to copy custom URL to clipboard",
          variant: "destructive"
        });
      }
    }
  };

  // Share URL
  const shareUrl = async () => {
    if (bookingUrl && navigator.share) {
      try {
        const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
        const locationName = selectedLocation?.city || 'this location';
        
        await navigator.share({
          title: 'Book Appointment - Appointza',
          text: `Book your appointment at ${locationName}!`,
          url: bookingUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        copyUrlToClipboard();
      }
    } else {
      copyUrlToClipboard();
    }
  };

  // During setup, send users without an assigned org template straight to the builder.
  useEffect(() => {
    if (embedded || isLocationsFetching || locations.length === 0 || !selectedLocationId) return;
    if (isComplete || hasWebsite) return;

    navigate(buildTemplateBuilderPath(selectedLocationId), { replace: true });
  }, [embedded, isLocationsFetching, isComplete, hasWebsite, locations, selectedLocationId, navigate]);

  // Generate booking URL when location changes
  useEffect(() => {
    if (selectedLocationId && selectedLocationId > 0) {
      generateBookingUrl(selectedLocationId);
      
      const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
      if (selectedLocation) {
        const customUrlGenerated = generateCustomUrl(selectedLocation);
        setCustomUrl(customUrlGenerated);
      }
    } else {
      setBookingUrl('');
      setCustomUrl('');
    }
  }, [selectedLocationId, locations, organisationDetails, generateBookingUrl]);

  // Check for existing template when location changes
  useEffect(() => {
    if (selectedLocationId) {
      syncExistingTemplateForLocation(selectedLocationId);
    } else {
      setExistingTemplate(null);
    }
  }, [selectedLocationId, syncExistingTemplateForLocation]);

  // Load real location/org/services data for template preview (same renderer as public subdomain).
  useEffect(() => {
    if (!selectedLocationId || selectedLocationId <= 0) {
      setPreviewSiteData(null);
      return;
    }

    let cancelled = false;

    const loadPreviewData = async () => {
      setPreviewLoading(true);
      try {
        const siteResponse = await siteDetailsService.select(selectedLocationId);
        if (cancelled || !siteResponse?.length) {
          setPreviewSiteData(null);
          return;
        }

        const siteData = siteResponse[0];
        let publicEvents: unknown[] = [];
        try {
          const eventsResponse = await eventService.select({
            id: 0,
            organisation_id: siteData.organisationdetail?.id || organizationId,
            organisation_location_id: siteData.locationdetail?.id || selectedLocationId,
            status: "",
            is_public: true,
          });
          publicEvents = (eventsResponse || []).filter(
            (event: { is_public?: boolean }) => event?.is_public === true,
          );
        } catch {
          // events are optional for preview
        }

        if (!cancelled) {
          setPreviewSiteData({
            ...(siteData as SiteDetailsItem),
            events: publicEvents,
          } as SiteDetailsItem);
        }
      } catch (error) {
        console.error("Failed to load template preview data:", error);
        if (!cancelled) setPreviewSiteData(null);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    loadPreviewData();
    return () => {
      cancelled = true;
    };
  }, [selectedLocationId, siteDetailsService, eventService, organizationId]);


  const TemplatePreviews = () => {
    if (isLoadingTemplates) {
      return (
        <div className={cn(org.loading, "flex-col gap-2 py-8")}>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-sm text-stone-600">Loading templates…</span>
        </div>
      );
    }

    if (availableTemplates.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-10 text-center text-sm text-stone-500 shadow-none">
          <p>No templates found. Use the builder above to create one.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
        {availableTemplates.map((template) => {
          const refValue = templateReferenceValues.find((rv) => rv.id.toString() === template.id);
          const isOrgOwned =
            !!refValue &&
            Number(refValue.organizationid) === Number(organizationId) &&
            organizationId > 0;

          return (
          <Card
            key={template.id}
            className={cn(
              org.card,
              "cursor-pointer overflow-hidden rounded-2xl border-stone-200 bg-white shadow-none transition-colors hover:border-blue-300 hover:shadow-none",
              selectedTemplate === template.id && "border-blue-500 ring-2 ring-blue-500 ring-offset-2",
            )}
            onClick={() => selectAndAssignTemplate(template.id)}
          >
            <div className="aspect-video bg-stone-100 overflow-hidden">
              {template.content && template.content.includes("<!DOCTYPE html>") ? (
                previewLoading && selectedLocationId ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <iframe
                    title={`${template.name} preview`}
                    srcDoc={renderTemplatePreviewHtml(template.content)}
                    className="h-full w-full border-0 pointer-events-none bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                )
              ) : (
                <img
                  src={template.previewImage}
                  alt={template.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base text-appointza-navy">{template.name}</CardTitle>
                {isOrgOwned ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-600"
                    onClick={(e) => refValue && requestDeleteTemplate(refValue, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardFooter className="flex gap-2 pt-0">
              <Button
                variant={selectedTemplate === template.id ? "default" : "outline"}
                className={cn(
                  selectedTemplate === template.id ? org.btnPrimary : org.btnOutline,
                  "min-h-10 flex-1 rounded-xl border-stone-200 shadow-none",
                  selectedTemplate === template.id && "border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
                )}
                disabled={isCreatingTemplate || !selectedLocationId}
                onClick={(e) => {
                  e.stopPropagation();
                  selectAndAssignTemplate(template.id);
                }}
              >
                {selectedLocationId &&
                locations.find((loc) => loc.id === selectedLocationId)?.templateid ===
                  Number(template.id)
                  ? "Assigned"
                  : selectedTemplate === template.id
                    ? "Selected"
                    : "Select"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(org.btnOutline, "min-h-10 flex-1 rounded-xl border-stone-200 shadow-none")}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTemplate(template.id as TemplateType);
                  const numericId = Number(template.id);
                  if (numericId > 0) openTemplateBuilder("edit", numericId);
                }}
              >
                <PencilLine className="mr-2 h-4 w-4 text-blue-600" />
                Edit
              </Button>
            </CardFooter>
          </Card>
          );
        })}
      </div>
    );
  };


  const TemplatePreview = () => {
    const selectedTemplateData = availableTemplates.find((t) => t.id === selectedTemplate);

    if (!selectedTemplateData) {
      return (
        <div className="py-8 text-center text-gray-500">
          <p>Please select a template to preview.</p>
        </div>
      );
    }

    if (!selectedLocationId) {
      return (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-10 text-center text-sm text-stone-500 shadow-none">
          Select a location above to preview with your real business data.
        </div>
      );
    }

    if (previewLoading) {
      return (
        <div className={cn(org.loading, "flex-col gap-2 py-12")}>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-sm text-stone-600">Loading preview…</span>
        </div>
      );
    }

    if (
      selectedTemplateData.content &&
      selectedTemplateData.content.includes("<!DOCTYPE html>")
    ) {
      return (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <iframe
            srcDoc={renderTemplatePreviewHtml(selectedTemplateData.content)}
            className="h-[min(70vh,720px)] w-full border-0"
            title="Template Preview"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      );
    }

    return (
      <div className="py-8 text-center text-gray-500">
        <p>This template has no HTML content to preview.</p>
      </div>
    );
  };

  return (
    <OrganizationPageShell embedded={embedded}>
      {embedded ? (
        <SettingsEmbeddedHeader
          icon={FileText}
          title="Templates & booking"
          description="Pick a location, choose a website template, and copy your booking link — all on one page."
        />
      ) : null}
      <div className={cn(embedded ? settingsEmbedded.sectionBody : "space-y-4 sm:space-y-6")}>
        {inOnboarding && (
          <div className={cn(!embedded && "org-page-section pb-0 pt-2 sm:pt-4")}>
            <OnboardingPageGuide
              compact
              stepId="website"
              hasCustomDomain={hasCustomDomain}
              hasServices={hasServices}
              hasWebsite={hasWebsite}
              hasTiming={hasTiming}
            />
            <p className="mt-3 text-sm text-stone-600">
              Save your page to link it to your location. Next you&apos;ll set business hours.
            </p>
          </div>
        )}

        <div className="w-full space-y-6">
          <Card className={cn(org.card, "w-full overflow-hidden rounded-2xl border-stone-200 bg-white shadow-none")}>
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
              <div className="flex items-start gap-3">
                <div className={templatesSectionIconWrap}>
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                <h3 className="text-base font-semibold text-appointza-navy md:text-lg">
                  Create page with AI
                </h3>
                <p className="text-sm text-stone-500">
                  Copy the AI prompt, paste HTML from ChatGPT or Claude, and save. You can keep up to{" "}
                  {ORG_WEBSITE_TEMPLATE_MAX_PER_ORG} templates.
                </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:shrink-0">
                <Button
                  variant="outline"
                  className={cn(org.btnOutline, "min-h-10 rounded-xl border-stone-200 bg-white shadow-none")}
                  onClick={() => openTemplateBuilder("edit")}
                >
                <PencilLine className="mr-2 h-4 w-4 text-blue-600" />
                Open AI builder
              </Button>
              <Button
                className={cn(org.btnPrimary, "min-h-10 rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700")}
                onClick={() => openTemplateBuilder("new")}
                disabled={atTemplateLimit}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                New AI page
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-xl border border-[#e6eaf0] bg-white shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6eaf0] px-4 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#1a1a1a]">Business location</p>
                <p className="text-[12px] text-[#667085]">
                  Website template and booking link use this place.
                </p>
              </div>
              {isCreatingTemplate ? (
                <p className="inline-flex items-center gap-1.5 text-[12px] text-[#667085]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2a5af5]" />
                  Updating…
                </p>
              ) : selectedLocationId ? (
                <p className="truncate text-[12px] text-[#667085]">
                  {(() => {
                    const loc = locations.find((item) => item.id === selectedLocationId);
                    const assigned = availableTemplates.find(
                      (t) => t.id === String(loc?.templateid ?? ""),
                    );
                    return assigned
                      ? `Uses ${assigned.name}`
                      : "No template yet — pick one below";
                  })()}
                </p>
              ) : null}
            </div>

            {isLocationsFetching ? (
              <div className="flex items-center gap-2 px-4 py-6 text-[13px] text-[#667085]">
                <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
                Loading locations…
              </div>
            ) : locations.length > 0 ? (
              <div className="divide-y divide-[#eef1f5]">
                {locations.map((location) => {
                  const selected = selectedLocationId === location.id;
                  return (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => {
                        setSelectedLocationId(location.id);
                        if (location.templateid) {
                          setSelectedTemplate(String(location.templateid) as TemplateType);
                        }
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        selected ? "bg-[#eef4ff]" : "bg-white hover:bg-[#f8fafc]",
                      )}
                    >
                      <MapPin
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selected ? "text-[#2a5af5]" : "text-[#98a2b3]",
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-[#1a1a1a]">
                          {location.name}
                        </p>
                        <p className="truncate text-[12px] text-[#667085]">
                          {[location.city, location.country].filter(Boolean).join(", ")}
                          {location.templateid ? " · Template assigned" : ""}
                        </p>
                      </div>
                      {selected ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-[#2a5af5]" aria-hidden />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-[13px] font-medium text-[#1a1a1a]">No locations yet</p>
                <p className="mt-1 text-[12px] text-[#667085]">
                  Add a place first to assign a template.
                </p>
                <Button
                  onClick={() => navigate("/organization/profile?tab=location")}
                  className={cn(org.btnPrimary, "mt-3 h-8")}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Add location
                </Button>
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-1 text-lg font-semibold text-appointza-navy">Choose a template</h2>
            <p className="mb-4 text-sm text-stone-500">
              Select a design to apply it to the location above.
            </p>
            <TemplatePreviews />
          </div>

          {selectedTemplate ? (
            <Card className={cn(org.card, "rounded-2xl border-stone-200 bg-white shadow-none")}>
              <CardHeader className="space-y-1.5">
                <CardTitle className="text-lg text-appointza-navy sm:text-xl">
                  Live template preview
                </CardTitle>
                <CardDescription className="text-stone-500">
                  Matches the public subdomain page — uses your selected location&apos;s real data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplatePreview />
              </CardContent>
            </Card>
          ) : null}

          {selectedLocationId && selectedLocationId > 0 ? (
            <Card className={cn(org.card, "rounded-2xl border-stone-200 bg-white shadow-none")}>
              <CardHeader className="space-y-1.5">
                <CardTitle className="flex items-center gap-2 text-lg text-appointza-navy sm:text-xl">
                  <span className={templatesSectionIconWrap}>
                    <ExternalLink className="h-5 w-5" />
                  </span>
                  Your booking link
                </CardTitle>
                <CardDescription className="text-stone-500">
                  Share link for bookings at{" "}
                  {locations.find((loc) => loc.id === selectedLocationId)?.city || "your location"}
                  {" "}
                  (uses location GUID)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-none">
                    <div className="flex items-start gap-2">
                      {isGeneratingUrl ? (
                        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-blue-600" />
                      ) : (
                        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                      )}
                      <span className="flex-1 break-all font-mono text-xs text-stone-700 sm:text-sm">
                        {bookingUrl || (isGeneratingUrl ? "Generating URL…" : "No booking GUID for this location")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      onClick={copyUrlToClipboard}
                      disabled={!bookingUrl || isGeneratingUrl}
                      variant="outline"
                      className={cn(org.btnOutline, "min-h-11 w-full rounded-xl border-stone-200 bg-white shadow-none sm:w-auto")}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy URL
                    </Button>
                    <Button
                      onClick={shareUrl}
                      disabled={!bookingUrl || isGeneratingUrl}
                      variant="outline"
                      className={cn(org.btnOutline, "min-h-11 w-full rounded-xl border-stone-200 bg-white shadow-none sm:w-auto")}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                    <Button
                      onClick={() => window.open(bookingUrl, "_blank")}
                      disabled={!bookingUrl || isGeneratingUrl}
                      className={cn(org.btnPrimary, "min-h-11 w-full rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700 sm:w-auto")}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>

                  {customUrl ? (
                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-none">
                      <div className="mb-3 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-appointza-navy">Custom booking URL</span>
                      </div>
                      <div className="mb-3 rounded-xl border border-stone-200 bg-white p-3 shadow-none">
                        <span className="break-all font-mono text-xs text-stone-700 sm:text-sm">{customUrl}</span>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          onClick={copyCustomUrlToClipboard}
                          disabled={!customUrl}
                          variant="outline"
                          className={cn(org.btnOutline, "min-h-10 w-full rounded-xl border-stone-200 bg-white shadow-none sm:w-auto")}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                        <Button
                          onClick={() => customUrlOrigin && window.open(customUrlOrigin, "_blank")}
                          disabled={!customUrlOrigin}
                          className={cn(org.btnPrimary, "min-h-10 w-full rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700 sm:w-auto")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-2xl border border-stone-200 bg-white shadow-none">
            <CardContent className="p-5 sm:p-6">
              <h3 className="mb-3 text-base font-semibold text-appointza-navy sm:text-lg">
                How to use your booking page
              </h3>
              <div className="space-y-2 text-xs text-stone-600 sm:text-sm">
                <p>• Share the URL via email, SMS, or social media</p>
                <p>• Print a QR code and display it at your business</p>
                <p>• Embed the booking page on your website</p>
                <p>• Add the link to your social profiles</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog
        open={!!templatePendingDelete}
        onOpenChange={(open) => {
          if (!open && !isDeletingTemplate) setTemplatePendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              {templatePendingDelete
                ? `"${templatePendingDelete.displaytext}" will be removed. Locations using it will need another template assigned. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTemplate}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingTemplate}
              onClick={(e) => {
                e.preventDefault();
                void confirmDeleteTemplate();
              }}
            >
              {isDeletingTemplate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OrganizationPageShell>
  );
};

export default OrganizationTemplates;
