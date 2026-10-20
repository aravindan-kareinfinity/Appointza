import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import {
  ClipboardList,
  FileText,
  Loader2,
  MapPin,
  Package,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import { useOrganisationLocationScope } from "@/hooks/useOrganisationLocationScope";
import { RoomStatusPanel } from "@/components/organization/RoomStatusPanel";
import { RoomDefinitionsPanel } from "@/components/organization/RoomDefinitionsPanel";
import { HospitalityPoliciesPanel } from "@/components/organization/HospitalityPoliciesPanel";
import {
  HospitalityFoodPanel,
  HospitalityGuestServicesPanel,
  HospitalityNearbyPanel,
  HospitalityPackagesPanel,
} from "@/components/organization/HospitalityContentPanels";
import {
  HospitalityContentSaveReq,
  HospitalityFoodItem,
  HospitalityGuestService,
  HospitalityNearbyPlace,
  HospitalityPackage,
  OrganisationHospitalityProfile,
} from "@/models/hospitality.model";
import { hospitalityService } from "@/services/hospitality.service";
import { useOrganisationCatalogOfferings } from "@/hooks/useOrganisationCatalogOfferings";
import { normalizeCatalogTab } from "@/utils/organisationCatalogOfferings.util";

type HospitalitySection =
  | "room-status"
  | "policies"
  | "packages"
  | "food"
  | "nearby"
  | "guest-services";

const CONTENT_SECTIONS = new Set<HospitalitySection>([
  "policies",
  "packages",
  "food",
  "nearby",
  "guest-services",
]);

const SECTIONS: {
  id: HospitalitySection;
  label: string;
  description: string;
  icon: typeof Package;
}[] = [
  {
    id: "room-status",
    label: "Rooms",
    description: "Add rooms, then track occupancy and housekeeping for this location.",
    icon: ClipboardList,
  },
  {
    id: "policies",
    label: "Policies",
    description: "Booking type, check-in/out times, and guest policies for your organisation.",
    icon: FileText,
  },
  {
    id: "packages",
    label: "Packages",
    description: "Stay and add-on packages shown on your public property site.",
    icon: Package,
  },
  {
    id: "food",
    label: "Food menu",
    description: "Food and dining options for guests.",
    icon: UtensilsCrossed,
  },
  {
    id: "nearby",
    label: "Nearby places",
    description: "Attractions and places near your property.",
    icon: MapPin,
  },
  {
    id: "guest-services",
    label: "Guest services",
    description: "Optional paid add-ons guests can request when booking.",
    icon: Sparkles,
  },
];

function parseSection(value: string | null): HospitalitySection {
  if (value === "room-definitions" || value === "rooms") return "room-status";
  if (value && SECTIONS.some((section) => section.id === value)) {
    return value as HospitalitySection;
  }
  return "room-status";
}

const hospitalitySidebarTriggerClass =
  "relative h-auto w-full justify-start gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium text-[#5b6572] shadow-none hover:bg-[#f4f6f9] hover:text-[#1a1a1a] data-[state=active]:bg-[#eef2f7] data-[state=active]:text-[#1a1a1a] data-[state=active]:shadow-none data-[state=active]:before:absolute data-[state=active]:before:left-0 data-[state=active]:before:top-1.5 data-[state=active]:before:bottom-1.5 data-[state=active]:before:w-[3px] data-[state=active]:before:rounded-r-full data-[state=active]:before:bg-[#2a5af5]";

const hospitalitySidebarListClass =
  "hidden !h-auto w-full flex-col items-stretch justify-start gap-0.5 rounded-none border-0 bg-transparent p-0 shadow-none lg:flex";

const hospitalityTabPanelClass = "m-0 mt-0 focus-visible:outline-none";

function newPackage(index: number): HospitalityPackage {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: "",
    description: "",
    kind: "stay",
    is_active: true,
    sort_order: index,
    image_url: "",
    includes: [],
    add_ons: [],
    valid_from: "",
    valid_to: "",
    minimum_nights: 1,
    max_guests: 2,
    included_guests: 0,
    extra_guest_charge: 0,
    room_type: "",
  };
}

function newFoodItem(): HospitalityFoodItem {
  return { meal: "", title: "", description: "", cuisines: [] };
}

function newNearbyPlace(): HospitalityNearbyPlace {
  return { name: "", distance: "", travel_time: "", icon: "", image_url: "", map_url: "" };
}

function newGuestService(index: number): HospitalityGuestService {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: "",
    description: "",
    category: "other",
    icon: "",
    is_active: true,
    sort_order: index,
  };
}

type HospitalityProfilePanelProps = {
  organisationId: number;
};

