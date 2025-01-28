import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  OrganisationLocation,
  OrganisationLocationDeleteReq,
  OrganisationLocationSelectReq,
} from '../models/organisationlocation.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class OrganisationLocationService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/OrganisationLocation';
        this.http = new AxiosHelperUtils();
    }
    async select(req: OrganisationLocationSelectReq) {
        let postdata: ActionReq<OrganisationLocationSelectReq> =
            new ActionReq<OrganisationLocationSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganisationLocation>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item!;
    }
    async save(req: OrganisationLocation) {
        let postdata: ActionReq<OrganisationLocation> = new ActionReq<OrganisationLocation>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationLocation>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item!;
    }
    async insert(req: OrganisationLocation) {
        let postdata: ActionReq<OrganisationLocation> = new ActionReq<OrganisationLocation>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationLocation>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item!;
    }
    async update(req: OrganisationLocation) {
        let postdata: ActionReq<OrganisationLocation> = new ActionReq<OrganisationLocation>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationLocation>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item!;
    }
    async delete(req: OrganisationLocationDeleteReq) {
        let postdata: ActionReq<OrganisationLocationDeleteReq> = new ActionReq<OrganisationLocationDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item!;
    }
}
