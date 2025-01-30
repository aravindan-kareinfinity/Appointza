import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  GroupMember,
  GroupMemberDeleteReq,
  GroupMemberSelectReq,
} from '../models/groupmember.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class GroupMemberService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/GroupMember';
        this.http = new AxiosHelperUtils();
    }
    async select(req: GroupMemberSelectReq) {
        let postdata: ActionReq<GroupMemberSelectReq> =
            new ActionReq<GroupMemberSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<GroupMember>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: GroupMember) {
        let postdata: ActionReq<GroupMember> = new ActionReq<GroupMember>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<GroupMember>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: GroupMember) {
        let postdata: ActionReq<GroupMember> = new ActionReq<GroupMember>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<GroupMember>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: GroupMember) {
        let postdata: ActionReq<GroupMember> = new ActionReq<GroupMember>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<GroupMember>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: GroupMemberDeleteReq) {
        let postdata: ActionReq<GroupMemberDeleteReq> = new ActionReq<GroupMemberDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
