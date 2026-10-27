import { ActionRes } from "@/models/actionres.model";
import type {
  WhatsAppAutomationExecutionDto,
  WhatsAppAutomationRuleDto,
  WhatsAppAutomationRuleUpsertReq,
} from "@/models/whatsappAutomation.model";
import { AxiosHelperUtils } from "@/utils/axioshelper.utils";
import { environment } from "@/utils/environment";

export class WhatsAppAutomationService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + "/api/crm/whatsapp/automations";
  }

  async select(params?: {
    search?: string;
    trigger_type?: string;
    is_enabled?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<WhatsAppAutomationRuleDto[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.trigger_type) qs.set("trigger_type", params.trigger_type);
    if (params?.is_enabled != null) qs.set("is_enabled", String(params.is_enabled));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const query = qs.toString();
    const resp = await this.http.get<ActionRes<WhatsAppAutomationRuleDto[]>>(
      `${this.baseurl}${query ? `?${query}` : ""}`,
    );
    return resp.item ?? [];
  }

  async create(body: WhatsAppAutomationRuleUpsertReq): Promise<WhatsAppAutomationRuleDto> {
    const resp = await this.http.post<ActionRes<WhatsAppAutomationRuleDto>>(this.baseurl, body);
    if (!resp.item) throw new Error("Failed to create automation rule.");
    return resp.item;
  }

  async update(id: number, body: WhatsAppAutomationRuleUpsertReq): Promise<WhatsAppAutomationRuleDto> {
    const resp = await this.http.put<ActionRes<WhatsAppAutomationRuleDto>>(`${this.baseurl}/${id}`, body);
    if (!resp.item) throw new Error("Failed to update automation rule.");
    return resp.item;
  }

  async enable(id: number, expected_version?: number): Promise<WhatsAppAutomationRuleDto> {
    const qs = expected_version != null ? `?expected_version=${expected_version}` : "";
    const resp = await this.http.post<ActionRes<WhatsAppAutomationRuleDto>>(
      `${this.baseurl}/${id}/enable${qs}`,
      {},
    );
    if (!resp.item) throw new Error("Enable failed.");
    return resp.item;
  }

  async disable(id: number, expected_version?: number): Promise<WhatsAppAutomationRuleDto> {
    const qs = expected_version != null ? `?expected_version=${expected_version}` : "";
    const resp = await this.http.post<ActionRes<WhatsAppAutomationRuleDto>>(
      `${this.baseurl}/${id}/disable${qs}`,
      {},
    );
    if (!resp.item) throw new Error("Disable failed.");
    return resp.item;
  }

  async executions(
    ruleId?: number,
    params?: { status?: string; search?: string; limit?: number; offset?: number },
  ): Promise<{ items: WhatsAppAutomationExecutionDto[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const query = qs.toString();
    const url = ruleId
      ? `${this.baseurl}/${ruleId}/executions${query ? `?${query}` : ""}`
      : `${environment.baseurl}/api/crm/whatsapp/automation-executions${query ? `?${query}` : ""}`;
    const resp = await this.http.get<ActionRes<WhatsAppAutomationExecutionDto[]> & { resultCount?: number }>(url);
    return { items: resp.item ?? [], total: resp.resultCount ?? resp.item?.length ?? 0 };
  }
}
