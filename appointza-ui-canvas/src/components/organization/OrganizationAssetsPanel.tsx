import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, Pencil, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useOrgTemplateAssets } from "@/contexts/OrgTemplateAssetsContext";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import type { OrgTemplateAsset } from "@/types/orgAssets.types";

function AssetCard({
  asset,
  imageUrl,
  busy,
  onCopyId,
  onRemove,
  onRename,
}: {
  asset: OrgTemplateAsset;
  imageUrl: string;
  busy: boolean;
  onCopyId: () => void;
  onRemove: () => void;
  onRename: (name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(asset.name);
  const [savingName, setSavingName] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(asset.name);
  }, [asset.name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitRename = async () => {
    const next = draft.trim();
    if (!next || next === asset.name) {
      setDraft(asset.name);
      setEditing(false);
      return;
    }
    setSavingName(true);
    try {
      await onRename(next);
      setEditing(false);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-none">
      <div className="relative aspect-square bg-[#f8fafc]">
        <img
          src={imageUrl}
          alt={asset.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="space-y-2 border-t border-[#e6eaf0] px-3 py-2.5">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <Input
              ref={inputRef}
              value={draft}
              disabled={savingName || busy}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void commitRename();
                }
                if (e.key === "Escape") {
                  setDraft(asset.name);
                  setEditing(false);
                }
              }}
              className={cn(org.input, "h-8 flex-1 text-[13px]")}
              aria-label="Image name"
            />
            <button
              type="button"
              disabled={savingName || busy}
              onClick={() => void commitRename()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#528ff0] text-white hover:bg-[#3d7ae8] disabled:opacity-50"
              aria-label="Save name"
            >
              {savingName ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              disabled={savingName || busy}
              onClick={() => {
                setDraft(asset.name);
                setEditing(false);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#e6eaf0] text-[#667085] hover:bg-[#f8fafc]"
              aria-label="Cancel rename"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#1a1a1a]" title={asset.name}>
              {asset.name || `Image #${asset.id}`}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditing(true)}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#7a8494] transition-colors hover:bg-[#eef4ff] hover:text-[#2a5af5]"
              aria-label={`Rename ${asset.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="inline-flex min-w-0 items-center gap-1 truncate font-mono text-[11px] text-[#2a5af5] hover:underline"
            onClick={onCopyId}
            title="Copy file id"
          >
            <Copy className="h-3 w-3 shrink-0" />
            id: {asset.id}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#98a2b3] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label={`Remove ${asset.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function OrganizationAssetsPanel() {
  const {
    assets,
    isLoading,
    isSaving,
    getImageUrl,
    refresh,
    uploadFiles,
    removeAsset,
    renameAsset,
    ensureLoaded,
  } = useOrgTemplateAssets();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) {
      toast({
        title: "Invalid file",
        description: "Choose image files only (JPG, PNG, WebP, etc.).",
        variant: "destructive",
      });
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      toast({
        title: "File too large",
        description: "Each image must be under 5 MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      await uploadFiles(files);
      toast({
        title: "Uploaded",
        description: `${files.length} image${files.length === 1 ? "" : "s"} added.`,
      });
    } catch {
      toast({ title: "Upload failed", description: "Could not upload images.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const copyId = async (id: number) => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ title: "Copied", description: `File id ${id} copied.` });
    } catch {
      toast({ title: "File id", description: String(id) });
    }
  };

  return (
    <div className={cn(org.pageSection, "space-y-4 pb-6 pt-4")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#1a1a1a]">Image library</p>
          <p className="text-[12px] text-[#667085]">
            Upload images, rename them, and reuse across your site.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              void handleUpload(event.target.files);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#528ff0] px-3 text-[13px] font-semibold text-white hover:bg-[#3d7ae8]"
            disabled={uploading || isSaving}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Upload
          </Button>
          <Button
            type="button"
            variant="outline"
            className={org.btnOutline}
            disabled={isLoading || isSaving}
            onClick={() => void refresh()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-[#667085]">
          <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
          Loading images…
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e6eaf0] bg-white py-12 text-center">
          <Upload className="mb-3 h-10 w-10 text-[#c5ccd6]" aria-hidden />
          <p className="text-[14px] font-semibold text-[#1a1a1a]">No images yet</p>
          <p className="mt-1 text-[13px] text-[#667085]">Upload images to build your library.</p>
          <Button
            type="button"
            className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#528ff0] px-3 text-[13px] font-semibold text-white hover:bg-[#3d7ae8]"
            disabled={uploading || isSaving}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload images
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              imageUrl={getImageUrl(asset.id)}
              busy={isSaving}
              onCopyId={() => void copyId(asset.id)}
              onRemove={() => void removeAsset(asset.id)}
              onRename={async (name) => {
                await renameAsset(asset.id, name);
                toast({ title: "Renamed", description: `Saved as “${name.trim()}”.` });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
