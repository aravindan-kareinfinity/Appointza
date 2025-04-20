import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Timeline,
  TimelineDeleteReq,
  TimelineSelectReq,
} from '../models/timeline.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class TimelineService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/Timeline';
        this.http = new AxiosHelperUtils();
    }
    async select(req: TimelineSelectReq) {
        let postdata: ActionReq<TimelineSelectReq> =
            new ActionReq<TimelineSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Timeline>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: Timeline) {
        let postdata: ActionReq<Timeline> = new ActionReq<Timeline>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Timeline>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: Timeline) {
        let postdata: ActionReq<Timeline> = new ActionReq<Timeline>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Timeline>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: Timeline) {
        let postdata: ActionReq<Timeline> = new ActionReq<Timeline>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Timeline>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: TimelineDeleteReq) {
        let postdata: ActionReq<TimelineDeleteReq> = new ActionReq<TimelineDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
