import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Organisation,
  OrganisationDeleteReq,
  OrganisationSelectReq,
} from '../models/organisation.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class OrganisationService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/Organisation';
        this.http = new AxiosHelperUtils();
    }
    async select(req: OrganisationSelectReq) {
        let postdata: ActionReq<OrganisationSelectReq> =
            new ActionReq<OrganisationSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Organisation>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item!;
    }
    async save(req: Organisation) {
        let postdata: ActionReq<Organisation> = new ActionReq<Organisation>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Organisation>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item!;
    }
    async insert(req: Organisation) {
        let postdata: ActionReq<Organisation> = new ActionReq<Organisation>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Organisation>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item!;
    }
    async update(req: Organisation) {
        let postdata: ActionReq<Organisation> = new ActionReq<Organisation>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Organisation>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item!;
    }
    async delete(req: OrganisationDeleteReq) {
        let postdata: ActionReq<OrganisationDeleteReq> = new ActionReq<OrganisationDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item!;
    }
}
