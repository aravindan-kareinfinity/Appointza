import type { WhatsAppConversationDto, WhatsAppMessageDto } from "@/models/whatsappCrm.model";

export function conversationDisplayName(c: WhatsAppConversationDto): string {
  const name = (c.customer_name || "").trim();
  if (name) return name;
  return formatWaId(c.customer_wa_id) || "Unknown contact";
}

export function formatWaId(waId: string): string {
  const digits = (waId || "").replace(/\D/g, "");
  if (!digits) return waId || "";
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{5})(\d{5})/, "$1 $2");
  }
  return `+${digits}`;
}

export function formatMessageTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatFullTimestamp(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Local calendar day key for chat date separators (YYYY-MM-DD). */
export function messageDayKey(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** WhatsApp-style day chip: Today / Yesterday / weekday / date. */
export function formatChatDayLabel(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((startOfToday - startOfMsg) / dayMs);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) {
    return d.toLocaleDateString([], { weekday: "long" });
  }
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

/** Stable dedupe key: prefer provider id, else local db id. */
export function messageDedupeKey(m: Pick<WhatsAppMessageDto, "id" | "provider_message_id">): string {
  const provider = (m.provider_message_id || "").trim();
  if (provider) return `p:${provider}`;
  return `id:${m.id}`;
}

export function upsertMessage(
  list: WhatsAppMessageDto[],
  incoming: WhatsAppMessageDto,
): WhatsAppMessageDto[] {
  const key = messageDedupeKey(incoming);
  const idx = list.findIndex(
    (m) =>
      messageDedupeKey(m) === key ||
      (incoming.id > 0 && m.id === incoming.id) ||
      // Replace optimistic temp rows (negative ids) for the same outbound text.
      (m.id < 0 &&
        incoming.id > 0 &&
        m.direction === incoming.direction &&
        (m.text_content || "") === (incoming.text_content || "")),
  );
  if (idx === -1) {
    return [...list, incoming].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || a.id - b.id,
    );
  }
  const prev = list[idx];
  const next = [...list];
  // Never wipe body text when a status-only realtime patch arrives.
  next[idx] = {
    ...prev,
    ...incoming,
    text_content: (incoming.text_content || "").trim()
      ? incoming.text_content
      : prev.text_content,
    media_id: incoming.media_id || prev.media_id,
  };
  return next.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || a.id - b.id,
  );
}

export function upsertConversation(
  list: WhatsAppConversationDto[],
  incoming: WhatsAppConversationDto,
): WhatsAppConversationDto[] {
  const idx = list.findIndex((c) => c.id === incoming.id);
  const next = idx === -1 ? [incoming, ...list] : list.map((c, i) => (i === idx ? { ...c, ...incoming } : c));
  return next.sort((a, b) => {
    const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return tb - ta || b.id - a.id;
  });
}

export function deliveryLabel(status?: string): string {
  switch ((status || "").toLowerCase()) {
    case "queued":
      return "Queued";
    case "sent":
      return "Sent";
    case "delivered":
      return "Delivered";
    case "read":
      return "Read";
    case "failed":
      return "Failed";
    case "received":
      return "Received";
    default:
      return status || "";
  }
}

/** Meta customer care window: free-form replies allowed within 24h of last inbound message. */
export function isWithinCustomerServiceWindow(messages: WhatsAppMessageDto[]): boolean {
  let lastInboundMs = 0;
  for (const m of messages) {
    if (m.direction !== "inbound") continue;
    const iso = m.provider_timestamp || m.created_at;
    const t = new Date(iso).getTime();
    if (!Number.isNaN(t) && t > lastInboundMs) {
      lastInboundMs = t;
    }
  }
  if (lastInboundMs <= 0) return false;
  return Date.now() - lastInboundMs < 24 * 60 * 60 * 1000;
}

export function messagingContactLabel(c: {
  display_name?: string;
  phone?: string;
}): string {
  const name = (c.display_name || "").trim();
  if (name) return name;
  return formatWaId(c.phone || "") || "Unknown contact";
}

export function messageBody(m: WhatsAppMessageDto): string {
  if ((m.message_type || "text") === "text" && (m.text_content || "").trim()) {
    return m.text_content;
  }
  if ((m.text_content || "").trim()) return m.text_content;
  const type = (m.message_type || "message").toLowerCase();
  return `[${type}]`;
}
