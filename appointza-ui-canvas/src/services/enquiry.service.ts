import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import { Enquiry, EnquirySelectReq, EnquiryDeleteReq } from '../models/enquiry.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class EnquiryService {
  http: AxiosHelperUtils;
  
  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + '/api/Enquiry';
  }

  async select(req: EnquirySelectReq) {
    let postdata: ActionReq<EnquirySelectReq> = new ActionReq<EnquirySelectReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<Enquiry>>>(
      this.baseurl + '/Select',
      postdata,
    );
    return resp.item!;
  }

  /** All enquiries for an organization (newest first). */
  async selectByOrganisation(organisationId: number) {
    return this.select({
      id: 0,
      organisation_id: organisationId,
      status: "",
      source: "",
      is_active: null,
    });
  }

  async insert(req: Enquiry) {
    const postdata: ActionReq<Enquiry> = new ActionReq<Enquiry>();
    // Server sets created_at/updated_at; never send "" (breaks DateTime JSON binding).
    const { created_at: _c, updated_at: _u, ...item } = req;
    postdata.item = item as Enquiry;
    const resp = await this.http.post<ActionRes<Enquiry>>(
      this.baseurl + '/Insert',
      postdata,
      true, // skipAuthorization for public contact form
    );
    return resp.item!;
  }

  async update(req: Enquiry) {
    let postdata: ActionReq<Enquiry> = new ActionReq<Enquiry>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Enquiry>>(
      this.baseurl + '/Update',
      postdata,
    );
    return resp.item!;
  }

  async save(req: Enquiry) {
    const postdata: ActionReq<Enquiry> = new ActionReq<Enquiry>();
    const { created_at: _c, updated_at: _u, ...item } = req;
    postdata.item = item as Enquiry;
    const resp = await this.http.post<ActionRes<Enquiry>>(
      this.baseurl + '/Save',
      postdata,
      true, // skipAuthorization for public contact form
    );
    return resp.item!;
  }

  async delete(req: EnquiryDeleteReq) {
    let postdata: ActionReq<EnquiryDeleteReq> = new ActionReq<EnquiryDeleteReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/Delete',
      postdata,
    );
    return resp.item!;
  }
}

