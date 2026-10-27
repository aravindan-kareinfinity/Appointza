import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
    Organisation,
    OrganisationSelectReq,
    OrganisationDeleteReq,
    OrganisationDetail,
    OrganisationReferralInfoRes,
    OrganisationReferralSelectReq,
    OrganisationReferralApplyReq,
    OrganisationReferralApplyRes,
} from '../models/organisation.model';
import {
    OrganisationReferralVerifyReq,
    OrganisationReferralVerifyRes,
} from '../models/organisationOnboarding.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class OrganisationService {
    http: AxiosHelperUtils;

    constructor() {
        this.http = new AxiosHelperUtils();
    }

    get baseurl(): string {
        return environment.baseurl + '/api/Organisation';
    }

    async select(req: OrganisationSelectReq) {
        let postdata: ActionReq<OrganisationSelectReq> = new ActionReq<OrganisationSelectReq>();
        postdata.item = req;
        console.log('📤 OrganisationService.select sending:', JSON.stringify(postdata, null, 2));
        let resp = await this.http.post<ActionRes<Organisation[]>>(
            this.baseurl + '/Select',
            postdata
        );
        return resp.item;
    }

    async insert(organisation: Organisation) {
        let postdata: ActionReq<Organisation> = new ActionReq<Organisation>();
        postdata.item = organisation;
        console.log('📤 OrganisationService.insert sending:', JSON.stringify(postdata, null, 2));
        let resp = await this.http.post<ActionRes<Organisation>>(
            this.baseurl + '/Insert',
            postdata
        );
        return resp.item;
    }

    async update(organisation: Organisation) {
        let postdata: ActionReq<Organisation> = new ActionReq<Organisation>();
        postdata.item = organisation;
        console.log('📤 OrganisationService.update sending:', JSON.stringify(postdata, null, 2));
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/Update',
            postdata
        );
        return resp.item;
    }

    async delete(req: OrganisationDeleteReq) {
        let postdata: ActionReq<OrganisationDeleteReq> = new ActionReq<OrganisationDeleteReq>();
        postdata.item = req;
        console.log('📤 OrganisationService.delete sending:', JSON.stringify(postdata, null, 2));
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/Delete',
            postdata
        );
        return resp.item;
    }

    async selectOrganisationDetail(req: OrganisationSelectReq) {
        let postdata: ActionReq<OrganisationSelectReq> = new ActionReq<OrganisationSelectReq>();
        postdata.item = req;
        console.log('📤 OrganisationService.selectOrganisationDetail sending:', JSON.stringify(postdata, null, 2));
        let resp = await this.http.post<ActionRes<OrganisationDetail[]>>(
            this.baseurl + '/SelectOrganisationDetail',
            postdata
        );
        return resp.item;
    }

    async getOrganisationByCustomUrl(customUrl: string) {
        let postdata = { customUrl };
        console.log('📤 OrganisationService.getOrganisationByCustomUrl sending:', JSON.stringify(postdata, null, 2));
        let resp = await this.http.post<any>(
            this.baseurl + '/GetOrganisationByCustomUrl',
            postdata
        );
        return resp;
    }

    async getReferral(organisationId?: number) {
        const postdata = new ActionReq<OrganisationReferralSelectReq>();
        postdata.item = new OrganisationReferralSelectReq();
        if (organisationId && organisationId > 0) {
            postdata.item.organisation_id = organisationId;
        }
        const resp = await this.http.post<ActionRes<OrganisationReferralInfoRes>>(
            this.baseurl + '/GetReferral',
            postdata,
        );
        return resp.item;
    }

    /** Public (no auth) check used on registration before the account exists. */
    async verifyReferral(referralCode: string) {
        const postdata = new ActionReq<OrganisationReferralVerifyReq>();
        postdata.item = new OrganisationReferralVerifyReq();
        postdata.item.referral_code = referralCode.trim();
        const resp = await this.http.post<ActionRes<OrganisationReferralVerifyRes>>(
            this.baseurl + '/VerifyReferral',
            postdata,
            true,
        );
        if (resp.error) throw new Error(resp.error);
        return resp.item;
    }

    async applyReferral(referralCode: string, organisationId?: number) {
        const postdata = new ActionReq<OrganisationReferralApplyReq>();
        postdata.item = new OrganisationReferralApplyReq();
        postdata.item.referral_code = referralCode.trim();
        if (organisationId && organisationId > 0) {
            postdata.item.organisation_id = organisationId;
        }
        const resp = await this.http.post<ActionRes<OrganisationReferralApplyRes>>(
            this.baseurl + '/ApplyReferral',
            postdata,
        );
        return resp.item;
    }
}