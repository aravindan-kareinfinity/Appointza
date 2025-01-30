import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Services,
  ServicesDeleteReq,
  ServicesSelectReq,
} from '../models/services.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class ServicesService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/Services';
        this.http = new AxiosHelperUtils();
    }
    async select(req: ServicesSelectReq) {
        let postdata: ActionReq<ServicesSelectReq> =
            new ActionReq<ServicesSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Services>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: Services) {
        let postdata: ActionReq<Services> = new ActionReq<Services>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Services>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: Services) {
        let postdata: ActionReq<Services> = new ActionReq<Services>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Services>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: Services) {
        let postdata: ActionReq<Services> = new ActionReq<Services>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Services>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: ServicesDeleteReq) {
        let postdata: ActionReq<ServicesDeleteReq> = new ActionReq<ServicesDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
