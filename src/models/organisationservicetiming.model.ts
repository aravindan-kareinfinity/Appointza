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

export class Leavereq {
  organisationlocationid: number = 0;
  organisationid: number = 0;
  appointmentdate: Date = new Date();
  
  // Store as strings in "HH:mm" format
  start_time: string = "";
  end_time: string = "";

  isforce: boolean = false;
  isfullday: boolean = false;
  
  // Helper method to convert time string to Date
  getStartTimeAsDate(): Date | null {
    if (!this.start_time) return null;
    const [hours, minutes] = this.start_time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // Helper method to convert time string to Date
  getEndTimeAsDate(): Date | null {
    if (!this.end_time) return null;
    const [hours, minutes] = this.end_time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // Helper method to set time from Date object
  setStartTimeFromDate(date: Date): void {
    this.start_time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  // Helper method to set time from Date object
  setEndTimeFromDate(date: Date): void {
    this.end_time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
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

