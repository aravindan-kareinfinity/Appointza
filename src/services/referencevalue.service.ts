import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  ReferenceValue,
  ReferenceValueDeleteReq,
  ReferenceValueSelectReq,
} from '../models/referencevalue.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class ReferenceValueService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/ReferenceValue';
        this.http = new AxiosHelperUtils();
    }
    async select(req: ReferenceValueSelectReq) {
        let postdata: ActionReq<ReferenceValueSelectReq> =
            new ActionReq<ReferenceValueSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<ReferenceValue>>>(
            this.baseurl + '/select', 
            postdata
        );
        console.log('ReferenceValue select resp', this.baseurl + '/select');
        
        console.log(resp);
        
        return resp.item;
    }
    async save(req: ReferenceValue) {
        let postdata: ActionReq<ReferenceValue> = new ActionReq<ReferenceValue>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<ReferenceValue>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: ReferenceValue) {
        let postdata: ActionReq<ReferenceValue> = new ActionReq<ReferenceValue>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<ReferenceValue>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: ReferenceValue) {
        let postdata: ActionReq<ReferenceValue> = new ActionReq<ReferenceValue>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<ReferenceValue>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: ReferenceValueDeleteReq) {
        let postdata: ActionReq<ReferenceValueDeleteReq> = new ActionReq<ReferenceValueDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
