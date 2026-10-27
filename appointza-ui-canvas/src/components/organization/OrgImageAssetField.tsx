import { useRef, useState } from "react";
import { Images, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useOrgTemplateAssets } from "@/contexts/OrgTemplateAssetsContext";
import { AssetPickerDialog } from "@/components/templateBuilder/AssetPickerDialog";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

export type OrgImageAssetFieldProps = {
  label?: string;
  description?: string;
  imageIds: number[];
  onChange: (imageIds: number[]) => void;
  maxImages?: number;
  multiple?: boolean;
  className?: string;
  idPrefix?: string;
  disabled?: boolean;
};

export function OrgImageAssetField({
  label = "Images",
  description,
  imageIds,
  onChange,
  maxImages,
  multiple = true,
  className,
  disabled = false,
}: OrgImageAssetFieldProps) {
  const { getImageUrl, uploadFiles, isSaving } = useOrgTemplateAssets();
  const { toast } = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const limit = multiple ? maxImages : 1;
  const atLimit = limit != null && imageIds.length >= limit;
  const canAdd = !disabled && !atLimit;

  const addIds = (incoming: number[]) => {
    const unique = incoming.filter((id) => id > 0);
    if (unique.length === 0) return;

    if (!multiple) {
      onChange([unique[0]]);
      return;
    }

    const merged = [...imageIds];
    for (const id of unique) {
      if (!merged.includes(id)) merged.push(id);
    }
    onChange(limit != null ? merged.slice(0, limit) : merged);
  };

  const handleDirectUpload = async (fileList: FileList | null) => {
    if (!fileList?.length || !canAdd) return;
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
      addIds(ids ?? []);
      toast({
        title: "Uploaded",
        description: `${files.length} image${files.length === 1 ? "" : "s"} added.`,
      });
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

  const removeId = (id: number) => {
    onChange(imageIds.filter((item) => item !== id));
  };

  return (
    <div className={cn("grid gap-2", className)}>
      {label ? <Label className={org.label}>{label}</Label> : null}
      {description ? <p className="text-xs text-stone-500">{description}</p> : null}

      {imageIds.length > 0 ? (
        <div
          className={cn(
            "grid gap-3",
            multiple ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "max-w-xs grid-cols-1",
          )}
        >
          {imageIds.map((id) => (
            <div
              key={id}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-stone-100 bg-appointza-cream/50"
            >
              <img
                src={getImageUrl(id)}
                alt={`Image ${id}`}
                className="h-full w-full object-cover"
              />
              {!disabled ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute right-2 top-2 h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removeId(id)}
                  aria-label={`Remove image ${id}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              ) : null}
              <span className="absolute bottom-2 left-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] text-white">
                id: {id}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {canAdd ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            className="hidden"
            onChange={(event) => {
              void handleDirectUpload(event.target.files);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            className="min-h-10 rounded-md border border-[#528ff0] bg-[#528ff0] text-white hover:bg-[#3d7ae8]"
            disabled={disabled || uploading || isSaving}
            onClick={() => uploadInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload new images
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || uploading}
            className={cn(org.btnOutline, "min-h-10")}
            onClick={() => setPickerOpen(true)}
          >
            <Images className="mr-2 h-4 w-4" />
            Choose from assets
          </Button>
          {limit != null ? (
            <span className="text-xs text-stone-500">
              {imageIds.length}/{limit}
            </span>
          ) : null}
        </div>
      ) : null}

      <AssetPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={multiple ? "Choose images from assets" : "Choose image from assets"}
        onSelect={(id) => {
          if (multiple && imageIds.includes(id)) {
            toast({ title: "Already added", description: `Image ${id} is already selected.` });
            return;
          }
          addIds([id]);
          if (!multiple) setPickerOpen(false);
        }}
      />
    </div>
  );
}
