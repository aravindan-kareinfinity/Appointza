import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Organization,
  OrganizationDeleteReq,
  OrganizationSelectReq,
} from '../models/organization.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class OrganizationService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/Organization';
        this.http = new AxiosHelperUtils();
    }
    async select(req: OrganizationSelectReq) {
        let postdata: ActionReq<OrganizationSelectReq> =
            new ActionReq<OrganizationSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Organization>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: Organization) {
        let postdata: ActionReq<Organization> = new ActionReq<Organization>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Organization>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: Organization) {
        let postdata: ActionReq<Organization> = new ActionReq<Organization>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Organization>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: Organization) {
        let postdata: ActionReq<Organization> = new ActionReq<Organization>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Organization>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: OrganizationDeleteReq) {
        let postdata: ActionReq<OrganizationDeleteReq> = new ActionReq<OrganizationDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
