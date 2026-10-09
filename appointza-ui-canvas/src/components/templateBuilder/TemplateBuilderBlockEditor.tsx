import { useState } from "react";
import { ChevronDown, Database, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TemplateBuilderBlock } from "@/types/templateBuilder.types";
import { getBlockMeta } from "@/utils/templateBuilder/catalog";
import { BlockImageUploadField } from "@/components/templateBuilder/BlockImageUploadField";
import { BlockGalleryUploadField } from "@/components/templateBuilder/BlockGalleryUploadField";
import { BlockTeamMembersField, normalizeTeamMembers } from "@/components/templateBuilder/BlockTeamMembersField";
import { BlockBackgroundField } from "@/components/templateBuilder/BlockBackgroundField";
import { BLOCK_BACKGROUND_DEFAULTS } from "@/utils/templateBuilder/blockBackground";
import { blockNeedsGalleryField } from "@/utils/templateBuilder/imageRefs";

const VARIANT_LABELS: Record<number, string> = {
  1: "Classic",
  2: "Modern",
  3: "Compact",
  4: "Bold",
};

type TemplateBuilderBlockEditorProps = {
  block: TemplateBuilderBlock;
  jsonDraft: string;
  onJsonDraftChange: (value: string) => void;
  onUpdate: (patch: Record<string, unknown>) => void;
  onApplyJson: () => void;
  onResetJson: () => void;
};

