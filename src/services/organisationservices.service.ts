import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  OrganisationServices,
  OrganisationServicesDeleteReq,
  OrganisationServicesSelectReq,
} from '../models/organisationservices.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class OrganisationServicesService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/OrganisationServices';
        this.http = new AxiosHelperUtils();
    }
    async select(req: OrganisationServicesSelectReq) {
        let postdata: ActionReq<OrganisationServicesSelectReq> =
            new ActionReq<OrganisationServicesSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganisationServices>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: OrganisationServices) {
        let postdata: ActionReq<OrganisationServices> = new ActionReq<OrganisationServices>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServices>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: OrganisationServices) {
        let postdata: ActionReq<OrganisationServices> = new ActionReq<OrganisationServices>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServices>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: OrganisationServices) {
        let postdata: ActionReq<OrganisationServices> = new ActionReq<OrganisationServices>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServices>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: OrganisationServicesDeleteReq) {
        let postdata: ActionReq<OrganisationServicesDeleteReq> = new ActionReq<OrganisationServicesDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
