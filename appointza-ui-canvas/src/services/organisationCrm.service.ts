import { ActionRes } from "@/models/actionres.model";
import type {
  OrganisationCrmCatalogueOverview,
  OrganisationCrmCatalogueSelectReq,
} from "@/models/organisationCrmCatalogue.model";
import { AxiosHelperUtils } from "@/utils/axioshelper.utils";
import { environment } from "@/utils/environment";

export class OrganisationCrmService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + "/api/OrganisationCrm";
  }

  async getCatalogueOverview(
    req: OrganisationCrmCatalogueSelectReq = {},
  ): Promise<OrganisationCrmCatalogueOverview> {
    const resp = await this.http.post<ActionRes<OrganisationCrmCatalogueOverview>>(
      `${this.baseurl}/GetCatalogueOverview`,
      { item: req },
    );
    if (!resp.item) {
      throw new Error("Failed to load CRM catalogue");
    }
    return resp.item;
  }
}
