import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  OrganizationServiceTiming,
  OrganizationServiceTimingDeleteReq,
  OrganizationServiceTimingSelectReq,
} from '../models/organizationservicetiming.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class OrganizationServiceTimingService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/OrganizationServiceTiming';
        this.http = new AxiosHelperUtils();
    }
    async select(req: OrganizationServiceTimingSelectReq) {
        let postdata: ActionReq<OrganizationServiceTimingSelectReq> =
            new ActionReq<OrganizationServiceTimingSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganizationServiceTiming>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: OrganizationServiceTiming) {
        let postdata: ActionReq<OrganizationServiceTiming> = new ActionReq<OrganizationServiceTiming>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganizationServiceTiming>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: OrganizationServiceTiming) {
        let postdata: ActionReq<OrganizationServiceTiming> = new ActionReq<OrganizationServiceTiming>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganizationServiceTiming>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: OrganizationServiceTiming) {
        let postdata: ActionReq<OrganizationServiceTiming> = new ActionReq<OrganizationServiceTiming>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganizationServiceTiming>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: OrganizationServiceTimingDeleteReq) {
        let postdata: ActionReq<OrganizationServiceTimingDeleteReq> = new ActionReq<OrganizationServiceTimingDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
