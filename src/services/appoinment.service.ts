import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
    AddStaffReq,
  Appoinment,
  AppoinmentDeleteReq,
  AppoinmentFinal,
  AppoinmentSelectReq,
  BookedAppoinmentRes,
  UpdatePaymentReq,
  UpdateStatusReq,
} from '../models/appoinment.model';
import { AppointmentSummary, AppointmentSummarySelectReq } from '../models/appointmentsummary.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class AppoinmentService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/Appoinment';
        this.http = new AxiosHelperUtils();
    }
    async select(req: AppoinmentSelectReq) {
        let postdata: ActionReq<AppoinmentSelectReq> =
            new ActionReq<AppoinmentSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Appoinment>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: Appoinment) {
        let postdata: ActionReq<Appoinment> = new ActionReq<Appoinment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Appoinment>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: Appoinment) {
        let postdata: ActionReq<Appoinment> = new ActionReq<Appoinment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Appoinment>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: Appoinment) {
        let postdata: ActionReq<Appoinment> = new ActionReq<Appoinment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Appoinment>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: AppoinmentDeleteReq) {
        let postdata: ActionReq<AppoinmentDeleteReq> = new ActionReq<AppoinmentDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }

    async SelectBookedAppoinment(req: AppoinmentSelectReq) {
        let postdata: ActionReq<AppoinmentSelectReq> =
            new ActionReq<AppoinmentSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<BookedAppoinmentRes>>>(
            this.baseurl + '/SelectBookedAppoinment', 
            postdata
        );
        return resp.item;
    }


    async Assignstaff(req: AddStaffReq) {
        let postdata: ActionReq<AddStaffReq> = new ActionReq<AddStaffReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/Assignstaff',
            postdata
        );
                
        return resp.item;
    }

    async UpdateStatus(req: UpdateStatusReq) {
        let postdata: ActionReq<UpdateStatusReq> = new ActionReq<UpdateStatusReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/UpdateStatus',
            postdata
        );
                
        return resp.item;
    }

    async UpdatePayment(req: UpdatePaymentReq) {
        let postdata: ActionReq<UpdatePaymentReq> = new ActionReq<UpdatePaymentReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/UpdatePayment',
            postdata
        );
                
        return resp.item;
    }

    async GetAppointmentSummary(req: AppointmentSummarySelectReq) {
        let postdata: ActionReq<AppointmentSummarySelectReq> = new ActionReq<AppointmentSummarySelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<AppointmentSummary>>(
            this.baseurl + '/GetAppointmentSummary',
            postdata
        );
                
        return resp.item;
    }

}
