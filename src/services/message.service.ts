import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Message,
  MessageDeleteReq,
  MessageSelectReq,
} from '../models/message.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class MessageService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/Message';
        this.http = new AxiosHelperUtils();
    }
    async select(req: MessageSelectReq) {
        let postdata: ActionReq<MessageSelectReq> =
            new ActionReq<MessageSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Message>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: Message) {
        let postdata: ActionReq<Message> = new ActionReq<Message>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Message>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: Message) {
        let postdata: ActionReq<Message> = new ActionReq<Message>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Message>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: Message) {
        let postdata: ActionReq<Message> = new ActionReq<Message>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Message>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: MessageDeleteReq) {
        let postdata: ActionReq<MessageDeleteReq> = new ActionReq<MessageDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
