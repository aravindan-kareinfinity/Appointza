import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import { Appoinment } from '../models/appoinment.model';
import {
  OrganisationServiceTiming,
  OrganisationServiceTimingDeleteReq,
  OrganisationServiceTimingFinal,
  OrganisationServiceTimingSelectReq,
} from '../models/organisationservicetiming.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class OrganisationServiceTimingService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/OrganisationServiceTiming';
        this.http = new AxiosHelperUtils();
    }
    async select(req: OrganisationServiceTimingSelectReq) {
        let postdata: ActionReq<OrganisationServiceTimingSelectReq> =
            new ActionReq<OrganisationServiceTimingSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganisationServiceTimingFinal>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: OrganisationServiceTimingFinal) {
        let postdata: ActionReq<OrganisationServiceTimingFinal> = new ActionReq<OrganisationServiceTimingFinal>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServiceTimingFinal>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: OrganisationServiceTiming) {
        let postdata: ActionReq<OrganisationServiceTiming> = new ActionReq<OrganisationServiceTiming>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServiceTiming>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: OrganisationServiceTiming) {
        let postdata: ActionReq<OrganisationServiceTiming> = new ActionReq<OrganisationServiceTiming>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServiceTiming>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: OrganisationServiceTimingDeleteReq) {
        let postdata: ActionReq<OrganisationServiceTimingDeleteReq> = new ActionReq<OrganisationServiceTimingDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }

    async selecttimingslot(req: OrganisationServiceTimingSelectReq) {
        let postdata: ActionReq<OrganisationServiceTimingSelectReq> =
            new ActionReq<OrganisationServiceTimingSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Appoinment>>>(
            this.baseurl + '/selecttimingslot', 
            postdata
        );
        return resp.item;
    }
}
