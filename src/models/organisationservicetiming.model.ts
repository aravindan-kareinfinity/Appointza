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
organisationlocationid: number = 0
isfactory: boolean = false
notes: string = ""
}


export class OrganisationServiceTimingFinal {
  id: number = 0
  localid:number=0
organisationid: number = 0
day_of_week: number = 0
start_time: string = ""
end_time: string = ""
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: OrganisationServiceTiming.AttributesData = new OrganisationServiceTiming.AttributesData()
isactive: boolean = false
issuspended: boolean = false
organisationlocationid: number = 0
isfactory: boolean = false
notes: string = ""
counter:number=0
openbefore:number=0
}
export namespace OrganisationServiceTiming {
  
                export class AttributesData
                {
                    
                }  
                
}

export class OrganisationServiceTimingSelectReq {
  id: number = 0;
  organisationid:number =0;
  organisationlocationid:number = 0;
  day_of_week:number =0;
  appointmentdate:Date =new Date();
}

export class OrganisationServiceTimingDeleteReq {
  id: number = 0;
  version: number = 0;
  organisationid:number =0;
  organizationlocationid:number = 0;
}

export enum Weeks {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7
}

