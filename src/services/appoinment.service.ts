import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Appoinment,
  AppoinmentDeleteReq,
  AppoinmentSelectReq,
} from '../models/appoinment.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class AppoinmentService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/Appoinment';
        this.http = new AxiosHelperUtils();
    }
    async select(req: AppoinmentSelectReq) {
        let postdata: ActionReq<AppoinmentSelectReq> =
            new ActionReq<AppoinmentSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Appoinment>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: Appoinment) {
        let postdata: ActionReq<Appoinment> = new ActionReq<Appoinment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Appoinment>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: Appoinment) {
        let postdata: ActionReq<Appoinment> = new ActionReq<Appoinment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Appoinment>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: Appoinment) {
        let postdata: ActionReq<Appoinment> = new ActionReq<Appoinment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Appoinment>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: AppoinmentDeleteReq) {
        let postdata: ActionReq<AppoinmentDeleteReq> = new ActionReq<AppoinmentDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }


    async Bookappoinment(req: Appoinment) {
        let postdata: ActionReq<Appoinment> = new ActionReq<Appoinment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<string>>(
            this.baseurl + '/Bookappoinment',
            postdata
        );
                
        return resp.item;
    }

}
