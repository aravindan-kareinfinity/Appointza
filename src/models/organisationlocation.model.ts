export class OrganisationLocation {
  id: number = 0
organisationid: number = 0
name: string = ""
addressline1: string = ""
addressline2: string = ""
city: string = ""
state: string = ""
district:string=""
country: string = ""
latitude: number = 0
longitude: number = 0
googlelocation: string = ""
pincode: string = ""
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: OrganisationLocation.AttributesData = new OrganisationLocation.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace OrganisationLocation {
  
                export class AttributesData
                {
                    
                }  
                
}

export class OrganisationLocationSelectReq {
  id: number = 0;
  organisationid: number = 0
}

export class OrganisationLocationDeleteReq {
  id: number = 0;
  version: number = 0;
}

export class OrganisationLocationStaffReq {
  userid: number=0;
}

export class OrganisationLocationStaffRes {
  organisationid: number=0;
  name: string='';
  organisationlocationid: number=0;
}
