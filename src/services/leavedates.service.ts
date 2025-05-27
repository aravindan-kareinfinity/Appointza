import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  LeaveDates,
  LeaveDatesDeleteReq,
  LeaveDatesSelectReq,
} from '../models/leavedates.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class LeaveDatesService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/LeaveDates';
        this.http = new AxiosHelperUtils();
    }
    async select(req: LeaveDatesSelectReq) {
        let postdata: ActionReq<LeaveDatesSelectReq> =
            new ActionReq<LeaveDatesSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<LeaveDates>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: LeaveDates) {
        let postdata: ActionReq<LeaveDates> = new ActionReq<LeaveDates>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<LeaveDates>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: LeaveDates) {
        let postdata: ActionReq<LeaveDates> = new ActionReq<LeaveDates>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<LeaveDates>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: LeaveDates) {
        let postdata: ActionReq<LeaveDates> = new ActionReq<LeaveDates>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<LeaveDates>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: LeaveDatesDeleteReq) {
        let postdata: ActionReq<LeaveDatesDeleteReq> = new ActionReq<LeaveDatesDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
