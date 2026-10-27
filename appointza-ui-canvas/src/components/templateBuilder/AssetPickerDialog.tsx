import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrgTemplateAssets } from "@/contexts/OrgTemplateAssetsContext";

type AssetPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (fileId: number) => void;
  title?: string;
};

export function AssetPickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Choose from assets",
}: AssetPickerDialogProps) {
  const { assets, isLoading, isSaving, getImageUrl, ensureLoaded, uploadFiles } =
    useOrgTemplateAssets();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    void ensureLoaded();
  }, [open, ensureLoaded]);

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
      const ids = await uploadFiles(files);
      toast({
        title: "Uploaded",
        description: `${files.length} image${files.length === 1 ? "" : "s"} added to Assets.`,
      });
      // Select the first newly uploaded image so the user can keep going.
      if (ids?.[0]) {
        onSelect(ids[0]);
        if (files.length === 1) onOpenChange(false);
      }
    } catch {
      toast({
        title: "Upload failed",
        description: "Could not upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const busy = uploading || isSaving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[110] max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl"
        overlayClassName="z-[110]"
      >
        <DialogHeader>
          <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
            <div className="min-w-0 space-y-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                Upload new images or pick one from your Assets library.
              </DialogDescription>
            </div>
            <div>
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
                size="sm"
                className="h-9 rounded-md border border-[#528ff0] bg-[#528ff0] text-white hover:bg-[#3d7ae8]"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                )}
                Upload new images
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading assets…
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#dbe4f0] bg-[#f8fafc] py-10 text-center">
            <Upload className="mb-3 h-9 w-9 text-[#c5ccd6]" aria-hidden />
            <p className="text-sm font-medium text-[#1a1a1a]">No images yet</p>
            <p className="mt-1 text-xs text-[#667085]">Upload images to use them here.</p>
            <Button
              type="button"
              className="mt-4 h-9 rounded-md border border-[#528ff0] bg-[#528ff0] text-white hover:bg-[#3d7ae8]"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-3.5 w-3.5" />
              )}
              Upload new images
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                disabled={busy}
                className="group overflow-hidden rounded-xl border border-gray-200 text-left transition hover:border-[#528ff0] hover:ring-2 hover:ring-[#528ff0]/25 disabled:opacity-60"
                onClick={() => {
                  onSelect(asset.id);
                  onOpenChange(false);
                }}
              >
                <img
                  src={getImageUrl(asset.id)}
                  alt={asset.name}
                  className="aspect-square w-full object-cover"
                />
                <div className="border-t bg-white px-2 py-1.5">
                  <p className="truncate text-[11px] font-medium text-gray-800">{asset.name}</p>
                  <p className="text-[10px] text-gray-500">id: {asset.id}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
