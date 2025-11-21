import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Event,
  EventDeleteReq,
  EventSelectReq,
} from '../models/event.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class EventService {
    baseurl: string;
    http: AxiosHelperUtils;
    
    constructor() {
        this.baseurl = environment.baseurl + '/api/Event';
        this.http = new AxiosHelperUtils();
    }

    async select(req: EventSelectReq) {
        let postdata: ActionReq<EventSelectReq> = new ActionReq<EventSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Event>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }

    async save(req: Event) {
        let postdata: ActionReq<Event> = new ActionReq<Event>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Event>>(
            this.baseurl + '/save',
            postdata
        );
        return resp.item;
    }

    async insert(req: Event) {
        let postdata: ActionReq<Event> = new ActionReq<Event>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Event>>(
            this.baseurl + '/insert',
            postdata
        );
        return resp.item;
    }

    async update(req: Event) {
        let postdata: ActionReq<Event> = new ActionReq<Event>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Event>>(
            this.baseurl + '/update',
            postdata
        );
        return resp.item;
    }

    async delete(req: EventDeleteReq) {
        let postdata: ActionReq<EventDeleteReq> = new ActionReq<EventDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
        return resp.item;
    }
}

