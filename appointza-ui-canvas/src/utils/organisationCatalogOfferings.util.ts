import type { OrganisationType } from "@/models/organisation.model";

export type CatalogOfferingKind = "services" | "events" | "rooms";

export const CATALOG_OFFERING_LABELS: Record<CatalogOfferingKind, string> = {
  services: "Services",
  events: "Events",
  rooms: "Rooms & stays",
};

const OFFERING_ORDER: CatalogOfferingKind[] = ["services", "events", "rooms"];

/** All selectable offering types in the organisation profile editor. */
export const ALL_CATALOG_OFFERING_KINDS: CatalogOfferingKind[] = [...OFFERING_ORDER];

export type CatalogOfferingAvailability = Record<CatalogOfferingKind, boolean>;

export function emptyCatalogAvailability(): CatalogOfferingAvailability {
  return { services: false, events: false, rooms: false };
}

export function parseCatalogOfferings(attributesJson?: string | null): CatalogOfferingKind[] {
  if (!attributesJson?.trim()) return [];
  try {
    const parsed = JSON.parse(attributesJson) as {
      catalog_offerings?: unknown;
    };
    if (!Array.isArray(parsed.catalog_offerings)) return [];
    return parsed.catalog_offerings.filter((item): item is CatalogOfferingKind =>
      item === "services" || item === "events" || item === "rooms",
    );
  } catch {
    return [];
  }
}

export function mergeCatalogOfferingsIntoAttributes(
  attributesJson: string | undefined,
  offerings: CatalogOfferingKind[],
): string {
  let base: Record<string, unknown> = {};
  if (attributesJson?.trim()) {
    try {
      base = JSON.parse(attributesJson) as Record<string, unknown>;
    } catch {
      base = {};
    }
  }
  const unique = OFFERING_ORDER.filter((kind) => offerings.includes(kind));
  base.catalog_offerings = unique;
  return JSON.stringify(base);
}

/** Infer stored offerings when attributes are missing (legacy orgs). */
export function defaultOfferingsForOrganisationType(
  organisationType: OrganisationType | string | undefined,
): CatalogOfferingKind[] {
  if (organisationType === "hospitality") return ["rooms"];
  if (organisationType === "both") return ["services", "events", "rooms"];
  return ["services"];
}

/** Initial checkboxes when opening organisation edit / nav gates. */
export function resolveInitialCatalogOfferings(
  attributesJson?: string | null,
  organisationType?: OrganisationType | string,
): CatalogOfferingKind[] {
  const fromAttributes = parseCatalogOfferings(attributesJson ?? undefined);
  const fromType = defaultOfferingsForOrganisationType(organisationType);
  if (fromAttributes.length === 0) return fromType;
  // Union with type defaults so stale/partial attributes never hide Rooms & stays.
  const merged = new Set<CatalogOfferingKind>([...fromAttributes, ...fromType]);
  return OFFERING_ORDER.filter((kind) => merged.has(kind));
}

export function resolveSelectedCatalogOfferings(
  attributesJson: string | undefined,
  organisationType: OrganisationType | string | undefined,
  availability: CatalogOfferingAvailability,
): CatalogOfferingKind[] {
  const fromAttributes = parseCatalogOfferings(attributesJson);
  const seed =
    fromAttributes.length > 0
      ? fromAttributes
      : defaultOfferingsForOrganisationType(organisationType);
  return OFFERING_ORDER.filter((kind) => availability[kind] && seed.includes(kind));
}

export function organisationTypeFromCatalogOfferings(
  offerings: CatalogOfferingKind[],
): OrganisationType {
  const hasRooms = offerings.includes("rooms");
  const hasServiceSide = offerings.includes("services") || offerings.includes("events");
  if (hasRooms && hasServiceSide) return "both";
  if (hasRooms) return "hospitality";
  return "service";
}

export function availableOfferingKinds(
  availability: CatalogOfferingAvailability,
): CatalogOfferingKind[] {
  return OFFERING_ORDER.filter((kind) => availability[kind]);
}

export function normalizeCatalogTab(
  kind: string | null | undefined,
  offerings: CatalogOfferingKind[],
): CatalogOfferingKind {
  if (kind === "services" || kind === "events" || kind === "rooms") {
    if (offerings.includes(kind)) return kind;
  }
  return offerings[0] ?? "services";
}

export function catalogNavLabel(offerings: CatalogOfferingKind[]): string {
  const parts = OFFERING_ORDER.filter((kind) => kind !== "rooms" && offerings.includes(kind)).map(
    (kind) => CATALOG_OFFERING_LABELS[kind],
  );
  if (parts.length === 0) return "Catalog";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} & ${parts[1]}`;
}

export function catalogNavShortLabel(offerings: CatalogOfferingKind[]): string {
  if (offerings.length === 1 && offerings[0] === "services") return "Services";
  if (offerings.length === 1 && offerings[0] === "events") return "Events";
  if (offerings.length === 1 && offerings[0] === "rooms") return "Rooms";
  return "Catalog";
}

export function catalogServicesNavTo(offerings: CatalogOfferingKind[]): string {
  const catalog = offerings.filter((kind) => kind !== "rooms");
  if (catalog.length === 0) return "/organization/hospitality?section=room-status";
  // Prefer the canonical services URL when the org offers services.
  if (catalog.includes("services")) return "/organization/services?kind=services";
  const kind = normalizeCatalogTab(null, catalog);
  return `/organization/services?kind=${kind}`;
}

export function bookingsNavVisible(offerings: CatalogOfferingKind[]): boolean {
  return (
    offerings.includes("services") ||
    offerings.includes("events") ||
    offerings.includes("rooms")
  );
}
