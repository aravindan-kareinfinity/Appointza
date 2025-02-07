import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  OrganisationTask,
  OrganisationTaskDeleteReq,
  OrganisationTaskSelectReq,
} from '../models/organisationtask.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class OrganisationTaskService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/OrganisationTask';
        this.http = new AxiosHelperUtils();
    }
    async select(req: OrganisationTaskSelectReq) {
        let postdata: ActionReq<OrganisationTaskSelectReq> =
            new ActionReq<OrganisationTaskSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganisationTask>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: OrganisationTask) {
        let postdata: ActionReq<OrganisationTask> = new ActionReq<OrganisationTask>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationTask>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: OrganisationTask) {
        let postdata: ActionReq<OrganisationTask> = new ActionReq<OrganisationTask>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationTask>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: OrganisationTask) {
        let postdata: ActionReq<OrganisationTask> = new ActionReq<OrganisationTask>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationTask>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: OrganisationTaskDeleteReq) {
        let postdata: ActionReq<OrganisationTaskDeleteReq> = new ActionReq<OrganisationTaskDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
