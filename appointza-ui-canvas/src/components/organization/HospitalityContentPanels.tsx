import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Plus } from "lucide-react";
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
import { ResponsiveEditSheet } from "@/components/organization/ResponsiveEditSheet";
import {
  HospitalityFoodItem,
  HospitalityGuestService,
  HospitalityNearbyPlace,
  HospitalityPackage,
  OrganisationRoom,
  OrganisationRoomSelectReq,
  ROOM_TYPES,
  normalizeOrganisationRoom,
} from "@/models/hospitality.model";
import { hospitalityService } from "@/services/hospitality.service";
import { formatRoomTypeLabel } from "@/utils/roomAmenities.util";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

type PersistFn<T> = (items: T[]) => Promise<void>;

const hospCardClass =
  "cursor-pointer rounded-xl border border-[#e2e8f0] bg-white p-3.5 text-left shadow-none transition-colors hover:border-[#cfd8f0]";
const hospEmptyClass =
  "rounded-xl border border-dashed border-[#e6eaf0] bg-white px-4 py-10 text-center text-[13px] text-[#667085]";
const hospAddBtnClass = cn(org.btnOutline, "h-9 gap-1.5");
const hospEditBtnClass = cn(
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] bg-[#528ff0] px-3 text-[13px] font-semibold text-white hover:bg-[#3d7ae8]",
);
const hospFieldClass = cn(org.input, "h-9");
const hospLabelClass = org.label;
const hospSelectClass = cn(org.selectTrigger, "h-9");

function HospEmpty({ children }: { children: ReactNode }) {
  return <div className={hospEmptyClass}>{children}</div>;
}

function HospCard({
  title,
  meta,
  body,
  onEdit,
}: {
  title: string;
  meta?: ReactNode;
  body?: ReactNode;
  onEdit: () => void;
}) {
  return (
    <article className={hospCardClass} onClick={onEdit}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-semibold text-[#1a1a1a]">{title}</h3>
          {meta ? <div className="mt-0.5 text-[12px] text-[#667085]">{meta}</div> : null}
          {body ? <div className="mt-1.5 text-[13px] text-[#667085]">{body}</div> : null}
        </div>
        <button
          type="button"
          className={hospEditBtnClass}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          Edit
          <ArrowRight className="size-3.5 shrink-0" aria-hidden />
        </button>
      </div>
    </article>
  );
}

function useContentEditor<T>(items: T[], setItems: (items: T[]) => void) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorIndex, setEditorIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = (empty: T) => {
    setEditorIndex(null);
    setDraft(empty);
    setEditorOpen(true);
  };

  const openEdit = (index: number, item: T) => {
    setEditorIndex(index);
    setDraft({ ...item });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setEditorIndex(null);
    setDraft(null);
  };

  const saveDraft = async (onPersist: PersistFn<T>) => {
    if (draft == null) return;
    setSaving(true);
    try {
      const next = [...items];
      if (editorIndex == null) next.push(draft);
      else next[editorIndex] = draft;
      setItems(next);
      await onPersist(next);
      closeEditor();
    } finally {
      setSaving(false);
    }
  };

  const deleteDraft = async (onPersist: PersistFn<T>) => {
    if (editorIndex == null || saving) return;
    setSaving(true);
    try {
      const next = items.filter((_, index) => index !== editorIndex);
      setItems(next);
      await onPersist(next);
      closeEditor();
    } finally {
      setSaving(false);
    }
  };

  return {
    editorOpen,
    editorIndex,
    draft,
    saving,
    setDraft,
    openCreate,
    openEdit,
    closeEditor,
    saveDraft,
    deleteDraft,
  };
}

type PackagesPanelProps = {
  packages: HospitalityPackage[];
  setPackages: (items: HospitalityPackage[]) => void;
  onPersist: PersistFn<HospitalityPackage>;
  newItem: () => HospitalityPackage;
  organisationId: number;
  locationId: number;
  onAddRooms?: () => void;
};

