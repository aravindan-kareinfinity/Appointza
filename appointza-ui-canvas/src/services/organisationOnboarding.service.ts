import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  OnboardingMarkAction,
  OnboardingOfferingKey,
  OrganisationOnboardingMarkOfferingReq,
  OrganisationOnboardingSaveReq,
  OrganisationOnboardingState,
} from '../models/organisationOnboarding.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class OrganisationOnboardingService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + '/api/OrganisationOnboarding';
  }

  private unwrap(resp: ActionRes<OrganisationOnboardingState>): OrganisationOnboardingState {
    if (resp.error) throw new Error(resp.error);
    if (!resp.item) throw new Error('Onboarding status unavailable.');
    return resp.item;
  }

  async getStatus() {
    const resp = await this.http.post<ActionRes<OrganisationOnboardingState>>(
      this.baseurl + '/GetStatus',
      {},
    );
    return this.unwrap(resp);
  }

  async save(req: OrganisationOnboardingSaveReq) {
    const postdata = new ActionReq<OrganisationOnboardingSaveReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<OrganisationOnboardingState>>(
      this.baseurl + '/Save',
      postdata,
    );
    return this.unwrap(resp);
  }

  async markOffering(offering: OnboardingOfferingKey, action: OnboardingMarkAction) {
    const postdata = new ActionReq<OrganisationOnboardingMarkOfferingReq>();
    postdata.item = { offering, action };
    const resp = await this.http.post<ActionRes<OrganisationOnboardingState>>(
      this.baseurl + '/MarkOffering',
      postdata,
    );
    return this.unwrap(resp);
  }

  async complete() {
    const resp = await this.http.post<ActionRes<OrganisationOnboardingState>>(
      this.baseurl + '/Complete',
      {},
    );
    return this.unwrap(resp);
  }
}
