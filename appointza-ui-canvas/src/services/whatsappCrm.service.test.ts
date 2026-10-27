import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const postMock = vi.fn();
const patchMock = vi.fn();

vi.mock("@/utils/axioshelper.utils", () => ({
  AxiosHelperUtils: class {
    get = getMock;
    post = postMock;
    patch = patchMock;
  },
}));

vi.mock("@/utils/environment", () => ({
  environment: { baseurl: "http://api.test" },
}));

describe("WhatsAppCrmService", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
  });

  it("loads conversations with filters", async () => {
    getMock.mockResolvedValue({ item: [{ id: 1 }] });
    const { WhatsAppCrmService } = await import("@/services/whatsappCrm.service");
    const svc = new WhatsAppCrmService();
    const items = await svc.selectConversations({
      search: "Ada",
      status: "open",
      unread_only: true,
      limit: 20,
      offset: 40,
    });
    expect(items).toEqual([{ id: 1 }]);
    expect(getMock).toHaveBeenCalledWith(
      "http://api.test/api/crm/whatsapp/conversations?search=Ada&status=open&unread_only=true&limit=20&offset=40",
      false,
      {},
      undefined,
    );
  });

  it("sends text to conversation messages endpoint", async () => {
    postMock.mockResolvedValue({
      item: { id: 9, conversation_id: 3, text_content: "Hello", status: "sent" },
    });
    const { WhatsAppCrmService } = await import("@/services/whatsappCrm.service");
    const svc = new WhatsAppCrmService();
    const msg = await svc.sendText(3, "Hello");
    expect(msg.id).toBe(9);
    expect(postMock).toHaveBeenCalledWith(
      "http://api.test/api/crm/whatsapp/conversations/3/messages",
      { conversation_id: 3, text: "Hello" },
    );
  });

  it("surfaces send failures", async () => {
    postMock.mockResolvedValue({ item: null });
    const { WhatsAppCrmService } = await import("@/services/whatsappCrm.service");
    const svc = new WhatsAppCrmService();
    await expect(svc.sendText(3, "Hello")).rejects.toThrow("Failed to send message");
  });

  it("loads messaging contacts", async () => {
    getMock.mockResolvedValue({ item: [{ source_type: "lead", source_id: 2, phone: "919876543210" }] });
    const { WhatsAppCrmService } = await import("@/services/whatsappCrm.service");
    const svc = new WhatsAppCrmService();
    const items = await svc.selectMessagingContacts({ search: "Ada", limit: 10, offset: 0 });
    expect(items).toHaveLength(1);
    expect(getMock).toHaveBeenCalledWith(
      "http://api.test/api/crm/whatsapp/messaging-contacts?search=Ada&limit=10",
      false,
      {},
      undefined,
    );
  });

  it("ensures conversation by contact", async () => {
    postMock.mockResolvedValue({ item: { id: 12, customer_wa_id: "919876543210" } });
    const { WhatsAppCrmService } = await import("@/services/whatsappCrm.service");
    const svc = new WhatsAppCrmService();
    const conv = await svc.ensureConversation({ phone: "9876543210", enquiry_id: 5 });
    expect(conv.id).toBe(12);
    expect(postMock).toHaveBeenCalledWith("http://api.test/api/crm/whatsapp/conversations/ensure", {
      phone: "9876543210",
      enquiry_id: 5,
    });
  });

  it("marks conversations read via patch", async () => {
    patchMock.mockResolvedValue({ item: { id: 3, unread_count: 0 } });
    const { WhatsAppCrmService } = await import("@/services/whatsappCrm.service");
    const svc = new WhatsAppCrmService();
    const updated = await svc.patchConversation(3, { mark_read: true });
    expect(updated.unread_count).toBe(0);
    expect(patchMock).toHaveBeenCalledWith(
      "http://api.test/api/crm/whatsapp/conversations/3",
      { mark_read: true },
    );
  });
});