export function HospitalityPackagesPanel({
  packages,
  setPackages,
  onPersist,
  newItem,
  organisationId,
  locationId,
  onAddRooms,
}: PackagesPanelProps) {
  const editor = useContentEditor(packages, setPackages);
  const [rooms, setRooms] = useState<OrganisationRoom[]>([]);

  useEffect(() => {
    if (organisationId <= 0 || locationId <= 0) {
      setRooms([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const req = new OrganisationRoomSelectReq();
        req.organisation_id = organisationId;
        req.organisation_location_id = locationId;
        const list = await hospitalityService.selectRooms(req);
        if (!cancelled) {
          setRooms((list ?? []).map((room) => normalizeOrganisationRoom(room)));
        }
      } catch {
        if (!cancelled) setRooms([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organisationId, locationId]);

  const matchingRooms = useMemo(() => {
    const type = (editor.draft?.room_type || "").trim().toLowerCase();
    if (!type) return rooms;
    return rooms.filter((room) => room.room_type.trim().toLowerCase() === type);
  }, [editor.draft?.room_type, rooms]);

  const title =
    editor.editorIndex != null ?
      `Edit — ${editor.draft?.name || "Package"}`
    : "Add package";

  return (
    <>
      <div className="space-y-3">
        {packages.length === 0 ?
          <HospEmpty>No packages yet. Tap Add package to create one.</HospEmpty>
        : <div className="grid gap-2 sm:grid-cols-2">
            {packages.map((pkg, index) => (
              <HospCard
                key={pkg.id || index}
                title={pkg.name || "Untitled package"}
                meta={pkg.price || undefined}
                body={
                  <>
                    <p className="line-clamp-2">
                      {pkg.description || "No description"}
                    </p>
                    <p className="mt-1 text-[12px] text-[#98a2b3]">
                      {pkg.room_type
                        ? `Rooms: ${formatRoomTypeLabel(pkg.room_type)}`
                        : "Rooms: any type"}
                    </p>
                  </>
                }
                onEdit={() => editor.openEdit(index, pkg)}
              />
            ))}
          </div>
        }
        <Button type="button" variant="outline" className={hospAddBtnClass} onClick={() => editor.openCreate(newItem())}>
          <Plus className="h-3.5 w-3.5" />
          Add package
        </Button>
      </div>

      {editor.draft ?
        <ResponsiveEditSheet
          open={editor.editorOpen}
          onOpenChange={() => undefined}
          title={title}
          subtitle="Guests book this package with a room of the type you pick."
          isEdit={editor.editorIndex != null}
          saving={editor.saving}
          onCancel={editor.closeEditor}
          onDelete={
            editor.editorIndex != null ?
              () => void editor.deleteDraft(onPersist)
            : undefined
          }
          onSave={() => void editor.saveDraft(onPersist)}
          saveLabel="Save package"
        >
          <div className="space-y-4 rounded-xl border border-[#e6eaf0] bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={hospLabelClass}>Name</Label>
                <Input
                  className={hospFieldClass}
                  value={editor.draft.name}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className={hospLabelClass}>Price</Label>
                <Input
                  className={hospFieldClass}
                  value={editor.draft.price}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, price: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className={hospLabelClass}>Description</Label>
              <Textarea
                className={cn(org.input, "min-h-[5rem]")}
                value={editor.draft.description}
                onChange={(e) => editor.setDraft({ ...editor.draft!, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={hospLabelClass}>Room type for this package</Label>
              <Select
                value={editor.draft.room_type?.trim() ? editor.draft.room_type : "any"}
                onValueChange={(value) =>
                  editor.setDraft({ ...editor.draft!, room_type: value === "any" ? "" : value })
                }
              >
                <SelectTrigger className={hospSelectClass}>
                  <SelectValue placeholder="Pick a room type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any room type</SelectItem>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatRoomTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[12px] text-[#667085]">
                Pick a type (for example Deluxe). Every room of that type at this place can use the package.
              </p>
              {locationId <= 0 ? (
                <p className="text-[12px] text-amber-700">Choose a location in the sidebar first.</p>
              ) : matchingRooms.length > 0 ? (
                <p className="text-[12px] text-[#667085]">
                  Rooms of this type here:{" "}
                  {matchingRooms
                    .map((room) => room.room_name || room.room_number || `#${room.id}`)
                    .join(", ")}
                </p>
              ) : (
                <p className="text-[12px] text-[#667085]">
                  No rooms of this type yet. Add them under Hospitality → Rooms.
                </p>
              )}
              {onAddRooms ? (
                <Button type="button" variant="outline" className={cn(hospAddBtnClass, "mt-1")} onClick={onAddRooms}>
                  Add rooms
                </Button>
              ) : null}
            </div>
          </div>
        </ResponsiveEditSheet>
      : null}
    </>
  );
}

type FoodPanelProps = {
  foodMenu: HospitalityFoodItem[];
  setFoodMenu: (items: HospitalityFoodItem[]) => void;
  onPersist: PersistFn<HospitalityFoodItem>;
  newItem: () => HospitalityFoodItem;
};

export function HospitalityFoodPanel({ foodMenu, setFoodMenu, onPersist, newItem }: FoodPanelProps) {
  const editor = useContentEditor(foodMenu, setFoodMenu);
  const title =
    editor.editorIndex != null ?
      `Edit — ${editor.draft?.title || editor.draft?.meal || "Menu item"}`
    : "Add menu item";

  return (
    <>
      <div className="space-y-3">
        {foodMenu.length === 0 ?
          <HospEmpty>No food items yet. Tap Add menu item to create one.</HospEmpty>
        : <div className="grid gap-2 sm:grid-cols-2">
            {foodMenu.map((item, index) => (
              <HospCard
                key={index}
                title={item.title || item.meal || "Menu item"}
                meta={item.meal || undefined}
                body={item.description ? <p className="line-clamp-2">{item.description}</p> : null}
                onEdit={() => editor.openEdit(index, item)}
              />
            ))}
          </div>
        }
        <Button type="button" variant="outline" className={hospAddBtnClass} onClick={() => editor.openCreate(newItem())}>
          <Plus className="h-3.5 w-3.5" />
          Add menu item
        </Button>
      </div>

      {editor.draft ?
        <ResponsiveEditSheet
          open={editor.editorOpen}
          onOpenChange={() => undefined}
          title={title}
          subtitle="Food and dining options for guests."
          isEdit={editor.editorIndex != null}
          saving={editor.saving}
          onCancel={editor.closeEditor}
          onDelete={editor.editorIndex != null ? () => void editor.deleteDraft(onPersist) : undefined}
          onSave={() => void editor.saveDraft(onPersist)}
          saveLabel="Save item"
        >
          <div className="space-y-4 rounded-xl border border-[#e6eaf0] bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={hospLabelClass}>Meal</Label>
                <Input
                  className={hospFieldClass}
                  value={editor.draft.meal}
                  placeholder="Breakfast, Lunch…"
                  onChange={(e) => editor.setDraft({ ...editor.draft!, meal: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className={hospLabelClass}>Title</Label>
                <Input
                  className={hospFieldClass}
                  value={editor.draft.title}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, title: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className={hospLabelClass}>Description</Label>
              <Textarea
                className={cn(org.input, "min-h-[5rem]")}
                value={editor.draft.description}
                onChange={(e) => editor.setDraft({ ...editor.draft!, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        </ResponsiveEditSheet>
      : null}
    </>
  );
}

type NearbyPanelProps = {
  nearbyPlaces: HospitalityNearbyPlace[];
  setNearbyPlaces: (items: HospitalityNearbyPlace[]) => void;
  onPersist: PersistFn<HospitalityNearbyPlace>;
  newItem: () => HospitalityNearbyPlace;
};

export function HospitalityNearbyPanel({
  nearbyPlaces,
  setNearbyPlaces,
  onPersist,
  newItem,
}: NearbyPanelProps) {
  const editor = useContentEditor(nearbyPlaces, setNearbyPlaces);
  const title =
    editor.editorIndex != null ?
      `Edit — ${editor.draft?.name || "Nearby place"}`
    : "Add nearby place";

  return (
    <>
      <div className="space-y-3">
        {nearbyPlaces.length === 0 ?
          <HospEmpty>No nearby places yet. Tap Add nearby place to create one.</HospEmpty>
        : <div className="grid gap-2 sm:grid-cols-2">
            {nearbyPlaces.map((place, index) => (
              <HospCard
                key={index}
                title={place.name || "Nearby place"}
                meta={[place.distance, place.travel_time].filter(Boolean).join(" · ") || undefined}
                onEdit={() => editor.openEdit(index, place)}
              />
            ))}
          </div>
        }
        <Button type="button" variant="outline" className={hospAddBtnClass} onClick={() => editor.openCreate(newItem())}>
          <Plus className="h-3.5 w-3.5" />
          Add nearby place
        </Button>
      </div>

      {editor.draft ?
        <ResponsiveEditSheet
          open={editor.editorOpen}
          onOpenChange={() => undefined}
          title={title}
          subtitle="Attractions and places near your property."
          isEdit={editor.editorIndex != null}
          saving={editor.saving}
          onCancel={editor.closeEditor}
          onDelete={editor.editorIndex != null ? () => void editor.deleteDraft(onPersist) : undefined}
          onSave={() => void editor.saveDraft(onPersist)}
          saveLabel="Save place"
        >
          <div className="space-y-4 rounded-xl border border-[#e6eaf0] bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={hospLabelClass}>Name</Label>
                <Input
                  className={hospFieldClass}
                  value={editor.draft.name}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className={hospLabelClass}>Distance</Label>
                <Input
                  className={hospFieldClass}
                  value={editor.draft.distance}
                  placeholder="2 km"
                  onChange={(e) => editor.setDraft({ ...editor.draft!, distance: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={hospLabelClass}>Travel time</Label>
                <Input
                  className={hospFieldClass}
                  value={editor.draft.travel_time ?? ""}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, travel_time: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className={hospLabelClass}>Map URL</Label>
                <Input
                  className={hospFieldClass}
                  value={editor.draft.map_url ?? ""}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, map_url: e.target.value })}
                />
              </div>
            </div>
          </div>
        </ResponsiveEditSheet>
      : null}
    </>
  );
}

type GuestServicesPanelProps = {
  guestServices: HospitalityGuestService[];
  setGuestServices: (items: HospitalityGuestService[]) => void;
  onPersist: PersistFn<HospitalityGuestService>;
  newItem: () => HospitalityGuestService;
};

export function HospitalityGuestServicesPanel({
  guestServices,
  setGuestServices,
  onPersist,
  newItem,
}: GuestServicesPanelProps) {
  const editor = useContentEditor(guestServices, setGuestServices);
  const title =
    editor.editorIndex != null ?
      `Edit — ${editor.draft?.name || "Guest service"}`
    : "Add guest service";

  return (
    <>
      <div className="space-y-3">
        {guestServices.length === 0 ?
          <HospEmpty>No guest services yet. Tap Add guest service to create one.</HospEmpty>
        : <div className="grid gap-2 sm:grid-cols-2">
            {guestServices.map((service, index) => (
              <HospCard
                key={service.id || index}
                title={service.name || "Guest service"}
                meta={service.price || undefined}
                body={service.description ? <p className="line-clamp-2">{service.description}</p> : null}
                onEdit={() => editor.openEdit(index, service)}
              />
            ))}
          </div>
        }
        <Button type="button" variant="outline" className={hospAddBtnClass} onClick={() => editor.openCreate(newItem())}>
          <Plus className="h-3.5 w-3.5" />
          Add guest service
        </Button>
      </div>

      {editor.draft ?
        <ResponsiveEditSheet
          open={editor.editorOpen}
          onOpenChange={() => undefined}
          title={title}
          subtitle="Optional paid add-ons guests can request when booking."
          isEdit={editor.editorIndex != null}
          saving={editor.saving}
          onCancel={editor.closeEditor}
          onDelete={editor.editorIndex != null ? () => void editor.deleteDraft(onPersist) : undefined}
          onSave={() => void editor.saveDraft(onPersist)}
          saveLabel="Save service"
        >
          <div className="space-y-4 rounded-xl border border-[#e6eaf0] bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={hospLabelClass}>Name</Label>
                <Input
                  className={hospFieldClass}
                  value={editor.draft.name}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className={hospLabelClass}>Price</Label>
                <Input
                  className={hospFieldClass}
                  value={editor.draft.price}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, price: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className={hospLabelClass}>Description</Label>
              <Textarea
                className={cn(org.input, "min-h-[5rem]")}
                value={editor.draft.description}
                onChange={(e) => editor.setDraft({ ...editor.draft!, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        </ResponsiveEditSheet>
      : null}
    </>
  );
}
