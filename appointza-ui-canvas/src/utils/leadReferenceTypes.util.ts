import { ReferenceType, ReferenceTypeSelectReq } from "@/models/referencetype.model";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import type { ReferenceTypeService } from "@/services/referencetype.service";
import type { ReferenceValueService } from "@/services/referencevalue.service";
import {
  mergeReferenceValueAttributes,
  nextReferenceValueDisplayOrder,
  sortReferenceValuesByDisplayOrder,
} from "@/utils/referencevalue.util";

/** Reference type identifiers for CRM leads (managed on Reference Values screen). */
export const LEAD_REFERENCE_TYPE_IDS = {
  TYPE: "LEADTYPE",
  SOURCE: "LEADSOURCE",
  CATEGORY: "LEADCATEGORY",
} as const;

export const LEAD_REFERENCE_TYPE_LABELS: Record<string, string> = {
  [LEAD_REFERENCE_TYPE_IDS.TYPE]: "Lead Type",
  [LEAD_REFERENCE_TYPE_IDS.SOURCE]: "Lead Source",
  [LEAD_REFERENCE_TYPE_IDS.CATEGORY]: "Lead Category",
};

const DEFAULT_VALUES: Record<string, Array<{ identifier: string; displaytext: string }>> = {
  [LEAD_REFERENCE_TYPE_IDS.TYPE]: [
    { identifier: "customer", displaytext: "Customer" },
    { identifier: "lead", displaytext: "Lead" },
    { identifier: "prospect", displaytext: "Prospect" },
  ],
  [LEAD_REFERENCE_TYPE_IDS.SOURCE]: [
    { identifier: "manual_entry", displaytext: "Manual entry" },
    { identifier: "website", displaytext: "Website" },
    { identifier: "referral", displaytext: "Referral" },
    { identifier: "phone", displaytext: "Phone" },
    { identifier: "walk_in", displaytext: "Walk-in" },
  ],
  [LEAD_REFERENCE_TYPE_IDS.CATEGORY]: [
    { identifier: "turf", displaytext: "turf" },
  ],
};

export const CRM_REFERENCE_TYPE_IDENTIFIERS = [
  LEAD_REFERENCE_TYPE_IDS.TYPE,
  LEAD_REFERENCE_TYPE_IDS.SOURCE,
  LEAD_REFERENCE_TYPE_IDS.CATEGORY,
] as const;

async function ensureType(
  referenceTypeService: ReferenceTypeService,
  organisationId: number,
  identifier: string,
  displaytext: string,
  existing: ReferenceType[],
): Promise<ReferenceType | undefined> {
  let type = existing.find((t) => t.identifier === identifier);
  if (type || !organisationId) return type;

  const created = new ReferenceType();
  created.identifier = identifier;
  created.displaytext = displaytext;
  created.langcode = "en";
  created.organizationid = organisationId;
  created.isactive = true;
  await referenceTypeService.insert(created);

  const refreshed = (await referenceTypeService.select(new ReferenceTypeSelectReq())) || [];
  return refreshed.find((t) => t.identifier === identifier);
}

async function ensureDefaultValues(
  referenceValueService: ReferenceValueService,
  organisationId: number,
  typeId: number,
  defaults: Array<{ identifier: string; displaytext: string }>,
) {
  if (!typeId || !organisationId || defaults.length === 0) return;

  const req = new ReferenceValueSelectReq();
  req.referencetypeid = typeId;
  req.organisationid = organisationId;
  const existing = (await referenceValueService.select(req)) || [];

  const sorted = sortReferenceValuesByDisplayOrder(existing);
  let nextOrder = nextReferenceValueDisplayOrder(sorted);

  for (const def of defaults) {
    const already = existing.some(
      (v) => (v.identifier || "").toLowerCase() === def.identifier.toLowerCase(),
    );
    if (already) continue;

    const row = new ReferenceValue();
    row.identifier = def.identifier;
    row.displaytext = def.displaytext;
    row.langcode = "en";
    row.organizationid = organisationId;
    row.referencetypeid = typeId;
    row.isactive = true;
    row.attributes = mergeReferenceValueAttributes(row.attributes, { DisplayOrder: nextOrder });
    nextOrder += 1;
    await referenceValueService.insert(row);
  }
}

/** Ensures LEADTYPE / LEADSOURCE / LEADCATEGORY exist (with starter values). */
export async function ensureLeadReferenceTypes(
  referenceTypeService: ReferenceTypeService,
  referenceValueService: ReferenceValueService,
  organisationId: number,
): Promise<ReferenceType[]> {
  if (!organisationId) return [];

  let allTypes = (await referenceTypeService.select(new ReferenceTypeSelectReq())) || [];
  const ensured: ReferenceType[] = [];

  for (const identifier of CRM_REFERENCE_TYPE_IDENTIFIERS) {
    const type = await ensureType(
      referenceTypeService,
      organisationId,
      identifier,
      LEAD_REFERENCE_TYPE_LABELS[identifier] || identifier,
      allTypes,
    );
    if (type?.id) {
      ensured.push(type);
      await ensureDefaultValues(
        referenceValueService,
        organisationId,
        type.id,
        DEFAULT_VALUES[identifier] || [],
      );
      // refresh cache so subsequent ensureType sees newly inserted types
      allTypes = (await referenceTypeService.select(new ReferenceTypeSelectReq())) || [];
    }
  }

  return ensured;
}

export async function loadLeadReferenceValues(
  referenceValueService: ReferenceValueService,
  organisationId: number,
  referencetypeid: number,
): Promise<ReferenceValue[]> {
  if (!referencetypeid || !organisationId) return [];
  const req = new ReferenceValueSelectReq();
  req.referencetypeid = referencetypeid;
  req.organisationid = organisationId;
  const values = (await referenceValueService.select(req)) || [];
  return sortReferenceValuesByDisplayOrder(values).filter((v) => v.isactive !== false);
}
