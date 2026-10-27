import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();

vi.mock("@/utils/axioshelper.utils", () => ({
  AxiosHelperUtils: class {
    get = getMock;
    post = postMock;
    put = putMock;
  },
}));

vi.mock("@/utils/environment", () => ({
  environment: { baseurl: "http://api.test" },
}));

describe("WhatsAppCampaignService", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
  });

  it("lists campaigns with status filter", async () => {
    getMock.mockResolvedValue({ item: [{ id: 1, name: "Spring", status: "draft" }] });
    const { WhatsAppCampaignService } = await import("@/services/whatsappCampaign.service");
    const svc = new WhatsAppCampaignService();
    const items = await svc.select({ status: "draft" });
    expect(items[0].name).toBe("Spring");
    expect(getMock.mock.calls[0][0]).toContain("status=draft");
  });

  it("previews audience without dispatch endpoints", async () => {
    postMock.mockResolvedValue({
      item: { selected_count: 10, eligible_count: 4, excluded_count: 6, exclusion_reasons: {}, samples: [] },
    });
    const { WhatsAppCampaignService } = await import("@/services/whatsappCampaign.service");
    const svc = new WhatsAppCampaignService();
    const result = await svc.previewAudience({
      whatsapp_connection_id: 3,
      category: "marketing",
      audience: { sources: ["lead"] },
    });
    expect(result.eligible_count).toBe(4);
    expect(postMock.mock.calls[0][0]).toContain("/audience/preview");
  });

  it("schedules with UTC timestamp and does not call Meta send", async () => {
    postMock.mockResolvedValue({
      item: { id: 9, status: "scheduled", scheduled_at: "2026-12-01T10:00:00Z" },
    });
    const { WhatsAppCampaignService } = await import("@/services/whatsappCampaign.service");
    const svc = new WhatsAppCampaignService();
    const scheduled = await svc.schedule(9, "2026-12-01T10:00:00.000Z", "Asia/Kolkata", 2);
    expect(scheduled.status).toBe("scheduled");
    expect(scheduled.status).not.toBe("completed");
    expect(postMock.mock.calls[0][0]).toBe("http://api.test/api/crm/whatsapp/campaigns/9/schedule");
    expect(postMock.mock.calls[0][1]).toMatchObject({
      scheduled_at_utc: "2026-12-01T10:00:00.000Z",
      expected_version: 2,
    });
  });
});
