import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  OrganizationGroup,
  OrganizationGroupDeleteReq,
  OrganizationGroupSelectReq,
} from '../models/organizationgroup.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class OrganizationGroupService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/OrganizationGroup';
        this.http = new AxiosHelperUtils();
    }
    async select(req: OrganizationGroupSelectReq) {
        let postdata: ActionReq<OrganizationGroupSelectReq> =
            new ActionReq<OrganizationGroupSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganizationGroup>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: OrganizationGroup) {
        let postdata: ActionReq<OrganizationGroup> = new ActionReq<OrganizationGroup>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganizationGroup>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: OrganizationGroup) {
        let postdata: ActionReq<OrganizationGroup> = new ActionReq<OrganizationGroup>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganizationGroup>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: OrganizationGroup) {
        let postdata: ActionReq<OrganizationGroup> = new ActionReq<OrganizationGroup>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganizationGroup>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: OrganizationGroupDeleteReq) {
        let postdata: ActionReq<OrganizationGroupDeleteReq> = new ActionReq<OrganizationGroupDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
