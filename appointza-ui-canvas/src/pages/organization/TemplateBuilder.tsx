import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Code2,
  Eye,
  Images,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import {
  organizationTemplatesRoute,
  onboardingStepRoute,
  clearOnboardingCompleteCache,
  ORG_WEBSITE_TEMPLATE_MAX_PER_ORG,
} from "@/utils/organizationOnboarding.util";
import {
  BUSINESS_COMPLETE_PATH,
  BUSINESS_DOMAIN_PATH,
  setBusinessOnboardingStep,
} from "@/utils/businessOnboarding.util";
import { OnboardingPageGuide } from "@/components/onboarding/OrganizationOnboarding";
import { useOrgTemplateAssets } from "@/contexts/OrgTemplateAssetsContext";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { invalidatePublicSiteCacheForLocation } from "@/utils/publicSiteCache.util";
import { EventService } from "@/services/event.service";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { useOrganisationLocations, organisationLocationsQueryKey } from "@/hooks/useOrganisationLocations";
import { referenceValuesQueryKey } from "@/hooks/useReferenceValues";
import { SiteDetailsService } from "@/services/siteDetails.service";
import { SiteDetailsItem } from "@/models/sitedetail.model";
import {
  OrganisationLocation,
  UpdateLocationTemplateIdReq,
} from "@/models/organisationlocation.model";
import TemplateVariablesCopyDialog from "@/components/templateBuilder/TemplateVariablesCopyDialog";
import { LocationTemplateMediaPanel } from "@/components/templateBuilder/LocationTemplateMediaPanel";
import { HeroBlockPalette } from "@/components/templateBuilder/HeroBlockPalette";
import { TemplateBuilderStructurePanel } from "@/components/templateBuilder/TemplateBuilderStructurePanel";
import { TemplateBuilderBlockEditor } from "@/components/templateBuilder/TemplateBuilderBlockEditor";
import { ORG_TEMPLATE_ASSETS_IDENTIFIER } from "@/types/orgAssets.types";
import type { TemplateBuilderProject } from "@/types/templateBuilder.types";
import { TEMPLATE_BUILDER_CATEGORIES } from "@/utils/templateBuilder/catalog";
import { createBlock } from "@/utils/templateBuilder/defaults";
import { generateTemplateHtml } from "@/utils/templateBuilder/html";
import { collectImageIdsFromProject } from "@/utils/templateBuilder/orgAssetsStorage";
import {
  createDefaultProject,
  parseBuilderProject,
  serializeBuilderProject,
} from "@/utils/templateBuilder/storage";
import { renderSiteTemplateHtml } from "@/utils/templateRenderer.util";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TEMPLATE_REFERENCE_TYPE_ID = 5;
const HOME_PAGE_ID = "home";

type BuilderMode = "blocks" | "html";
type LeftTab = "blocks" | "media";
type RightTab = "sections" | "settings";
type SimplePane = "add" | "look" | "change";

function notesHasBlocksProject(notes: string | null | undefined): boolean {
  if (!notes?.trim()) return false;
  try {
    const parsed = JSON.parse(notes) as { builderVersion?: number; pages?: unknown };
    return parsed?.builderVersion === 2 && !!parsed.pages;
  } catch {
    return false;
  }
}

