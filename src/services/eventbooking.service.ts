import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  EventBooking,
  EventBookingDeleteReq,
  EventBookingSelectReq,
} from '../models/eventbooking.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class EventBookingService {
    baseurl: string;
    http: AxiosHelperUtils;
    
    constructor() {
        this.baseurl = environment.baseurl + '/api/EventBooking';
        this.http = new AxiosHelperUtils();
    }

    async select(req: EventBookingSelectReq) {
        let postdata: ActionReq<EventBookingSelectReq> = new ActionReq<EventBookingSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<EventBooking>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }

    async insert(req: EventBooking) {
        let postdata: ActionReq<EventBooking> = new ActionReq<EventBooking>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<EventBooking>>(
            this.baseurl + '/insert',
            postdata
        );
        return resp.item;
    }

    async update(req: EventBooking) {
        let postdata: ActionReq<EventBooking> = new ActionReq<EventBooking>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<EventBooking>>(
            this.baseurl + '/update',
            postdata
        );
        return resp.item;
    }

    async delete(req: EventBookingDeleteReq) {
        let postdata: ActionReq<EventBookingDeleteReq> = new ActionReq<EventBookingDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
        return resp.item;
    }
}

