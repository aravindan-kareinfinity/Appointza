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
  isactive: boolean = false
  issuspended: boolean = false
  parentid: number = 0
  isfactory: boolean = false
  notes: string = ""
}

export namespace Organisation {

  export class AttributesData {

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

}