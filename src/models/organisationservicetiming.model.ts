export class OrganisationServiceTiming {
  id: number = 0
  localid:number=0
organisationid: number = 0
day_of_week: number = 0
start_time: Date = new Date()
end_time: Date = new Date()
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: OrganisationServiceTiming.AttributesData = new OrganisationServiceTiming.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace OrganisationServiceTiming {
  
                export class AttributesData
                {
                    
                }  
                
}

export class OrganisationServiceTimingSelectReq {
  id: number = 0;
}

export class OrganisationServiceTimingDeleteReq {
  id: number = 0;
  version: number = 0;
}

export enum Weeks {
  Monday = 0,
  Tuesday = 1,
  Wednesday = 2,
  Thursday = 3,
  Friday = 4,
  Saturday = 5,
  Sunday = 6
}