function TemplateBuilderInner() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    isComplete,
    hasCustomDomain,
    hasServices,
    hasWebsite,
    hasTiming,
    nextStep,
    refetch: refetchOnboarding,
  } = useOnboardingStatus();
  const navigate = useNavigate();
  const templatesBackRoute = organizationTemplatesRoute(isComplete);
  const [searchParams, setSearchParams] = useSearchParams();
  /** New register website step opens builder with ?onboarding=1&return=/register/domain */
  const isRegisterOnboarding = searchParams.get("onboarding") === "1";
  const registerReturnPath = (() => {
    const raw = searchParams.get("return") || "";
    return raw.startsWith("/register") ? raw : BUSINESS_DOMAIN_PATH;
  })();
  const inOnboarding =
    !isRegisterOnboarding && !isComplete && hasCustomDomain && hasServices;
  const { registerFileIds } = useOrgTemplateAssets();

  const refService = useMemo(() => new ReferenceValueService(), []);
  const siteService = useMemo(() => new SiteDetailsService(), []);
  const eventService = useMemo(() => new EventService(), []);
  const locationService = useMemo(() => new OrganisationLocationService(), []);

  const [templateName, setTemplateName] = useState("");
  const [templateId, setTemplateId] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [builderMode, setBuilderMode] = useState<BuilderMode>("blocks");
  const [project, setProject] = useState<TemplateBuilderProject>(() => createDefaultProject());
  const [html, setHtml] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [savedTemplates, setSavedTemplates] = useState<ReferenceValue[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewLocationId, setPreviewLocationId] = useState(0);
  const [previewSiteData, setPreviewSiteData] = useState<SiteDetailsItem | null>(null);
  const [previewEvents, setPreviewEvents] = useState<unknown[]>([]);
  const [isLoadingPreviewData, setIsLoadingPreviewData] = useState(false);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState("{}");
  const [leftTab, setLeftTab] = useState<LeftTab>("blocks");
  const [rightTab, setRightTab] = useState<RightTab>("sections");
  const [simplePane, setSimplePane] = useState<SimplePane>("look");
  const [toolSide, setToolSide] = useState<"add" | "change">("add");
  /** Keep blocks JSON on save once the user works in Blocks mode or loads a blocks project. */
  const [persistBlocks, setPersistBlocks] = useState(true);

  const organisationId = user?.organisationid ?? 0;
  const userLocationId = user?.organisationlocationid ?? user?.locationid ?? 0;
  const staffLocationId = user?.locationid || 0;
  const locationsQueryKey = organisationLocationsQueryKey(organisationId, staffLocationId);
  const { data: locations = [] } = useOrganisationLocations({
    organisationId,
    staffLocationId: user?.locationid || 0,
    enabled: !!user,
  });
  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === previewLocationId) ?? null,
    [locations, previewLocationId],
  );

  const homePage = project.pages[HOME_PAGE_ID] ?? createDefaultProject().pages[HOME_PAGE_ID];
  const blocks = homePage.blocks;
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null;

  // Debounce block tree so generateTemplateHtml does not run on every keystroke.
  const [debouncedHomePage, setDebouncedHomePage] = useState(homePage);
  const [debouncedTemplateName, setDebouncedTemplateName] = useState(templateName);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedHomePage(homePage);
      setDebouncedTemplateName(templateName);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [homePage, templateName]);

  const setBlocks = useCallback(
    (updater: (prev: typeof blocks) => typeof blocks) => {
      setProject((prev) => {
        const page = prev.pages[HOME_PAGE_ID] ?? createDefaultProject().pages[HOME_PAGE_ID];
        return {
          ...prev,
          pages: {
            ...prev.pages,
            [HOME_PAGE_ID]: { ...page, blocks: updater(page.blocks) },
          },
        };
      });
    },
    [],
  );

  const blocksHtml = useMemo(() => {
    // Skip expensive HTML generation while preview is hidden (save regenerates on demand).
    if (!showPreview && builderMode === "blocks") {
      return "";
    }
    return generateTemplateHtml(
      debouncedHomePage,
      debouncedTemplateName || debouncedHomePage.name || "Booking page",
    );
  }, [builderMode, debouncedHomePage, debouncedTemplateName, showPreview]);

  const sourceHtml = builderMode === "blocks" ? blocksHtml : html;

  const previewHtml = useMemo(() => {
    if (!showPreview) return "";
    if (!sourceHtml.trim()) return "";
    if (!previewSiteData) {
      return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;color:#57534e"><p>Loading preview data…</p></body></html>`;
    }
    return renderSiteTemplateHtml(sourceHtml, {
      ...previewSiteData,
      events: previewEvents,
    } as SiteDetailsItem);
  }, [previewEvents, previewSiteData, showPreview, sourceHtml]);

  useEffect(() => {
    if (selectedBlock) {
      setJsonDraft(JSON.stringify(selectedBlock.data, null, 2));
    }
  }, [selectedBlock?.id, selectedBlock?.data]);

  useEffect(() => {
    if (!locations.length) return;
    const preferred =
      (userLocationId > 0 && locations.some((loc) => loc.id === userLocationId)
        ? userLocationId
        : locations[0].id) ?? 0;
    setPreviewLocationId((current) =>
      current > 0 && locations.some((loc) => loc.id === current) ? current : preferred,
    );
  }, [locations, userLocationId]);

  const fetchPreviewData = useCallback(async () => {
    if (previewLocationId <= 0) {
      setPreviewSiteData(null);
      setPreviewEvents([]);
      return;
    }

    setIsLoadingPreviewData(true);
    try {
      const siteResponse = await siteService.select(previewLocationId);
      const siteData = siteResponse?.[0] ?? null;
      setPreviewSiteData(siteData);

      if (!siteData) {
        setPreviewEvents([]);
        return;
      }

      try {
        const eventsResponse = await eventService.select({
          id: 0,
          organisation_id: siteData.organisationdetail?.id || 0,
          organisation_location_id: siteData.locationdetail?.id || 0,
          status: "",
          is_public: true,
        });
        setPreviewEvents(
          (eventsResponse || []).filter(
            (event: { is_public?: boolean }) => event?.is_public === true,
          ),
        );
      } catch {
        setPreviewEvents([]);
      }
    } catch {
      setPreviewSiteData(null);
      setPreviewEvents([]);
      toast({ title: "Could not load preview data", variant: "destructive" });
    } finally {
      setIsLoadingPreviewData(false);
    }
  }, [eventService, previewLocationId, siteService, toast]);

  useEffect(() => {
    void fetchPreviewData();
  }, [fetchPreviewData]);

  const fetchSavedTemplates = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const req = new ReferenceValueSelectReq();
      req.referencetypeid = TEMPLATE_REFERENCE_TYPE_ID;
      req.organisationid = organisationId;
      const resp = await refService.select(req);
      setSavedTemplates(
        (resp ?? []).filter(
          (t) =>
            t.identifier !== ORG_TEMPLATE_ASSETS_IDENTIFIER &&
            Number(t.organizationid) === Number(organisationId),
        ),
      );
    } catch {
      toast({ title: "Could not load templates", variant: "destructive" });
    } finally {
      setIsLoadingList(false);
    }
  }, [refService, toast, organisationId]);

  useEffect(() => {
    void fetchSavedTemplates();
  }, [fetchSavedTemplates]);

  const applyTemplateRow = useCallback(
    (row: ReferenceValue) => {
      setTemplateId(row.id);
      setTemplateName(row.displaytext || "");
      setIsActive(!!row.isactive);
      setHtml(row.description || "");
      setSelectedBlockId(null);

      if (notesHasBlocksProject(row.notes)) {
        setProject(parseBuilderProject(row.notes));
        setBuilderMode("blocks");
        setPersistBlocks(true);
      } else {
        setProject(createDefaultProject());
        setBuilderMode("html");
        setPersistBlocks(false);
        if (!row.description?.trim()) {
          toast({
            title: "Empty template",
            description: "Add blocks or paste HTML to build this page.",
          });
        }
      }
    },
    [toast],
  );

  const loadTemplate = useCallback(
    (id: string) => {
      const numericId = Number(id);
      const row = savedTemplates.find((t) => t.id === numericId || String(t.id) === id);
      if (!row) return;
      applyTemplateRow(row);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("templateId", String(row.id));
          if (previewLocationId > 0) next.set("locationId", String(previewLocationId));
          return next;
        },
        { replace: true },
      );
    },
    [savedTemplates, applyTemplateRow, setSearchParams, previewLocationId],
  );

  useEffect(() => {
    const locId = Number(searchParams.get("locationId") || 0);
    if (locId > 0 && locations.some((loc) => loc.id === locId)) {
      setPreviewLocationId(locId);
    }
  }, [searchParams, locations]);

  useEffect(() => {
    const qp = Number(searchParams.get("templateId") || 0);
    if (qp <= 0 || templateId === qp) return;

    const row = savedTemplates.find((t) => t.id === qp);
    if (row) {
      applyTemplateRow(row);
      return;
    }

    if (isLoadingList || organisationId <= 0) return;

    let cancelled = false;
    void (async () => {
      try {
        const req = new ReferenceValueSelectReq();
        req.id = qp;
        req.referencetypeid = TEMPLATE_REFERENCE_TYPE_ID;
        req.organisationid = organisationId;
        const resp = await refService.select(req);
        const found = (resp ?? []).find((t) => t.id === qp);
        if (!cancelled && found && found.identifier !== ORG_TEMPLATE_ASSETS_IDENTIFIER) {
          applyTemplateRow(found);
        }
      } catch {
        if (!cancelled) {
          toast({
            title: "Could not open template",
            description: "This page could not be loaded for editing.",
            variant: "destructive",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    searchParams,
    savedTemplates,
    templateId,
    isLoadingList,
    organisationId,
    refService,
    applyTemplateRow,
    toast,
  ]);

  const handleNew = () => {
    if (savedTemplates.length >= ORG_WEBSITE_TEMPLATE_MAX_PER_ORG) {
      toast({
        title: "Limit reached",
        description: `You can save up to ${ORG_WEBSITE_TEMPLATE_MAX_PER_ORG} templates. Delete one first.`,
        variant: "destructive",
      });
      return;
    }
    setTemplateId(0);
    setTemplateName("");
    setHtml("");
    setIsActive(true);
    setProject(createDefaultProject());
    setBuilderMode("blocks");
    setPersistBlocks(true);
    setSelectedBlockId(null);
    setRightTab("sections");
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("templateId");
        return next;
      },
      { replace: true },
    );
  };

  const switchMode = (mode: BuilderMode) => {
    if (mode === builderMode) return;
    if (mode === "html") {
      setHtml((current) => current.trim() || blocksHtml);
    } else {
      setPersistBlocks(true);
    }
    setBuilderMode(mode);
  };

  const handleAddBlock = (type: string) => {
    const block = createBlock(type);
    setBlocks((prev) => [...prev, block]);
    setSelectedBlockId(block.id);
    setRightTab("settings");
    setPersistBlocks(true);
    setSimplePane("look");
    setToolSide("add");
    toast({
      title: "Added to your page",
      description: "Check Look, then tap Save when you like it.",
    });
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateBlockData = (id: string, patch: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...patch } } : b)),
    );
  };

  const applyJsonDraft = () => {
    if (!selectedBlock) return;
    try {
      const parsed = JSON.parse(jsonDraft) as Record<string, unknown>;
      updateBlockData(selectedBlock.id, parsed);
      toast({ title: "Block data updated" });
    } catch {
      toast({ title: "Invalid JSON", variant: "destructive" });
    }
  };

  const applyHtmlEditorContent = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.includes('"builderVersion"')) {
      try {
        const parsed = JSON.parse(trimmed) as {
          builderVersion?: number;
          pages?: Record<string, { name?: string; blocks?: unknown[] }>;
        };
        if (parsed.builderVersion === 2 && parsed.pages) {
          const next = parseBuilderProject(trimmed);
          const home = next.pages.home ?? Object.values(next.pages)[0];
          if (home?.blocks?.length) {
            setProject(next);
            setBuilderMode("blocks");
            setPersistBlocks(true);
            setHtml(generateTemplateHtml(home, templateName || home.name || "Booking page"));
            toast({
              title: "Blocks imported",
              description: "Switched to Blocks mode with the AI project.",
            });
            return;
          }
        }
      } catch {
        /* keep typing */
      }
    }
    setHtml(raw);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast({ title: "Add a page name", variant: "destructive" });
      return;
    }

    const effectiveHtml = builderMode === "blocks" ? blocksHtml : html;
    if (!effectiveHtml.trim()) {
      toast({
        title: builderMode === "blocks" ? "Add at least one section" : "Paste HTML from AI",
        variant: "destructive",
      });
      return;
    }

    const wasUpdate = templateId > 0;
    if (!wasUpdate && savedTemplates.length >= ORG_WEBSITE_TEMPLATE_MAX_PER_ORG) {
      toast({
        title: "Limit reached",
        description: `You can save up to ${ORG_WEBSITE_TEMPLATE_MAX_PER_ORG} templates. Delete one first.`,
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const namedProject: TemplateBuilderProject = {
        ...project,
        pages: {
          ...project.pages,
          [HOME_PAGE_ID]: { ...homePage, name: templateName.trim() || homePage.name },
        },
      };

      const payload = new ReferenceValue();
      payload.id = templateId;
      payload.referencetypeid = TEMPLATE_REFERENCE_TYPE_ID;
      payload.displaytext = templateName.trim();
      payload.identifier = templateName.trim().toLowerCase().replace(/\s+/g, "_");
      payload.description = effectiveHtml;
      payload.notes = persistBlocks
        ? serializeBuilderProject(namedProject)
        : JSON.stringify({ builderVersion: 3, mode: "ai-html" });
      payload.isactive = isActive;
      payload.organizationid = organisationId;

      const saved = await refService.save(payload);
      const savedTemplateId = saved?.id ?? templateId;
      if (savedTemplateId) {
        setTemplateId(savedTemplateId);
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("templateId", String(savedTemplateId));
            if (previewLocationId > 0) next.set("locationId", String(previewLocationId));
            return next;
          },
          { replace: true },
        );
      }

      if (persistBlocks) {
        await registerFileIds(collectImageIdsFromProject(namedProject));
        setProject(namedProject);
      }
      setHtml(effectiveHtml);

      let assignSucceeded = false;
      let assignedLocationName: string | null = null;
      if (previewLocationId > 0 && savedTemplateId > 0) {
        try {
          const assignReq = new UpdateLocationTemplateIdReq();
          assignReq.organisationlocationid = previewLocationId;
          assignReq.templateid = savedTemplateId;
          const assigned = await locationService.updateLocationTemplateId(assignReq);
          assignSucceeded = !!assigned;
          if (assignSucceeded) {
            assignedLocationName =
              locations.find((loc) => loc.id === previewLocationId)?.name ||
              locations.find((loc) => loc.id === previewLocationId)?.city ||
              null;
            queryClient.setQueryData<OrganisationLocation[]>(locationsQueryKey, (current) =>
              (current ?? locations).map((location) =>
                location.id === previewLocationId
                  ? { ...location, templateid: savedTemplateId }
                  : location,
              ),
            );
          }
        } catch (assignError) {
          console.error("Failed to assign template to location:", assignError);
        }
      }

      toast({
        title: wasUpdate ? "Page updated" : "Page saved",
        description:
          assignedLocationName ?
            `Assigned to ${assignedLocationName}. Your booking page is live for that location.`
          : previewLocationId > 0 ?
            "Page saved, but could not assign it to the selected location. Assign it from Templates in your profile."
          : "Page saved. Select a location in preview, then save again to assign it.",
      });
      await fetchSavedTemplates();

      if (previewLocationId > 0) {
        invalidatePublicSiteCacheForLocation(previewLocationId);
      }

      const locationAlreadyAssigned = locations.some(
        (loc) => loc.id === previewLocationId && Number(loc.templateid) === savedTemplateId,
      );
      const websiteAssigned = assignSucceeded || locationAlreadyAssigned;

      if (
        (isRegisterOnboarding || !isComplete) &&
        savedTemplateId > 0 &&
        websiteAssigned &&
        previewLocationId > 0
      ) {
        clearOnboardingCompleteCache(organisationId);
        queryClient.setQueryData<ReferenceValue[]>(
          referenceValuesQueryKey(organisationId, TEMPLATE_REFERENCE_TYPE_ID),
          (current) => {
            const list = current ?? savedTemplates;
            if (list.some((t) => t.id === savedTemplateId)) return list;
            return [
              ...list,
              {
                ...(saved as ReferenceValue),
                id: savedTemplateId,
                referencetypeid: TEMPLATE_REFERENCE_TYPE_ID,
                organizationid: organisationId,
              },
            ];
          },
        );

        if (isRegisterOnboarding) {
          // After website: ask for domain name next (do not finish setup here).
          setBusinessOnboardingStep("domain");
          void queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
          void queryClient.invalidateQueries({ queryKey: ["organisation-locations"] });
          toast({
            title: "Website ready!",
            description: "Next: choose your public domain name.",
          });
          window.setTimeout(() => {
            navigate(registerReturnPath || BUSINESS_DOMAIN_PATH, { replace: true });
          }, 500);
        } else {
          const refreshed = await refetchOnboarding();
          const websiteReady = refreshed.data?.hasWebsite ?? false;
          if (websiteReady) {
            toast({
              title: "Website ready!",
              description: "Nice work — finish setup from What's next.",
            });
            window.setTimeout(() => navigate(BUSINESS_COMPLETE_PATH), 700);
          }
        }
      }
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openPreviewTab = () => {
    const htmlForTab =
      builderMode === "blocks"
        ? generateTemplateHtml(homePage, templateName || homePage.name || "Booking page")
        : html;
    if (!htmlForTab.trim()) return;
    const rendered =
      previewSiteData ?
        renderSiteTemplateHtml(htmlForTab, {
          ...previewSiteData,
          events: previewEvents,
        } as SiteDetailsItem)
      : htmlForTab;
    const blob = new Blob([rendered], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const previewPanel = (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden border border-stone-200 bg-white lg:rounded-xl">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stone-100 bg-stone-50/80 px-3 py-2">
        <p className="text-sm font-semibold text-appointza-navy">
          How your page looks
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {locations.length > 1 ? (
            <Select
              value={previewLocationId > 0 ? String(previewLocationId) : undefined}
              onValueChange={(value) => setPreviewLocationId(Number(value))}
            >
              <SelectTrigger className="h-7 w-[min(100%,180px)] text-xs">
                <SelectValue placeholder="Which shop?" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>
                    {loc.name || loc.city || `Location #${loc.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden h-8 text-xs md:inline-flex"
            onClick={() => setShowPreview((v) => !v)}
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            {showPreview ? "Hide" : "Show"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={openPreviewTab}
            disabled={!sourceHtml.trim()}
          >
            Full screen
          </Button>
        </div>
      </div>
      {showPreview ? (
        isLoadingPreviewData ? (
          <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-stone-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading business data…
          </div>
        ) : sourceHtml.trim() ? (
          <div className="relative min-h-0 flex-1 bg-stone-100">
            <iframe
              title="Page preview"
              srcDoc={previewHtml}
              className="absolute inset-0 h-full w-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-sm text-stone-500">
            {builderMode === "blocks"
              ? "Tap Add, then tap a piece to put it on your page."
              : "Paste your code to see the page."}
          </div>
        )
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-stone-400">
          Preview hidden
        </div>
      )}
    </section>
  );

  const openChangePane = (id: string) => {
    setSelectedBlockId(id);
    setRightTab("settings");
    setSimplePane("change");
    setToolSide("change");
  };

  const handleBackFromBuilder = () => {
    if (isRegisterOnboarding) {
      navigate(registerReturnPath, { replace: true });
      return;
    }
    if (!isComplete && nextStep === "website") {
      navigate(onboardingStepRoute("services"));
      return;
    }
    navigate(templatesBackRoute);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[hsl(var(--app-surface))]">
      {inOnboarding && (
        <div className="shrink-0 border-b border-stone-100 bg-appointza-cream px-3 py-2 sm:px-4">
          <OnboardingPageGuide
            compact
            stepId="website"
            hasCustomDomain={hasCustomDomain}
            hasServices={hasServices}
            hasWebsite={hasWebsite}
            hasTiming={hasTiming}
            locationId={previewLocationId > 0 ? previewLocationId : undefined}
          />
        </div>
      )}
      <header className="z-30 shrink-0 border-b border-stone-200 bg-white px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 md:h-9 md:w-9"
            onClick={handleBackFromBuilder}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold leading-tight text-appointza-navy md:text-lg">
              {templateId > 0 ? "Edit your website" : "Make your website"}
            </h1>
            <p className="text-xs text-stone-500 md:text-sm">
              1. Add pieces &nbsp; 2. Look &nbsp; 3. Save
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 md:h-9 md:w-9" aria-label="More">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleNew}>Start a blank page</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchMode(builderMode === "html" ? "blocks" : "html")}>
                {builderMode === "html" ? "Simple editor (pieces)" : "Paste website code"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setIsActive((value) => !value);
                }}
              >
                {isActive ? "Customers can see this page" : "Hide this page from customers"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="h-11 min-w-[5.5rem] bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 md:h-9"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <Label htmlFor="page-name" className="text-sm font-medium text-stone-700">
              Name of this page
            </Label>
            <Input
              id="page-name"
              className="mt-1 h-11 md:h-10"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Example: Main page"
            />
          </div>
          {savedTemplates.length > 0 ? (
            <div>
              <Label className="text-sm font-medium text-stone-700">Open another page</Label>
              <Select value={templateId ? String(templateId) : undefined} onValueChange={loadTemplate}>
                <SelectTrigger className="mt-1 h-11 md:h-10">
                  <SelectValue placeholder={isLoadingList ? "Loading…" : "Pick a saved page"} />
                </SelectTrigger>
                <SelectContent>
                  {savedTemplates.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.displaytext || `#${t.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
        {selectedLocation ? (
          <p className="mt-2 text-sm text-stone-600">
            Save puts this page on{" "}
            <span className="font-semibold text-appointza-navy">
              {selectedLocation.name || selectedLocation.city || "your shop"}
            </span>
            .
          </p>
        ) : null}

        <div className="mt-3 grid grid-cols-3 gap-2">
          <TemplateVariablesCopyDialog
            triggerClassName="h-11 w-full justify-center md:h-10"
            triggerLabel="AI prompt"
            locationId={selectedLocation?.id}
            locationName={selectedLocation?.name}
          />
          <Button
            type="button"
            variant={builderMode === "html" ? "default" : "outline"}
            className={cn(
              "h-11 min-w-0 md:h-10",
              builderMode === "html" && "bg-blue-600 text-white hover:bg-blue-700",
            )}
            onClick={() => switchMode("html")}
          >
            <Code2 className="mr-1.5 h-4 w-4 shrink-0" />
            HTML
          </Button>
          <Button
            type="button"
            variant={
              builderMode === "html" ?
                showPreview ? "default" : "outline"
              : simplePane === "look" ?
                "default"
              : "outline"
            }
            className={cn(
              "h-11 min-w-0 md:h-10",
              (builderMode === "html" ? showPreview : simplePane === "look") &&
                "bg-blue-600 text-white hover:bg-blue-700",
            )}
            onClick={() => {
              setShowPreview(true);
              setSimplePane("look");
            }}
          >
            <Eye className="mr-1.5 h-4 w-4 shrink-0" />
            Preview
          </Button>
        </div>
      </header>

      {builderMode === "html" ? (
        <div
          className={cn(
            "grid min-h-0 flex-1",
            showPreview
              ? "grid-cols-1 grid-rows-[minmax(40vh,1fr)_minmax(40vh,1fr)] lg:grid-cols-2 lg:grid-rows-1"
              : "grid-cols-1",
          )}
        >
          <section className="flex min-h-0 flex-col overflow-hidden border-b border-stone-200 lg:border-b-0 lg:border-r">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-stone-100 bg-stone-50/80 px-3 py-2">
              <p className="text-sm font-semibold text-appointza-navy">Paste code here</p>
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => switchMode("blocks")}>
                Back to pieces
              </Button>
            </div>
            <Textarea
              className="min-h-0 flex-1 resize-none rounded-none border-0 font-mono text-xs leading-relaxed focus-visible:ring-0 sm:text-sm"
              value={html}
              onChange={(e) => applyHtmlEditorContent(e.target.value)}
              placeholder={"<!DOCTYPE html>\n<html>\n  <head>...</head>\n  <body>...</body>\n</html>"}
              spellCheck={false}
            />
          </section>
          {showPreview ? (
            <div className="flex min-h-0 flex-col overflow-hidden p-0 lg:p-3">{previewPanel}</div>
          ) : null}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="hidden shrink-0 border-b border-stone-200 bg-white p-2 md:flex lg:hidden">
            {(
              [
                { id: "add" as const, label: "Add pieces", icon: Plus },
                { id: "change" as const, label: "Change pieces", icon: Pencil },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setToolSide(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold",
                  toolSide === tab.id ? "bg-blue-600 text-white" : "text-stone-600 hover:bg-stone-50",
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(16rem,38%)_minmax(0,1fr)] lg:grid-cols-[13.75rem_minmax(0,1fr)_16.5rem] xl:grid-cols-[15rem_minmax(0,1fr)_18rem]">
          <aside
            className={cn(
              "min-h-0 flex-col overflow-hidden border-stone-200 bg-white md:border-r",
              simplePane === "add" ? "flex" : "hidden",
              toolSide === "add" ? "md:flex" : "md:hidden",
              "lg:flex",
            )}
          >
            <div className="flex shrink-0 gap-1 border-b border-stone-100 p-2">
              {(
                [
                  { id: "blocks" as const, label: "Pieces", icon: Plus },
                  { id: "media" as const, label: "Photos", icon: Images },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLeftTab(tab.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition",
                    leftTab === tab.id
                      ? "bg-orange-50 text-orange-700"
                      : "text-stone-500 hover:bg-stone-50",
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {leftTab === "media" ? (
                <LocationTemplateMediaPanel
                  organisationId={organisationId || selectedLocation?.organisationid || 0}
                  location={selectedLocation}
                  onSaved={(savedLocation) => {
                    queryClient.setQueryData<OrganisationLocation[]>(
                      locationsQueryKey,
                      (current) =>
                        (current ?? locations).map((location) =>
                          location.id === savedLocation.id ? savedLocation : location,
                        ),
                    );
                    setPreviewSiteData((current) =>
                      current
                        ? {
                            ...current,
                            locationdetail: {
                              ...current.locationdetail,
                              images: savedLocation.images ?? [],
                              attributes: savedLocation.attributes ?? {},
                            },
                          }
                        : current,
                    );
                  }}
                />
              ) : (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed text-stone-600">
                      Tap a piece to add it. Green pieces fill in your real services by themselves.
                    </p>
                    <TemplateVariablesCopyDialog
                      triggerClassName="h-11 w-full justify-center"
                      triggerLabel="Ask AI for help"
                      locationId={selectedLocation?.id}
                      locationName={selectedLocation?.name}
                    />
                  </div>
                  {TEMPLATE_BUILDER_CATEGORIES.map((cat) => (
                    <div key={cat.name}>
                      {cat.name === "Hero / Banner" ? (
                        <HeroBlockPalette blocks={cat.blocks} onAdd={handleAddBlock} />
                      ) : (
                        <>
                          <p
                            className={cn(
                              "mb-2 text-[11px] font-semibold uppercase tracking-wide",
                              cat.name.startsWith("Live") ? "text-emerald-700" : "text-stone-500",
                            )}
                          >
                            {cat.name}
                          </p>
                          <div className="space-y-1.5">
                            {cat.blocks.map((bt) => (
                              <button
                                key={bt.type}
                                type="button"
                                onClick={() => handleAddBlock(bt.type)}
                                className={cn(
                                  "flex w-full items-start gap-2 rounded-xl border bg-white px-2.5 py-2 text-left transition hover:border-orange-300 hover:bg-orange-50/40",
                                  bt.mode === "appointza"
                                    ? "border-emerald-100"
                                    : "border-stone-200",
                                )}
                              >
                                <span
                                  className={cn(
                                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
                                    bt.mode === "appointza"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-stone-100 text-stone-600",
                                  )}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-appointza-navy">
                                    {bt.name}
                                  </span>
                                  <span className="block text-[11px] text-stone-500">
                                    {bt.description}
                                  </span>
                                  {bt.mode === "appointza" ? (
                                    <span className="mt-1 inline-flex rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                      Fills in for you
                                    </span>
                                  ) : null}
                                </span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <div
            className={cn(
              "min-h-0 flex-col overflow-hidden p-0 md:p-3",
              simplePane === "look" ? "flex" : "hidden",
              "md:flex",
            )}
          >
            {previewPanel}
          </div>

          <aside
            className={cn(
              "min-h-0 flex-col overflow-hidden border-stone-200 bg-white md:border-l",
              simplePane === "change" ? "flex" : "hidden",
              toolSide === "change" ? "md:flex" : "md:hidden",
              "lg:flex",
            )}
          >
            <div className="flex shrink-0 gap-1 border-b border-stone-100 p-2">
              {(
                [
                  { id: "sections" as const, label: "List" },
                  { id: "settings" as const, label: "Edit one" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRightTab(tab.id)}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition",
                    rightTab === tab.id
                      ? "bg-orange-50 text-orange-700"
                      : "text-stone-500 hover:bg-stone-50",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {rightTab === "sections" ? (
                <TemplateBuilderStructurePanel
                  blocks={blocks}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={openChangePane}
                  onToggleVisible={(id, visible) =>
                    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, visible } : b)))
                  }
                  onMove={moveBlock}
                  onDelete={(id) => {
                    setBlocks((prev) => prev.filter((b) => b.id !== id));
                    if (selectedBlockId === id) setSelectedBlockId(null);
                  }}
                  onEditBlock={openChangePane}
                />
              ) : selectedBlock ? (
                <TemplateBuilderBlockEditor
                  block={selectedBlock}
                  jsonDraft={jsonDraft}
                  onJsonDraftChange={setJsonDraft}
                  onUpdate={(patch) => updateBlockData(selectedBlock.id, patch)}
                  onApplyJson={applyJsonDraft}
                  onResetJson={() => setJsonDraft(JSON.stringify(selectedBlock.data, null, 2))}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-10 text-center">
                  <p className="text-sm font-medium text-stone-700">Tap a piece in List</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Then you can change its words and pictures.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
          <nav className="grid shrink-0 grid-cols-3 border-t border-stone-200 bg-white md:hidden" aria-label="Page steps">
            {(
              [
                { id: "add" as const, label: "Add", icon: Plus },
                { id: "look" as const, label: "Look", icon: Eye },
                { id: "change" as const, label: "Change", icon: Pencil },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSimplePane(tab.id);
                  if (tab.id === "add") setToolSide("add");
                  if (tab.id === "change") setToolSide("change");
                }}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 text-xs font-semibold",
                  simplePane === tab.id ? "bg-blue-50 text-blue-700" : "text-stone-500",
                )}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

export default TemplateBuilderInner;