export function TemplateBuilderBlockEditor({
  block,
  jsonDraft,
  onJsonDraftChange,
  onUpdate,
  onApplyJson,
  onResetJson,
}: TemplateBuilderBlockEditorProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const meta = getBlockMeta(block.type);
  const isLiveData = block.type.startsWith("appointza-");

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-3">
        <p className="text-sm font-semibold text-appointza-navy">{meta?.name ?? block.type}</p>
        <p className="mt-0.5 text-xs text-stone-500">{meta?.description}</p>
      </div>

      {"variant" in block.data && (
        <div>
          <Label className="text-sm">Layout style</Label>
          <p className="mt-0.5 text-xs text-stone-500">Pick how this section looks on the page.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((n) => {
              const current = Number((block.data as { variant?: number }).variant ?? 1);
              const selected = current === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onUpdate({ variant: n })}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    selected
                      ? "border-orange-500 bg-orange-50 ring-2 ring-orange-500/20"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <span className="text-sm font-semibold text-stone-900">
                    {VARIANT_LABELS[n] ?? `Style ${n}`}
                  </span>
                  {selected ? (
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      Selected
                    </Badge>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {block.type === "appointza-organization" && (
        <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${block.id}-show-logo`} className="text-sm">
              Show logo
            </Label>
            <Switch
              id={`${block.id}-show-logo`}
              checked={(block.data as { showLogo?: boolean }).showLogo !== false}
              onCheckedChange={(checked) => onUpdate({ showLogo: checked })}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor={`${block.id}-show-gst`} className="text-sm">
                Show GST number
              </Label>
              <p className="text-xs text-stone-500">Hidden automatically if no GST number is saved.</p>
            </div>
            <Switch
              id={`${block.id}-show-gst`}
              checked={(block.data as { showGst?: boolean }).showGst === true}
              onCheckedChange={(checked) => onUpdate({ showGst: checked })}
            />
          </div>
        </div>
      )}

      {isLiveData ? (
        <div className="flex gap-3 rounded-xl border border-sky-100 bg-sky-50/80 p-3">
          <Database className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          <div className="text-sm text-sky-950">
            <p className="font-medium">Fills in automatically</p>
            <p className="mt-1 text-xs leading-relaxed text-sky-900/90">
              This section shows your real organisation info, services, events, and reviews when
              customers open your booking page. Choose a layout style above — no manual data entry
              needed.
            </p>
          </div>
        </div>
      ) : (
        <>
          {!block.type.startsWith("float-") && (
            <BlockBackgroundField
              hideImageUpload={block.type === "hero-2" || block.type === "hero-5"}
              backgroundColor={String(
                (block.data as { backgroundColor?: string }).backgroundColor ??
                  BLOCK_BACKGROUND_DEFAULTS.backgroundColor,
              )}
              backgroundImageId={Number(
                (block.data as { backgroundImageId?: number }).backgroundImageId ?? 0,
              )}
              backgroundImage={String(
                (block.data as { backgroundImage?: string }).backgroundImage ?? "",
              )}
              backgroundOverlay={Boolean(
                (block.data as { backgroundOverlay?: boolean }).backgroundOverlay,
              )}
              backgroundOverlayOpacity={Number(
                (block.data as { backgroundOverlayOpacity?: number }).backgroundOverlayOpacity ??
                  BLOCK_BACKGROUND_DEFAULTS.backgroundOverlayOpacity,
              )}
              onChange={onUpdate}
            />
          )}

          {"title" in block.data && (
            <div>
              <Label>Heading</Label>
              <Input
                className="mt-1 rounded-xl"
                value={String(block.data.title ?? "")}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Section title"
              />
            </div>
          )}
          {"subtitle" in block.data && (
            <div>
              <Label>Subheading</Label>
              <Input
                className="mt-1 rounded-xl"
                value={String(block.data.subtitle ?? "")}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                placeholder="Short description"
              />
            </div>
          )}
          {"content" in block.data && (
            <div>
              <Label>Body text</Label>
              <Textarea
                className="mt-1 rounded-xl"
                rows={4}
                value={String(block.data.content ?? "")}
                onChange={(e) => onUpdate({ content: e.target.value })}
                placeholder="Write your content here…"
              />
            </div>
          )}
          {"buttonText" in block.data && (
            <div>
              <Label>Button label</Label>
              <Input
                className="mt-1 rounded-xl"
                value={String(block.data.buttonText ?? "")}
                onChange={(e) => onUpdate({ buttonText: e.target.value })}
                placeholder="Book now"
              />
            </div>
          )}
          {"secondaryButtonText" in block.data && (
            <div>
              <Label>Second button label</Label>
              <Input
                className="mt-1 rounded-xl"
                value={String((block.data as { secondaryButtonText?: string }).secondaryButtonText ?? "")}
                onChange={(e) => onUpdate({ secondaryButtonText: e.target.value })}
              />
            </div>
          )}
          {"image" in block.data && (
            <BlockImageUploadField
              label={
                block.type === "hero-2" || block.type === "hero-5" ? "Side image" : "Image"
              }
              imageId={Number((block.data as { imageId?: number }).imageId ?? 0)}
              imageUrl={String((block.data as { image?: string }).image ?? "")}
              onChange={(next) =>
                onUpdate({
                  ...next,
                  ...(block.type === "hero-2" || block.type === "hero-5"
                    ? { backgroundImageId: 0, backgroundImage: "", backgroundOverlay: false }
                    : {}),
                })
              }
            />
          )}
          {blockNeedsGalleryField(block.data) && (
            <BlockGalleryUploadField
              imageIds={
                Array.isArray((block.data as { imageIds?: number[] }).imageIds)
                  ? ((block.data as { imageIds?: number[] }).imageIds as number[])
                  : []
              }
              images={
                Array.isArray((block.data as { images?: string[] }).images)
                  ? ((block.data as { images?: string[] }).images as string[])
                  : []
              }
              onChange={onUpdate}
            />
          )}
          {block.type === "team" && (
            <BlockTeamMembersField
              members={normalizeTeamMembers((block.data as { members?: unknown }).members)}
              onChange={(members) => onUpdate({ members })}
            />
          )}
          {"videoUrl" in block.data && (
            <div>
              <Label>Background video URL</Label>
              <Input
                className="mt-1 rounded-xl"
                value={String((block.data as { videoUrl?: string }).videoUrl ?? "")}
                onChange={(e) => onUpdate({ videoUrl: e.target.value })}
                placeholder="https://…/video.mp4"
              />
            </div>
          )}
          {block.type === "policy" && (
            <div>
              <Label>Policy type</Label>
              <Select
                value={String((block.data as { policyType?: string }).policyType ?? "cancellation")}
                onValueChange={(v) =>
                  onUpdate({
                    policyType: v,
                    title:
                      v === "terms"
                        ? "Terms & conditions"
                        : v === "privacy"
                          ? "Privacy policy"
                          : "Cancellation policy",
                  })
                }
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cancellation">Cancellation</SelectItem>
                  <SelectItem value="terms">Terms</SelectItem>
                  <SelectItem value="privacy">Privacy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="w-full justify-between px-0 text-stone-600">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  Advanced options
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              <p className="text-[11px] text-stone-500">
                For power users — edit raw block data as JSON.
              </p>
              <Textarea
                className="h-36 font-mono text-xs"
                value={jsonDraft}
                onChange={(e) => onJsonDraftChange(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onResetJson}>
                  Reset
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={onApplyJson}
                >
                  Apply changes
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
}
