import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Payment,
  PaymentDeleteReq,
  PaymentSelectReq,
} from '../models/payment.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class PaymentService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/Payment';
        this.http = new AxiosHelperUtils();
    }
    async select(req: PaymentSelectReq) {
        let postdata: ActionReq<PaymentSelectReq> =
            new ActionReq<PaymentSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Payment>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: Payment) {
        let postdata: ActionReq<Payment> = new ActionReq<Payment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Payment>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: Payment) {
        let postdata: ActionReq<Payment> = new ActionReq<Payment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Payment>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: Payment) {
        let postdata: ActionReq<Payment> = new ActionReq<Payment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Payment>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: PaymentDeleteReq) {
        let postdata: ActionReq<PaymentDeleteReq> = new ActionReq<PaymentDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
