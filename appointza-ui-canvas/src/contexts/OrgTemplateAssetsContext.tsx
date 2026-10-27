import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
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

type CatalogSnapshot = {
  assets: OrgTemplateAsset[];
  catalogId: number;
  catalogVersion: number;
};

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
  const snapshotRef = useRef<CatalogSnapshot>({
    assets: [],
    catalogId: 0,
    catalogVersion: 0,
  });

  const applySnapshot = useCallback((snap: CatalogSnapshot) => {
    snapshotRef.current = snap;
    setAssets(snap.assets);
    setCatalogId(snap.catalogId);
    setCatalogVersion(snap.catalogVersion);
  }, []);

  const loadCatalog = useCallback(async (): Promise<CatalogSnapshot> => {
    if (!orgId) {
      const empty: CatalogSnapshot = {
        assets: [],
        catalogId: 0,
        catalogVersion: 0,
      };
      applySnapshot(empty);
      setCatalogLoaded(true);
      return empty;
    }

    const req = new ReferenceValueSelectReq();
    req.referencetypeid = TEMPLATE_REFERENCE_TYPE_ID;
    req.organisationid = orgId;
    req.identifier = ORG_TEMPLATE_ASSETS_IDENTIFIER;
    const rows = await refService.select(req);
    // Never fall back to a website template row — that would wipe template notes.
    const row = rows?.find((r) => r.identifier === ORG_TEMPLATE_ASSETS_IDENTIFIER);
    const snap: CatalogSnapshot = row
      ? {
          assets: parseOrgAssetCatalog(row.notes).assets,
          catalogId: row.id,
          catalogVersion: row.version ?? 0,
        }
      : {
          assets: createEmptyAssetCatalog().assets,
          catalogId: 0,
          catalogVersion: 0,
        };
    applySnapshot(snap);
    setCatalogLoaded(true);
    return snap;
  }, [applySnapshot, orgId, refService]);

  const persistCatalog = useCallback(
    async (nextAssets: OrgTemplateAsset[], meta?: Pick<CatalogSnapshot, "catalogId" | "catalogVersion">) => {
      if (!orgId) {
        throw new Error("Organisation is required to save assets.");
      }
      const id = meta?.catalogId ?? snapshotRef.current.catalogId;
      const version = meta?.catalogVersion ?? snapshotRef.current.catalogVersion;
      setIsSaving(true);
      try {
        const payload = new ReferenceValue();
        payload.id = id;
        payload.referencetypeid = TEMPLATE_REFERENCE_TYPE_ID;
        payload.identifier = ORG_TEMPLATE_ASSETS_IDENTIFIER;
        payload.displaytext = "Template assets";
        payload.description = "";
        payload.notes = serializeOrgAssetCatalog({ version: 1, assets: nextAssets });
        payload.isactive = true;
        payload.organizationid = orgId;
        payload.version = version;

        const saved = await refService.save(payload);
        const snap: CatalogSnapshot = {
          assets: nextAssets,
          catalogId: saved?.id || id,
          catalogVersion: saved?.version ?? version,
        };
        applySnapshot(snap);
      } catch (error) {
        toast({ title: "Could not save assets", variant: "destructive" });
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [applySnapshot, orgId, refService, toast],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadCatalog();
    } catch {
      toast({ title: "Could not load assets", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [loadCatalog, toast]);

  const ensureLoaded = useCallback(async () => {
    if (catalogLoaded || !orgId) return;
    setIsLoading(true);
    try {
      await loadCatalog();
    } catch {
      toast({ title: "Could not load assets", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [catalogLoaded, loadCatalog, orgId, toast]);

  const registerFileIds = useCallback(
    async (ids: number[], names?: string[]) => {
      const incoming: OrgTemplateAsset[] = ids
        .map((id, i) => ({
          id: Number(id),
          name: names?.[i]?.trim() || `Image #${id}`,
          addedAt: new Date().toISOString(),
        }))
        .filter((a) => a.id > 0);
      if (incoming.length === 0) return;

      // Always reload before merge so we never overwrite the catalog with a stale empty list.
      const latest = await loadCatalog();
      const alreadyHave = new Set(latest.assets.map((a) => a.id));
      if (incoming.every((a) => alreadyHave.has(a.id))) {
        applySnapshot(latest);
        return;
      }
      const merged = mergeAssets(latest.assets, incoming);
      await persistCatalog(merged, latest);
    },
    [applySnapshot, loadCatalog, persistCatalog],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const ids = await filesService.upload(files);
      const list = Array.isArray(ids) ? ids.map(Number).filter((id) => id > 0) : [];
      if (!list.length) throw new Error("Upload failed");
      await registerFileIds(
        list,
        files.map((f) => f.name),
      );
      return list;
    },
    [filesService, registerFileIds],
  );

  const removeAsset = useCallback(
    async (id: number) => {
      const latest = await loadCatalog();
      const next = latest.assets.filter((a) => a.id !== id);
      await persistCatalog(next, latest);
    },
    [loadCatalog, persistCatalog],
  );

  const renameAsset = useCallback(
    async (id: number, name: string) => {
      const nextName = name.trim();
      if (!nextName) return;
      const latest = await loadCatalog();
      const current = latest.assets.find((a) => a.id === id);
      if (!current || current.name === nextName) return;
      const next = latest.assets.map((a) => (a.id === id ? { ...a, name: nextName } : a));
      await persistCatalog(next, latest);
    },
    [loadCatalog, persistCatalog],
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
