import { ActionRes } from "@/models/actionres.model";
import type {
  WhatsAppConversationDto,
  WhatsAppConversationPatchReq,
  WhatsAppEnsureConversationReq,
  WhatsAppMessageDto,
  WhatsAppMessagingContactDto,
  WhatsAppSendTemplateReq,
  WhatsAppSendTextReq,
  WhatsAppWebhookSetupDto,
} from "@/models/whatsappCrm.model";
import { AxiosHelperUtils } from "@/utils/axioshelper.utils";
import { environment } from "@/utils/environment";

/** Phase 3 CRM WhatsApp APIs — Inbox UI. */
export class WhatsAppCrmService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + "/api/crm/whatsapp";
  }

  async getWebhookSetup(): Promise<WhatsAppWebhookSetupDto> {
    const resp = await this.http.get<ActionRes<WhatsAppWebhookSetupDto> & { Item?: WhatsAppWebhookSetupDto }>(
      `${this.baseurl}/webhook-setup`,
    );
    const item = resp.item ?? resp.Item ?? null;
    if (!item) {
      throw new Error("Webhook setup response was empty.");
    }
    const token = (item.verify_token || "").trim();
    return {
      verify_token: token,
      callback_path: item.callback_path || "/api/webhooks/whatsapp",
      verify_token_configured: token.length > 0,
      app_secret_configured: !!item.app_secret_configured,
    };
  }

  async selectMessagingContacts(params?: {
    search?: string;
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
  }): Promise<WhatsAppMessagingContactDto[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const query = qs.toString();
    const resp = await this.http.get<ActionRes<WhatsAppMessagingContactDto[]>>(
      `${this.baseurl}/messaging-contacts${query ? `?${query}` : ""}`,
      false,
      {},
      params?.signal ? { signal: params.signal } : undefined,
    );
    return resp.item ?? [];
  }

  async ensureConversation(body: WhatsAppEnsureConversationReq): Promise<WhatsAppConversationDto> {
    const resp = await this.http.post<ActionRes<WhatsAppConversationDto>>(
      `${this.baseurl}/conversations/ensure`,
      body,
    );
    if (!resp.item) {
      throw new Error("Failed to open conversation");
    }
    return resp.item;
  }

  async sendTemplate(
    conversationId: number,
    body: WhatsAppSendTemplateReq,
  ): Promise<WhatsAppMessageDto> {
    const resp = await this.http.post<ActionRes<WhatsAppMessageDto>>(
      `${this.baseurl}/conversations/${conversationId}/messages/template`,
      { ...body, conversation_id: conversationId },
    );
    if (!resp.item) {
      throw new Error("Failed to send template");
    }
    return resp.item;
  }

  async selectConversations(params?: {
    search?: string;
    status?: string;
    unread_only?: boolean;
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
  }): Promise<WhatsAppConversationDto[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.unread_only) qs.set("unread_only", "true");
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const query = qs.toString();
    const resp = await this.http.get<ActionRes<WhatsAppConversationDto[]>>(
      `${this.baseurl}/conversations${query ? `?${query}` : ""}`,
      false,
      {},
      params?.signal ? { signal: params.signal } : undefined,
    );
    return resp.item ?? [];
  }

  async getConversation(id: number, signal?: AbortSignal): Promise<WhatsAppConversationDto | null> {
    const resp = await this.http.get<ActionRes<WhatsAppConversationDto>>(
      `${this.baseurl}/conversations/${id}`,
      false,
      {},
      signal ? { signal } : undefined,
    );
    return resp.item ?? null;
  }

  async selectMessages(
    conversationId: number,
    limit = 100,
    signal?: AbortSignal,
  ): Promise<WhatsAppMessageDto[]> {
    const resp = await this.http.get<ActionRes<WhatsAppMessageDto[]>>(
      `${this.baseurl}/conversations/${conversationId}/messages?limit=${limit}`,
      false,
      {},
      signal ? { signal } : undefined,
    );
    return resp.item ?? [];
  }

  async sendText(conversationId: number, text: string): Promise<WhatsAppMessageDto> {
    const body: WhatsAppSendTextReq = { conversation_id: conversationId, text };
    const resp = await this.http.post<ActionRes<WhatsAppMessageDto>>(
      `${this.baseurl}/conversations/${conversationId}/messages`,
      body,
    );
    if (!resp.item) {
      throw new Error("Failed to send message");
    }
    return resp.item;
  }

  async patchConversation(
    conversationId: number,
    patch: Omit<WhatsAppConversationPatchReq, "conversation_id" | "organisation_id">,
  ): Promise<WhatsAppConversationDto> {
    const resp = await this.http.patch<ActionRes<WhatsAppConversationDto>>(
      `${this.baseurl}/conversations/${conversationId}`,
      patch,
    );
    if (!resp.item) {
      throw new Error("Failed to update conversation");
    }
    return resp.item;
  }
}
