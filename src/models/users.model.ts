

export class Users {
  id: number = 0;
  name: string = '';
  email: string = '';
  mobile: string = '';
  mobilecountrycode: string = '';
  designation: string = '';
  otp: string = '';
  otpexpirationtime: Date = new Date();
  organisationid: number = 0;
  locationid: number = 0;
  version: number = 0;
  createdby: number = 0;
  createdon: Date = new Date();
  modifiedby: number = 0;
  modifiedon: Date = new Date();
  attributes: Users.AttributesData = new Users.AttributesData();
  isactive: boolean = false;
  issuspended: boolean = false;
  parentid: number = 0;
  isfactory: boolean = false;
  notes: string = '';
  profileimage: number = 0;
}

export namespace Users {
  export class AttributesData {
    permission: UsersPermissionData = new UsersPermissionData();
   }
}

export class UsersSelectReq {
  id: number = 0;
  mobile: string = '';
  organisationid: number = 0;
}

export class UsersDeleteReq {
  id: number = 0;
  version: number = 0;
}

export class UsersRegisterReq {
  organisationimageid: number = 0;
  organisationname: string = '';
  organisationgstnumber: string = '';

  secondarytypecode: string = ""
  secondarytype: number = 0
  primarytype: number = 0
  primarytypecode: string = ""
  organisationtype: number = 0;
  latitude: number = 0;
  longitude: number = 0;
  googlelocation: string = '';
  locationname: string = '';
  locationaddressline1: string = '';
  locationaddressline2: string = '';
  locationcity: string = '';
  locationstate: string = '';
  locationcountry: string = '';
  locationpincode: string = '';
  username: string = '';
  useremail: string = '';
  usermobile: string = '';
  usermobilecountrycode: string = '';
  userdesignation: string = '';
}

export class UsersRegisterRes {
  mobile: string = '';
  name: string = '';
}
export class UsersLoginReq {
  mobile: string = '';
  otp: string = '';
  // organisationtype: OrganisationTypes = OrganisationTypes.Supplier;
}

export class UsersContext {
  userid: number = 0;
  usermobile: string = '';
  username: string = '';
  useremail: string = '';
  userpermission: UsersPermissionData = new UsersPermissionData();
  organisationid: number = 0;
  organisationname: string = '';
  // organisationtype: OrganisationTypes = OrganisationTypes.Supplier;
  organisationlocationid: number = 0;
  organisationlocationname: string = '';
  refreshtoken: string = '';
  accesstoken: string = '';
  static value: any;
}

export class UsersPermissionData {
  createstaff: UsersPermissionGroupData = new UsersPermissionGroupData();
  creategroup: UsersPermissionGroupData = new UsersPermissionGroupData();
  approveusersingroup: UsersPermissionGroupData = new UsersPermissionGroupData();
  createmessage: UsersPermissionGroupData = new UsersPermissionGroupData();
  createtask:UsersPermissionGroupData = new UsersPermissionGroupData();
  dashboard:UsersPermissionGroupData = new UsersPermissionGroupData();
  approveappoinment: UsersPermissionGroupData = new UsersPermissionGroupData();
}
export class UsersPermissionGroupData {
  view: boolean = false;
  manage: boolean = false;
}

export class UsersGetOtpReq {
  mobile: string = '';
  // organisationtype: OrganisationTypes = OrganisationTypes.Supplier;
}

export class UsersGetOtpRes {
  mobile: string = '';
  name: string = '';
}

export class UsersMergeDesign {
  designid: number = 0;
  categoryid: number = 0;
  subcategoryid: number = 0;
  productid: number = 0;
  issizeset: boolean = false;
  iscolourset: boolean = false;
  designcode: string = '';
  price: number = 0;
  imagelist: number[] = [];
  attributelist: UsersCreateDesignReqAttributeData[] = [];
  colourlist: UsersCreateDesignReqAttributeData[] = [];
  sizelist: UsersCreateDesignReqAttributeData[] = [];
  skulist: UserSkuData[] = [];
}

export class UserSkuData {
  colourid: number = 0;
  colourname: string = '';
  colourimage: number = 0;
  sizeid: number = 0;
  sizename: string = '';
  price: number = 0;
}

export class UsersCreateDesignReqAttributeData {
  attributeid: number = 0;
  attributename: string = '';
  attributevalueid: number = 0;
  attributevaluename: string = '';
  attributevalueimage: number = 0;
}
export class UsersSupplierInviteScreenReq {
  searchstring: string = '';
}

export class UsersSupplierInviteScreenRes {
  organisationid: number = 0;
  organisationname: string = '';
  // organisationattributes: Organisation.AttributesData =
  // new Organisation.AttributesData();
  isconnected: boolean = false;
}

export class UsersConnectionRequestReq {
  organisationid: number = 0;
}

export class UsersAcceptConnectionRequestReq {
  notificationid: number = 0;
}

export class UsersAddColourSetToCartReq {
  designid: number = 0;
  quantity: number = 0;
}
export class UserUpdateOrderStatusReq {
  orderid: number = 0;

}

export enum REFERENCETYPE {
  ORGANISATIONPRIMARYTYPE  = 1,
ORGANISATIONSECONDARYTYPE  = 2,
APPOINTMENTSTATUS  = 3,
CANCELLATION_REASON
}

export class Organisationdeletereq
{
    organisationid : number =0

    userid : number =0

    otp:string = ""
}