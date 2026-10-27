import type {
  WhatsAppTemplateComponent,
  WhatsAppTemplateDto,
  WhatsAppTemplateStatus,
} from "@/models/whatsappTemplate.model";

export function parseComponents(json?: string): WhatsAppTemplateComponent[] {
  try {
    const parsed = JSON.parse(json || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function applyPreviewValues(
  text: string,
  values: Record<string, string>,
): string {
  return (text || "").replace(/\{\{(\d+)\}\}/g, (_, n: string) => {
    const v = values[n];
    return v != null && v !== "" ? v : `{{${n}}}`;
  });
}

export function statusLabel(status: WhatsAppTemplateStatus): string {
  switch ((status || "").toLowerCase()) {
    case "draft":
      return "Local draft";
    case "pending":
      return "Pending approval";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "paused":
      return "Paused";
    case "disabled":
      return "Disabled";
    case "in_appeal":
      return "In appeal";
    case "archived":
      return "Archived";
    default:
      return status || "Unknown";
  }
}

export function statusTone(status: WhatsAppTemplateStatus): string {
  switch ((status || "").toLowerCase()) {
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "pending":
      return "bg-amber-50 text-amber-800";
    case "rejected":
      return "bg-red-50 text-red-700";
    case "draft":
      return "bg-slate-100 text-slate-700";
    case "paused":
    case "disabled":
      return "bg-orange-50 text-orange-800";
    default:
      return "bg-[#f4f6f9] text-[#5b6572]";
  }
}

export function formatSyncTime(iso?: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Never";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function collectPlaceholderIndexes(text: string): number[] {
  const set = new Set<number>();
  const re = /\{\{(\d+)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text || ""))) {
    set.add(Number(m[1]));
  }
  return [...set].sort((a, b) => a - b);
}

export function templatePreviewParts(template: WhatsAppTemplateDto) {
  const components = parseComponents(template.components_json);
  const header = components.find((c) => (c.type || "").toUpperCase() === "HEADER");
  const body = components.find((c) => (c.type || "").toUpperCase() === "BODY");
  const footer = components.find((c) => (c.type || "").toUpperCase() === "FOOTER");
  const buttons = components.find((c) => (c.type || "").toUpperCase() === "BUTTONS");
  return { header, body, footer, buttons };
}
