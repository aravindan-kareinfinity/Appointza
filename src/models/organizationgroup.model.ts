export class OrganizationGroup {
  id: number = 0
organisationid: number = 0
groupname: number = 0
type: number = 0
typecode: string = ""
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: OrganizationGroup.AttributesData = new OrganizationGroup.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace OrganizationGroup {
  
                export class AttributesData
                {
                    
                }  
                
}

export class OrganizationGroupSelectReq {
  id: number = 0;
}

export class OrganizationGroupDeleteReq {
  id: number = 0;
  version: number = 0;
}