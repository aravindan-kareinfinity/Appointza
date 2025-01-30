export class ReferenceType {
  id: number = 0
identifier: string = ""
displaytext: string = ""
langcode: string = ""
organizationid: number = 0
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: ReferenceType.AttributesData = new ReferenceType.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace ReferenceType {
  
                export class AttributesData
                {
                    
                }  
                
}

export class ReferenceTypeSelectReq {
  id: number = 0;
}

export class ReferenceTypeDeleteReq {
  id: number = 0;
  version: number = 0;
}