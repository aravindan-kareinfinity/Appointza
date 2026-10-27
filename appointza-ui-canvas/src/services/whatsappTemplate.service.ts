import { ActionRes } from "@/models/actionres.model";
import type {
  WhatsAppTemplateCreateReq,
  WhatsAppTemplateDto,
  WhatsAppTemplateSyncResult,
} from "@/models/whatsappTemplate.model";
import { AxiosHelperUtils } from "@/utils/axioshelper.utils";
import { environment } from "@/utils/environment";

export class WhatsAppTemplateService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + "/api/crm/whatsapp/templates";
  }

  async select(params?: {
    search?: string;
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
    include_archived?: boolean;
    signal?: AbortSignal;
  }): Promise<WhatsAppTemplateDto[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.category) qs.set("category", params.category);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    if (params?.include_archived) qs.set("include_archived", "true");
    const query = qs.toString();
    const resp = await this.http.get<ActionRes<WhatsAppTemplateDto[]>>(
      `${this.baseurl}${query ? `?${query}` : ""}`,
      false,
      {},
      params?.signal ? { signal: params.signal } : undefined,
    );
    return resp.item ?? [];
  }

  async getById(id: number, signal?: AbortSignal): Promise<WhatsAppTemplateDto | null> {
    const resp = await this.http.get<ActionRes<WhatsAppTemplateDto>>(
      `${this.baseurl}/${id}`,
      false,
      {},
      signal ? { signal } : undefined,
    );
    return resp.item ?? null;
  }

  async sync(whatsappConnectionId = 0): Promise<WhatsAppTemplateSyncResult> {
    const qs = whatsappConnectionId > 0 ? `?whatsapp_connection_id=${whatsappConnectionId}` : "";
    const resp = await this.http.post<ActionRes<WhatsAppTemplateSyncResult>>(
      `${this.baseurl}/sync${qs}`,
      {},
    );
    if (!resp.item) throw new Error("Sync failed.");
    return resp.item;
  }

  async create(body: WhatsAppTemplateCreateReq): Promise<WhatsAppTemplateDto> {
    const resp = await this.http.post<ActionRes<WhatsAppTemplateDto>>(this.baseurl, body);
    if (!resp.item) throw new Error("Failed to create template.");
    return resp.item;
  }

  async submit(id: number): Promise<WhatsAppTemplateDto> {
    const resp = await this.http.post<ActionRes<WhatsAppTemplateDto>>(
      `${this.baseurl}/${id}/submit`,
      {},
    );
    if (!resp.item) throw new Error("Failed to submit template.");
    return resp.item;
  }

  async refreshStatus(id: number): Promise<WhatsAppTemplateDto> {
    const resp = await this.http.post<ActionRes<WhatsAppTemplateDto>>(
      `${this.baseurl}/${id}/refresh-status`,
      {},
    );
    if (!resp.item) throw new Error("Failed to refresh status.");
    return resp.item;
  }
}
