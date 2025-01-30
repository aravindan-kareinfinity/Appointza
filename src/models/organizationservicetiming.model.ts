export class OrganizationServiceTiming {
  id: number = 0
supplierorganisationid: number = 0
retailerorganisationid: number = 0
notificationid: number = 0
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: OrganizationServiceTiming.AttributesData = new OrganizationServiceTiming.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace OrganizationServiceTiming {
  
                export class AttributesData
                {
                    
                }  
                
}

export class OrganizationServiceTimingSelectReq {
  id: number = 0;
}

export class OrganizationServiceTimingDeleteReq {
  id: number = 0;
  version: number = 0;
}