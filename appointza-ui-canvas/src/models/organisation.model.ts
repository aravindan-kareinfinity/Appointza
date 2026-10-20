export type OrganisationType = "service" | "hospitality" | "both";

export class OrganisationReferralInfoRes {
  referral_code: string = "";
  successful_referrals: number = 0;
  bonus_credits_per_referral: number = 50;
  referral_already_applied: boolean = false;
  can_apply_referral_code: boolean = true;
}

export class OrganisationReferralSelectReq {
  organisation_id: number = 0;
}

export class OrganisationReferralApplyReq {
  organisation_id: number = 0;
  referral_code: string = "";
}

export class OrganisationReferralApplyRes {
  success: boolean = false;
  message: string = "";
}

export class Organisation {
  id: number = 0
  name: string = ""
  gstnumber: string = ""
  secondarytypecode: string = ""
  secondarytype: number = 0
  primarytype: number = 0
  imageid: number = 0
  primarytypecode: string = ""
  version: number = 0
  createdby: number = 0
  createdon: Date = new Date()
  modifiedby: number = 0
  modifiedon: Date = new Date()
  attributes: Organisation.AttributesData = new Organisation.AttributesData()
  attributes_json: string = "{}" // JSON string for backend compatibility
  isactive: boolean = false
  issuspended: boolean = false
  parentid: number = 0
  isfactory: boolean = false
  notes: string = ""
  organisationlogo: number = 0
  organisation_type: OrganisationType = "service"
  booking_amount: number = 5.10
  isserviceamount: boolean = false
}

export namespace Organisation {

  export class AttributesData {
    catalog_offerings?: Array<"services" | "events" | "rooms">;
    appointment_counter?: number;
    appointment_openbefore?: number;
    [key: string]: unknown;
  }

}

export class OrganisationSelectReq {
  id: number = 0;
  gstnumber: string = ''
  organisationid:number=0
  organisationsecondarytype :number=0
  organisationprimarytype :number=0
}

export class OrganisationDeleteReq {
  id: number = 0;
  version: number = 0;
}

export class OrganisationDetail {
  organisationid: number = 0;
  organisationname: string = '';
  organisationgstnumber: string = '';
  organisationsecondarytypecode: string = ''
  organisationsecondarytype: number = 0
  organisationprimarytype: number = 0
  organisationimageid: number = 0
  organisationprimarytypecode: string = ''

  organisationlocationid: number = 0
  organisationlocationname: string = ""
  organisationlocationaddressline1: string = ""
  organisationlocationaddressline2: string = ""
  organisationlocationcity: string = ""
  organisationlocationstate: string = ""
  organisationlocationcountry: string = ""
  organisationlocationlatitude: number = 0
  organisationlocationlongitude: number = 0
  organisationlocationgooglelocation: string = ""
  organisationlocationpincode: string = ""
  organisationlocationcustomurl: string = ""
  /** Stable public booking GUID (`organisationlocation.orgloctempid`). */
  organisationlocationorgloctempid: string = ""
}