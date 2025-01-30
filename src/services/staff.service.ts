import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Staff,
  StaffDeleteReq,
  StaffSelectReq,
} from '../models/staff.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class StaffService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/Staff';
        this.http = new AxiosHelperUtils();
    }
    async select(req: StaffSelectReq) {
        let postdata: ActionReq<StaffSelectReq> =
            new ActionReq<StaffSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Staff>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: Staff) {
        let postdata: ActionReq<Staff> = new ActionReq<Staff>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Staff>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: Staff) {
        let postdata: ActionReq<Staff> = new ActionReq<Staff>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Staff>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: Staff) {
        let postdata: ActionReq<Staff> = new ActionReq<Staff>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Staff>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: StaffDeleteReq) {
        let postdata: ActionReq<StaffDeleteReq> = new ActionReq<StaffDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
