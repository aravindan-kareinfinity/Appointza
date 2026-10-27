import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const postMock = vi.fn();

vi.mock("@/utils/axioshelper.utils", () => ({
  AxiosHelperUtils: class {
    get = getMock;
    post = postMock;
  },
}));

vi.mock("@/utils/environment", () => ({
  environment: { baseurl: "http://api.test" },
}));

describe("WhatsAppTemplateService", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
  });

  it("lists templates with filters", async () => {
    getMock.mockResolvedValue({ item: [{ id: 1, template_name: "hello" }] });
    const { WhatsAppTemplateService } = await import("@/services/whatsappTemplate.service");
    const svc = new WhatsAppTemplateService();
    const items = await svc.select({ search: "hello", status: "approved", category: "UTILITY" });
    expect(items[0].template_name).toBe("hello");
    expect(getMock.mock.calls[0][0]).toContain("/api/crm/whatsapp/templates?");
    expect(getMock.mock.calls[0][0]).toContain("status=approved");
  });

  it("syncs templates via POST", async () => {
    postMock.mockResolvedValue({ item: { upserted: 2, archived: 0, pages: 1, message: "ok", templates: [] } });
    const { WhatsAppTemplateService } = await import("@/services/whatsappTemplate.service");
    const svc = new WhatsAppTemplateService();
    const result = await svc.sync();
    expect(result.upserted).toBe(2);
    expect(postMock).toHaveBeenCalledWith("http://api.test/api/crm/whatsapp/templates/sync", {});
  });

  it("creates and refreshes without exposing tokens in request body shape", async () => {
    postMock.mockResolvedValueOnce({
      item: { id: 9, status: "pending", provider_status: "PENDING", template_name: "t1" },
    });
    const { WhatsAppTemplateService } = await import("@/services/whatsappTemplate.service");
    const svc = new WhatsAppTemplateService();
    const created = await svc.create({
      template_name: "t1",
      language_code: "en_US",
      category: "UTILITY",
      header_type: "NONE",
      body_text: "Hi",
      submit: true,
    });
    expect(created.status).toBe("pending");
    expect(created.status).not.toBe("approved");
    const body = postMock.mock.calls[0][1] as Record<string, unknown>;
    expect(body.access_token).toBeUndefined();
    expect(body.waba_id).toBeUndefined();
  });
});