export function HospitalityProfilePanel({ organisationId }: HospitalityProfilePanelProps) {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { offersRooms, offerings, isLoading: isLoadingOfferings } = useOrganisationCatalogOfferings(
    organisationId,
  );
  const { locationId, locationLabel } = useOrganisationLocationScope(organisationId);
  const requestedSection = parseSection(searchParams.get("section"));
  const selectedRoomIdParam = searchParams.get("id") || searchParams.get("roomId");
  const selectedRoomId = selectedRoomIdParam ? Number(selectedRoomIdParam) : undefined;
  const activeSection: HospitalitySection = requestedSection;

  const [contentLoading, setContentLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<OrganisationHospitalityProfile | null>(null);
  const [packages, setPackages] = useState<HospitalityPackage[]>([]);
  const [foodMenu, setFoodMenu] = useState<HospitalityFoodItem[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<HospitalityNearbyPlace[]>([]);
  const [guestServices, setGuestServices] = useState<HospitalityGuestService[]>([]);
  const loadedForOrgRef = useRef(0);

  const applyProfile = useCallback((data: OrganisationHospitalityProfile) => {
    setProfile(data);
    setPackages(data.packages ?? []);
    setFoodMenu(data.food_menu ?? []);
    setNearbyPlaces(data.nearby_places ?? []);
    setGuestServices(data.guest_services ?? []);
  }, []);

  const loadProfile = useCallback(async () => {
    if (organisationId <= 0) return;
    if (loadedForOrgRef.current === organisationId) return;

    setContentLoading(true);
    try {
      const data = await hospitalityService.getProfile(organisationId);
      loadedForOrgRef.current = organisationId;
      applyProfile(data);
    } catch (error) {
      toast({
        title: "Could not load hospitality profile",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setContentLoading(false);
    }
  }, [organisationId, applyProfile, toast]);

  useEffect(() => {
    if (organisationId <= 0) {
      loadedForOrgRef.current = 0;
      setProfile(null);
      setPackages([]);
      setFoodMenu([]);
      setNearbyPlaces([]);
      setGuestServices([]);
      return;
    }
    if (loadedForOrgRef.current !== organisationId) {
      loadedForOrgRef.current = 0;
      setProfile(null);
      setPackages([]);
      setFoodMenu([]);
      setNearbyPlaces([]);
      setGuestServices([]);
    }
  }, [organisationId]);

  useEffect(() => {
    if (CONTENT_SECTIONS.has(activeSection)) {
      void loadProfile();
    }
  }, [activeSection, loadProfile]);

  useEffect(() => {
    if (!searchParams.get("section")) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("section", "room-status");
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  const prevLocationIdRef = useRef(locationId);

  useEffect(() => {
    if (prevLocationIdRef.current === locationId) return;
    const hadPreviousLocation = prevLocationIdRef.current > 0;
    prevLocationIdRef.current = locationId;
    if (!hadPreviousLocation) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("roomId");
        next.delete("id");
        return next;
      },
      { replace: true },
    );
  }, [locationId, setSearchParams]);

  const setSection = (section: HospitalitySection, roomId?: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("section", section);
        if (section === "room-status" && roomId) {
          next.set("id", String(roomId));
          next.delete("roomId");
        } else {
          next.delete("id");
          next.delete("roomId");
        }
        return next;
      },
      { replace: true },
    );
  };

  const openRoomDefinitions = (roomId?: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("section", "room-status");
        if (roomId && roomId > 0) next.set("roomId", String(roomId));
        else next.delete("roomId");
        return next;
      },
      { replace: true },
    );
  };

  const persistContent = async (
    section: HospitalitySection,
    payload: {
      packages?: HospitalityPackage[];
      food_menu?: HospitalityFoodItem[];
      nearby_places?: HospitalityNearbyPlace[];
      guest_services?: HospitalityGuestService[];
    },
  ) => {
    if (organisationId <= 0) return;
    setSaving(true);
    try {
      const req = new HospitalityContentSaveReq();
      req.organisation_id = organisationId;
      if (payload.packages) req.packages = payload.packages;
      if (payload.food_menu) req.food_menu = payload.food_menu;
      if (payload.nearby_places) req.nearby_places = payload.nearby_places;
      if (payload.guest_services) req.guest_services = payload.guest_services;

      const updated = await hospitalityService.saveContent(req);
      loadedForOrgRef.current = organisationId;
      applyProfile(updated);
      toast({
        title: "Saved",
        description: `${SECTIONS.find((s) => s.id === section)?.label} updated.`,
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  if (organisationId <= 0) {
    return (
      <p className="text-sm text-stone-500">Sign in with an organisation account to manage hospitality content.</p>
    );
  }

  if (!isLoadingOfferings && !offersRooms) {
    const kind = normalizeCatalogTab(null, offerings.filter((item) => item !== "rooms"));
    return <Navigate to={`/organization/services?kind=${kind}`} replace />;
  }

  return (
    <Tabs
      value={activeSection}
      onValueChange={(v) => setSection(v as HospitalitySection)}
      className={cn(org.page, "flex h-full min-h-0 flex-col bg-[#f5f7f9] lg:flex-row")}
    >
      <aside className="shrink-0 border-b border-[#e6eaf0] bg-white lg:h-full lg:w-56 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="px-3 py-3 md:px-4 lg:px-2 lg:py-4">
          <p className="mb-2 hidden px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa3b2] lg:block">
            Hospitality
          </p>
          <div className="lg:hidden">
            <label htmlFor="hospitality-settings-nav" className="sr-only">
              Hospitality
            </label>
            <Select
              value={activeSection}
              onValueChange={(value) => setSection(value as HospitalitySection)}
            >
              <SelectTrigger
                id="hospitality-settings-nav"
                className="h-9 min-h-9 border-[#e6eaf0] text-[13px] shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="item-aligned" className="z-[110] max-h-[min(24rem,70dvh)]">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <SelectItem key={section.id} value={section.id} className="min-h-9 text-[13px]">
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        {section.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <TabsList className={hospitalitySidebarListClass}>
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className={hospitalitySidebarTriggerClass}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {section.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </aside>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#f5f7f9]">
        {SECTIONS.map((section) => (
          <TabsContent key={section.id} value={section.id} className={hospitalityTabPanelClass}>
            <SettingsEmbeddedHeader
              icon={section.icon}
              title={section.label}
              description={section.description}
            />
            <div className={cn(settingsEmbedded.sectionBody, "space-y-4")}>
              {section.id === "room-status" && activeSection === "room-status" ?
                <>
                  <RoomDefinitionsPanel
                    locationId={locationId}
                    locationName={locationLabel}
                    onOpenRoomStatus={(roomId) => {
                      setSearchParams(
                        (prev) => {
                          const next = new URLSearchParams(prev);
                          next.set("section", "room-status");
                          if (roomId > 0) next.set("id", String(roomId));
                          return next;
                        },
                        { replace: true },
                      );
                    }}
                  />
                  <RoomStatusPanel
                    locationId={locationId}
                    locationName={locationLabel}
                    selectedRoomId={selectedRoomId}
                    onEditRoom={(roomId) => openRoomDefinitions(roomId)}
                  />
                </>
              : null}

              {section.id === "policies" && activeSection === "policies" ?
                <HospitalityPoliciesPanel
                  organisationId={organisationId}
                  profile={profile}
                  loading={contentLoading}
                  onSaved={(updated) => {
                    loadedForOrgRef.current = organisationId;
                    applyProfile(updated);
                  }}
                />
              : null}

              {CONTENT_SECTIONS.has(section.id) && section.id !== "policies" && contentLoading ?
                <div className="flex items-center gap-2 py-12 text-[13px] text-[#667085]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
                  Loading…
                </div>
              : null}

              {section.id === "packages" && !contentLoading && (
                <HospitalityPackagesPanel
                  packages={packages}
                  setPackages={setPackages}
                  newItem={() => newPackage(packages.length)}
                  onPersist={async (next) => persistContent("packages", { packages: next })}
                  organisationId={organisationId}
                  locationId={locationId}
                  onAddRooms={() => openRoomDefinitions()}
                />
              )}

              {section.id === "food" && !contentLoading && (
                <HospitalityFoodPanel
                  foodMenu={foodMenu}
                  setFoodMenu={setFoodMenu}
                  newItem={newFoodItem}
                  onPersist={async (next) => persistContent("food", { food_menu: next })}
                />
              )}

              {section.id === "nearby" && !contentLoading && (
                <HospitalityNearbyPanel
                  nearbyPlaces={nearbyPlaces}
                  setNearbyPlaces={setNearbyPlaces}
                  newItem={newNearbyPlace}
                  onPersist={async (next) => persistContent("nearby", { nearby_places: next })}
                />
              )}

              {section.id === "guest-services" && !contentLoading && (
                <HospitalityGuestServicesPanel
                  guestServices={guestServices}
                  setGuestServices={setGuestServices}
                  newItem={() => newGuestService(guestServices.length)}
                  onPersist={async (next) => persistContent("guest-services", { guest_services: next })}
                />
              )}
            </div>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
