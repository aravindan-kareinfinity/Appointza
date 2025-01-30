import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Task,
  TaskDeleteReq,
  TaskSelectReq,
} from '../models/task.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class TaskService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/Task';
        this.http = new AxiosHelperUtils();
    }
    async select(req: TaskSelectReq) {
        let postdata: ActionReq<TaskSelectReq> =
            new ActionReq<TaskSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Task>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: Task) {
        let postdata: ActionReq<Task> = new ActionReq<Task>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Task>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: Task) {
        let postdata: ActionReq<Task> = new ActionReq<Task>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Task>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: Task) {
        let postdata: ActionReq<Task> = new ActionReq<Task>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Task>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: TaskDeleteReq) {
        let postdata: ActionReq<TaskDeleteReq> = new ActionReq<TaskDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
