import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
    AppointmentPaymentsummary,
  OrganisationLocation,
  OrganisationLocationDeleteReq,
  OrganisationLocationSelectReq,
  OrganisationLocationStaffReq,
  OrganisationLocationStaffRes,
  OrgLocationReq,
  OrgLocationStaffResponse,
  UsersGenerateQRCodeReq,
  UsersGenerateQRCodeRes,
} from '../models/organisationlocation.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class OrganisationLocationService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/OrganisationLocation';
        this.http = new AxiosHelperUtils();
    }
    async select(req: OrganisationLocationSelectReq) {
        let postdata: ActionReq<OrganisationLocationSelectReq> =
            new ActionReq<OrganisationLocationSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganisationLocation>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: OrganisationLocation) {
        let postdata: ActionReq<OrganisationLocation> = new ActionReq<OrganisationLocation>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationLocation>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: OrganisationLocation) {
        let postdata: ActionReq<OrganisationLocation> = new ActionReq<OrganisationLocation>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationLocation>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: OrganisationLocation) {
        let postdata: ActionReq<OrganisationLocation> = new ActionReq<OrganisationLocation>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationLocation>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: OrganisationLocationDeleteReq) {
        let postdata: ActionReq<OrganisationLocationDeleteReq> = new ActionReq<OrganisationLocationDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }

    async Selectlocation(req: OrganisationLocationStaffReq) {
        let postdata: ActionReq<OrganisationLocationStaffReq> =
            new ActionReq<OrganisationLocationStaffReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganisationLocationStaffRes>>>(
            this.baseurl + '/Selectlocation', 
            postdata
        );
        return resp.item;
    }

    async SelectlocationDetail(req: OrgLocationReq) {
        let postdata: ActionReq<OrgLocationReq> =
            new ActionReq<OrgLocationReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrgLocationStaffResponse>>>(
            this.baseurl + '/SelectlocationDetail', 
            postdata
        );
        return resp.item;
    }


    async SelectAppointmentPaymentsummary(req: OrgLocationReq) {
        let postdata: ActionReq<OrgLocationReq> =
            new ActionReq<OrgLocationReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<AppointmentPaymentsummary >>(
            this.baseurl + '/SelectAppointmentPaymentsummary', 
            postdata
        );
        return resp.item;
    }

    async GenerateQRCode(req: UsersGenerateQRCodeReq) {
        let postdata: ActionReq<UsersGenerateQRCodeReq> = new ActionReq<UsersGenerateQRCodeReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<UsersGenerateQRCodeRes>>(
            this.baseurl + '/GenerateQRCode',
            postdata
        );
        return resp.item;
    }
}
