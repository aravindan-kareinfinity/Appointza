import { ActionRes } from "@/models/actionres.model";
import type {
  WhatsAppCampaignAudiencePreviewResult,
  WhatsAppCampaignDto,
  WhatsAppCampaignPreviewResult,
  WhatsAppCampaignRecipientDto,
  WhatsAppCampaignReportDto,
  WhatsAppCampaignUpsertReq,
  WhatsAppCampaignValidateResult,
} from "@/models/whatsappCampaign.model";
import { AxiosHelperUtils } from "@/utils/axioshelper.utils";
import { environment } from "@/utils/environment";

export class WhatsAppCampaignService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + "/api/crm/whatsapp/campaigns";
  }

  async select(params?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<WhatsAppCampaignDto[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const query = qs.toString();
    const resp = await this.http.get<ActionRes<WhatsAppCampaignDto[]>>(
      `${this.baseurl}${query ? `?${query}` : ""}`,
    );
    return resp.item ?? [];
  }

  async getById(id: number): Promise<WhatsAppCampaignDto | null> {
    const resp = await this.http.get<ActionRes<WhatsAppCampaignDto>>(`${this.baseurl}/${id}`);
    return resp.item ?? null;
  }

  async create(body: WhatsAppCampaignUpsertReq): Promise<WhatsAppCampaignDto> {
    const resp = await this.http.post<ActionRes<WhatsAppCampaignDto>>(this.baseurl, body);
    if (!resp.item) throw new Error("Failed to create campaign.");
    return resp.item;
  }

  async update(id: number, body: WhatsAppCampaignUpsertReq): Promise<WhatsAppCampaignDto> {
    const resp = await this.http.put<ActionRes<WhatsAppCampaignDto>>(`${this.baseurl}/${id}`, body);
    if (!resp.item) throw new Error("Failed to update campaign.");
    return resp.item;
  }

  async previewAudience(body: {
    whatsapp_connection_id: number;
    category?: string;
    audience?: WhatsAppCampaignUpsertReq["audience"];
    sample_limit?: number;
  }): Promise<WhatsAppCampaignAudiencePreviewResult> {
    const resp = await this.http.post<ActionRes<WhatsAppCampaignAudiencePreviewResult>>(
      `${this.baseurl}/audience/preview`,
      body,
    );
    if (!resp.item) throw new Error("Audience preview failed.");
    return resp.item;
  }

  async validate(id: number): Promise<WhatsAppCampaignValidateResult> {
    const resp = await this.http.post<ActionRes<WhatsAppCampaignValidateResult>>(
      `${this.baseurl}/${id}/validate`,
      {},
    );
    if (!resp.item) throw new Error("Validation failed.");
    return resp.item;
  }

  async preview(id: number, sample_count = 3): Promise<WhatsAppCampaignPreviewResult> {
    const resp = await this.http.post<ActionRes<WhatsAppCampaignPreviewResult>>(
      `${this.baseurl}/${id}/preview`,
      { sample_count },
    );
    if (!resp.item) throw new Error("Preview failed.");
    return resp.item;
  }

  async schedule(
    id: number,
    scheduled_at_utc: string,
    timezone = "UTC",
    expected_version?: number,
  ): Promise<WhatsAppCampaignDto> {
    const resp = await this.http.post<ActionRes<WhatsAppCampaignDto>>(
      `${this.baseurl}/${id}/schedule`,
      { scheduled_at_utc, timezone, expected_version },
    );
    if (!resp.item) throw new Error("Schedule failed.");
    return resp.item;
  }

  async cancel(id: number, expected_version?: number): Promise<WhatsAppCampaignDto> {
    const qs = expected_version != null ? `?expected_version=${expected_version}` : "";
    const resp = await this.http.post<ActionRes<WhatsAppCampaignDto>>(
      `${this.baseurl}/${id}/cancel${qs}`,
      {},
    );
    if (!resp.item) throw new Error("Cancel failed.");
    return resp.item;
  }

  async send(id: number, expected_version?: number): Promise<WhatsAppCampaignDto> {
    const qs = expected_version != null ? `?expected_version=${expected_version}` : "";
    const resp = await this.http.post<ActionRes<WhatsAppCampaignDto>>(
      `${this.baseurl}/${id}/send${qs}`,
      {},
    );
    if (!resp.item) throw new Error("Queue for send failed.");
    return resp.item;
  }

  async pause(id: number, expected_version?: number): Promise<WhatsAppCampaignDto> {
    const qs = expected_version != null ? `?expected_version=${expected_version}` : "";
    const resp = await this.http.post<ActionRes<WhatsAppCampaignDto>>(
      `${this.baseurl}/${id}/pause${qs}`,
      {},
    );
    if (!resp.item) throw new Error("Pause failed.");
    return resp.item;
  }

  async resume(id: number, expected_version?: number): Promise<WhatsAppCampaignDto> {
    const qs = expected_version != null ? `?expected_version=${expected_version}` : "";
    const resp = await this.http.post<ActionRes<WhatsAppCampaignDto>>(
      `${this.baseurl}/${id}/resume${qs}`,
      {},
    );
    if (!resp.item) throw new Error("Resume failed.");
    return resp.item;
  }

  async report(id: number): Promise<WhatsAppCampaignReportDto> {
    const resp = await this.http.get<ActionRes<WhatsAppCampaignReportDto>>(
      `${this.baseurl}/${id}/report`,
    );
    if (!resp.item) throw new Error("Report failed.");
    return resp.item;
  }

  async recipients(
    id: number,
    params?: { processing_status?: string; search?: string; limit?: number; offset?: number },
  ): Promise<{ items: WhatsAppCampaignRecipientDto[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.processing_status) qs.set("processing_status", params.processing_status);
    if (params?.search) qs.set("search", params.search);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const query = qs.toString();
    const resp = await this.http.get<ActionRes<WhatsAppCampaignRecipientDto[]> & { resultCount?: number }>(
      `${this.baseurl}/${id}/recipients${query ? `?${query}` : ""}`,
    );
    return { items: resp.item ?? [], total: resp.resultCount ?? resp.item?.length ?? 0 };
  }

  async retryRecipient(campaignId: number, recipientId: number): Promise<WhatsAppCampaignRecipientDto> {
    const resp = await this.http.post<ActionRes<WhatsAppCampaignRecipientDto>>(
      `${this.baseurl}/${campaignId}/recipients/${recipientId}/retry`,
      {},
    );
    if (!resp.item) throw new Error("Retry not allowed for this recipient.");
    return resp.item;
  }
}
