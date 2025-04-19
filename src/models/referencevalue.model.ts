export class ReferenceValue {
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
attributes: ReferenceValue.AttributesData = new ReferenceValue.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace ReferenceValue {
  
                export class AttributesData
                {
                    
                }  
                
}

export class ReferenceValueSelectReq {
  id: number = 0;
  parentid:Number =0;
  referencetypeid: number = 0;
}

export class ReferenceValueDeleteReq {
  id: number = 0;
  version: number = 0;
}