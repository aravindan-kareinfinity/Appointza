import { ActionRes } from "@/models/actionres.model";
import type {
  EmailIntegrationUpsertReq,
  OrganisationIntegrationDisconnectReq,
  OrganisationIntegrationSafe,
  OrganisationIntegrationSelectReq,
  WhatsAppIntegrationUpsertReq,
} from "@/models/organisationCommunicationIntegration.model";
import { AxiosHelperUtils } from "@/utils/axioshelper.utils";
import { environment } from "@/utils/environment";

export class OrganisationCommunicationIntegrationService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + "/api/OrganisationCommunicationIntegration";
  }

  async select(req: OrganisationIntegrationSelectReq): Promise<OrganisationIntegrationSafe[]> {
    const resp = await this.http.post<ActionRes<OrganisationIntegrationSafe[]>>(
      `${this.baseurl}/Select`,
      { item: req },
    );
    return resp.item ?? [];
  }

  async upsertWhatsApp(req: WhatsAppIntegrationUpsertReq): Promise<OrganisationIntegrationSafe> {
    const resp = await this.http.post<ActionRes<OrganisationIntegrationSafe>>(
      `${this.baseurl}/UpsertWhatsApp`,
      { item: req },
    );
    if (!resp.item) {
      throw new Error("Failed to save WhatsApp integration");
    }
    return resp.item;
  }

  async upsertEmail(req: EmailIntegrationUpsertReq): Promise<OrganisationIntegrationSafe> {
    const resp = await this.http.post<ActionRes<OrganisationIntegrationSafe>>(
      `${this.baseurl}/UpsertEmail`,
      { item: req },
    );
    if (!resp.item) {
      throw new Error("Failed to save email integration");
    }
    return resp.item;
  }

  async disconnect(req: OrganisationIntegrationDisconnectReq): Promise<boolean> {
    const resp = await this.http.post<ActionRes<boolean>>(`${this.baseurl}/Disconnect`, {
      item: req,
    });
    return !!resp.item;
  }

  async delete(req: OrganisationIntegrationDisconnectReq): Promise<boolean> {
    const resp = await this.http.post<ActionRes<boolean>>(`${this.baseurl}/Delete`, {
      item: req,
    });
    return !!resp.item;
  }
}
