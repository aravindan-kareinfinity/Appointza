import {ActionReq} from '../models/actionreq.model';
import {ActionRes} from '../models/actionres.model';
import {Todo, TodoGetRes} from '../models/todo.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class TodoService {
  baseurl: string;
  http: AxiosHelperUtils;
  constructor() {
    this.baseurl = environment.baseurl + '/api/';
    this.http = new AxiosHelperUtils();
  }
  async select(req: Todo) {
    let postdata: ActionReq<Todo> = new ActionReq<Todo>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<Todo>>>(
      this.baseurl + '/select',
      postdata,
    );
    return resp.item!;
  }
  async insert(req: Todo) {
    let postdata: ActionReq<Todo> = new ActionReq<Todo>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Todo>>(
      this.baseurl + '/insert',
      postdata,
    );

    return resp.item!;
  }
}
