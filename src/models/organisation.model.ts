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
  
                export class AttributesData
                {
                    
                }  
                
}

export class OrganisationSelectReq {
  id: number = 0;
}

export class OrganisationDeleteReq {
  id: number = 0;
  version: number = 0;
}