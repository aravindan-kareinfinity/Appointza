import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import { Appoinment, AppoinmentFinal } from '../models/appoinment.model';
import {
    Leavereq,
  OrganisationServiceTiming,
  OrganisationServiceTimingDeleteReq,
  OrganisationServiceTimingFinal,
  OrganisationServiceTimingSelectReq,
} from '../models/organisationservicetiming.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class OrganisationServiceTimingService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/OrganisationServiceTiming';
        this.http = new AxiosHelperUtils();
    }
    async select(req: OrganisationServiceTimingSelectReq) {
        let postdata: ActionReq<OrganisationServiceTimingSelectReq> =
            new ActionReq<OrganisationServiceTimingSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganisationServiceTimingFinal>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: OrganisationServiceTimingFinal) {
        let postdata: ActionReq<OrganisationServiceTimingFinal> = new ActionReq<OrganisationServiceTimingFinal>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServiceTimingFinal>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: OrganisationServiceTiming) {
        let postdata: ActionReq<OrganisationServiceTiming> = new ActionReq<OrganisationServiceTiming>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServiceTiming>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: OrganisationServiceTiming) {
        let postdata: ActionReq<OrganisationServiceTiming> = new ActionReq<OrganisationServiceTiming>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServiceTiming>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: OrganisationServiceTimingDeleteReq) {
        let postdata: ActionReq<OrganisationServiceTimingDeleteReq> = new ActionReq<OrganisationServiceTimingDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }

    async selecttimingslot(req: OrganisationServiceTimingSelectReq) {
        let postdata: ActionReq<OrganisationServiceTimingSelectReq> =
            new ActionReq<OrganisationServiceTimingSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<AppoinmentFinal>>>(
            this.baseurl + '/selecttimingslot', 
            postdata
        );
        return resp.item;
    }


    
        async Bookappoinment(req: AppoinmentFinal) {
            let postdata: ActionReq<AppoinmentFinal> = new ActionReq<AppoinmentFinal>();
            postdata.item = req;
            let resp = await this.http.post<ActionRes<string>>(
                this.baseurl + '/Bookappoinment',
                postdata
            );
                    
            return resp.item;
        }

        async BookLeave(req: Partial<Leavereq> | any) {
            // Some endpoints might expect the raw object (not wrapped) or the wrapper key 'req'.
            // Try the standard wrapper first; if backend requires 'req', we can adjust here.
            let postdata: any = new ActionReq<Leavereq>();
            postdata.item = req as Leavereq;
            let resp = await this.http.post<ActionRes<string>>(
                this.baseurl + '/BookLeave',
                postdata
            );
            return resp.item;
        }

}
