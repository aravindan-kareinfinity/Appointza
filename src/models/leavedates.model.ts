export class LeaveDates {
  id: number = 0
organizationlocationid: string = ""
start_time: Date = new Date()
end_time: Date = new Date()
isfullday: boolean = false
leaveon: Date = new Date()
organizationid: number = 0
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: LeaveDates.AttributesData = new LeaveDates.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace LeaveDates {
  
                export class AttributesData
                {
                    
                }  
                
}

export class LeaveDatesSelectReq {
  id: number = 0;
}

export class LeaveDatesDeleteReq {
  id: number = 0;
  version: number = 0;
}