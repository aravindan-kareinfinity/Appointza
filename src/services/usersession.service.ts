import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  UserSession,
  UserSessionDeleteReq,
  UserSessionSelectReq,
} from '../models/usersession.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class UserSessionService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/UserSession';
        this.http = new AxiosHelperUtils();
    }
    async select(req: UserSessionSelectReq) {
        let postdata: ActionReq<UserSessionSelectReq> =
            new ActionReq<UserSessionSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<UserSession>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item!;
    }
    async save(req: UserSession) {
        let postdata: ActionReq<UserSession> = new ActionReq<UserSession>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<UserSession>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item!;
    }
    async insert(req: UserSession) {
        let postdata: ActionReq<UserSession> = new ActionReq<UserSession>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<UserSession>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item!;
    }
    async update(req: UserSession) {
        let postdata: ActionReq<UserSession> = new ActionReq<UserSession>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<UserSession>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item!;
    }
    async delete(req: UserSessionDeleteReq) {
        let postdata: ActionReq<UserSessionDeleteReq> = new ActionReq<UserSessionDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item!;
    }
}
