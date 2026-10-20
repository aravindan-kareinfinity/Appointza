import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { FilesService } from "@/services/files.service";
import {
  ORG_TEMPLATE_ASSETS_IDENTIFIER,
  type OrgTemplateAsset,
} from "@/types/orgAssets.types";
import {
  createEmptyAssetCatalog,
  mergeAssets,
  parseOrgAssetCatalog,
  serializeOrgAssetCatalog,
} from "@/utils/templateBuilder/orgAssetsStorage";

const TEMPLATE_REFERENCE_TYPE_ID = 5;

type OrgTemplateAssetsContextValue = {
  assets: OrgTemplateAsset[];
  isLoading: boolean;
  isSaving: boolean;
  catalogId: number;
  getImageUrl: (id: number) => string;
  refresh: () => Promise<void>;
  ensureLoaded: () => Promise<void>;
  registerFileIds: (ids: number[], names?: string[]) => Promise<void>;
  uploadFiles: (files: File[]) => Promise<number[]>;
  removeAsset: (id: number) => Promise<void>;
  renameAsset: (id: number, name: string) => Promise<void>;
};

const OrgTemplateAssetsContext = createContext<OrgTemplateAssetsContextValue | null>(null);

export function OrgTemplateAssetsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const refService = useMemo(() => new ReferenceValueService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  const [assets, setAssets] = useState<OrgTemplateAsset[]>([]);
  const [catalogId, setCatalogId] = useState(0);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  const orgId = user?.organisationid || 0;

  const persistCatalog = useCallback(
    async (nextAssets: OrgTemplateAsset[]) => {
      if (!orgId) return;
      setIsSaving(true);
      try {
        const payload = new ReferenceValue();
        payload.id = catalogId;
        payload.referencetypeid = TEMPLATE_REFERENCE_TYPE_ID;
        payload.identifier = ORG_TEMPLATE_ASSETS_IDENTIFIER;
        payload.displaytext = "Template assets";
        payload.description = "";
        payload.notes = serializeOrgAssetCatalog({ version: 1, assets: nextAssets });
        payload.isactive = true;
        payload.organizationid = orgId;
        payload.version = catalogVersion;

        const saved = await refService.save(payload);
        if (saved?.id) {
          setCatalogId(saved.id);
          setCatalogVersion(saved.version ?? catalogVersion);
        }
        setAssets(nextAssets);
      } catch {
        toast({ title: "Could not save assets", variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    },
    [catalogId, catalogVersion, orgId, refService, toast],
  );

  const refresh = useCallback(async () => {
    if (!orgId) {
      setAssets([]);
      return;
    }
    setIsLoading(true);
    try {
      const req = new ReferenceValueSelectReq();
      req.referencetypeid = TEMPLATE_REFERENCE_TYPE_ID;
      req.organisationid = orgId;
      req.identifier = ORG_TEMPLATE_ASSETS_IDENTIFIER;
      const rows = await refService.select(req);
      const row = rows?.find((r) => r.identifier === ORG_TEMPLATE_ASSETS_IDENTIFIER) ?? rows?.[0];
      if (row) {
        setCatalogId(row.id);
        setCatalogVersion(row.version ?? 0);
        setAssets(parseOrgAssetCatalog(row.notes).assets);
      } else {
        setCatalogId(0);
        setCatalogVersion(0);
        setAssets(createEmptyAssetCatalog().assets);
      }
      setCatalogLoaded(true);
    } catch {
      toast({ title: "Could not load assets", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [orgId, refService, toast]);

  const ensureLoaded = useCallback(async () => {
    if (catalogLoaded || !orgId) return;
    await refresh();
  }, [catalogLoaded, orgId, refresh]);

  const registerFileIds = useCallback(
    async (ids: number[], names?: string[]) => {
      if (!catalogLoaded) {
        await refresh();
      }
      const now = new Date().toISOString();
      const incoming: OrgTemplateAsset[] = ids
        .map((id, i) => ({
          id,
          name: names?.[i]?.trim() || `Image #${id}`,
          addedAt: now,
        }))
        .filter((a) => a.id > 0);
      if (incoming.length === 0) return;
      const merged = mergeAssets(assets, incoming);
      await persistCatalog(merged);
    },
    [assets, catalogLoaded, persistCatalog, refresh],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!catalogLoaded) {
        await refresh();
      }
      const ids = await filesService.upload(files);
      if (!ids?.length) throw new Error("Upload failed");
      await registerFileIds(
        ids,
        files.map((f) => f.name),
      );
      return ids;
    },
    [catalogLoaded, filesService, refresh, registerFileIds],
  );

  const removeAsset = useCallback(
    async (id: number) => {
      const next = assets.filter((a) => a.id !== id);
      await persistCatalog(next);
    },
    [assets, persistCatalog],
  );

  const renameAsset = useCallback(
    async (id: number, name: string) => {
      const nextName = name.trim();
      if (!nextName) return;
      const current = assets.find((a) => a.id === id);
      if (!current || current.name === nextName) return;
      const next = assets.map((a) => (a.id === id ? { ...a, name: nextName } : a));
      await persistCatalog(next);
    },
    [assets, persistCatalog],
  );

  const value = useMemo(
    () => ({
      assets,
      isLoading,
      isSaving,
      catalogId,
      getImageUrl: (id: number) => filesService.getImageUrl(id),
      refresh,
      ensureLoaded,
      registerFileIds,
      uploadFiles,
      removeAsset,
      renameAsset,
    }),
    [
      assets,
      catalogId,
      filesService,
      isLoading,
      isSaving,
      ensureLoaded,
      refresh,
      registerFileIds,
      removeAsset,
      renameAsset,
      uploadFiles,
    ],
  );

  return (
    <OrgTemplateAssetsContext.Provider value={value}>{children}</OrgTemplateAssetsContext.Provider>
  );
}

export function useOrgTemplateAssets() {
  const ctx = useContext(OrgTemplateAssetsContext);
  if (!ctx) {
    throw new Error("useOrgTemplateAssets must be used within OrgTemplateAssetsProvider");
  }
  return ctx;
}
