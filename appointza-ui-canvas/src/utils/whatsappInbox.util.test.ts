import { describe, expect, it } from "vitest";
import type { WhatsAppConversationDto, WhatsAppMessageDto } from "@/models/whatsappCrm.model";
import {
  conversationDisplayName,
  formatWaId,
  isWithinCustomerServiceWindow,
  messageDedupeKey,
  upsertConversation,
  upsertMessage,
} from "@/utils/whatsappInbox.util";

function msg(partial: Partial<WhatsAppMessageDto>): WhatsAppMessageDto {
  return {
    id: 1,
    organisation_id: 1,
    whatsapp_connection_id: 1,
    conversation_id: 10,
    provider_message_id: "",
    direction: "inbound",
    message_type: "text",
    text_content: "hi",
    media_id: "",
    status: "received",
    failure_reason: "",
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    ...partial,
  };
}

function conv(partial: Partial<WhatsAppConversationDto>): WhatsAppConversationDto {
  return {
    id: 1,
    organisation_id: 1,
    whatsapp_connection_id: 1,
    customer_wa_id: "919876543210",
    customer_name: "",
    status: "open",
    last_message_preview: "",
    unread_count: 0,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    ...partial,
  };
}

describe("whatsappInbox.util", () => {
  it("formats WA ids and display names", () => {
    expect(formatWaId("919876543210")).toContain("98765");
    expect(conversationDisplayName(conv({ customer_name: "Ada" }))).toBe("Ada");
    expect(conversationDisplayName(conv({}))).toContain("98765");
  });

  it("dedupes realtime + API messages by provider id", () => {
    const a = msg({ id: 1, provider_message_id: "wamid.ABC", text_content: "one" });
    const b = msg({ id: 99, provider_message_id: "wamid.ABC", text_content: "two", status: "delivered" });
    const merged = upsertMessage([a], b);
    expect(merged).toHaveLength(1);
    expect(merged[0].text_content).toBe("two");
    expect(merged[0].status).toBe("delivered");
    expect(messageDedupeKey(a)).toBe(messageDedupeKey(b));
  });

  it("detects Meta 24h customer care window from inbound messages", () => {
    const recent = msg({
      direction: "inbound",
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });
    expect(isWithinCustomerServiceWindow([recent])).toBe(true);
    const old = msg({
      direction: "inbound",
      created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    });
    expect(isWithinCustomerServiceWindow([old])).toBe(false);
    expect(isWithinCustomerServiceWindow([msg({ direction: "outbound" })])).toBe(false);
  });

  it("upserts conversations sorted by last activity", () => {
    const older = conv({ id: 1, last_message_at: "2026-01-01T10:00:00Z" });
    const newer = conv({ id: 2, last_message_at: "2026-01-02T10:00:00Z" });
    const list = upsertConversation([older], newer);
    expect(list[0].id).toBe(2);
    const updated = upsertConversation(list, {
      ...older,
      last_message_at: "2026-01-03T10:00:00Z",
      unread_count: 3,
    });
    expect(updated[0].id).toBe(1);
    expect(updated[0].unread_count).toBe(3);
  });
});
