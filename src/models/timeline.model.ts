export class Timeline {
  id: number = 0
organisationlocationid: number = 0
organisationid: number = 0
appoinmentid: number = 0
tasktypeid: number = 0
taskcode: string = ""
tasktype: string = ""
description: string = ""
customerid: number = 0
staffid: number = 0
staffname: string = ""
appoinmenstatustype: string = ""
appoinmentstatusid: number = 0
apoinmentstatuscode: string = ""
descriptionimageid: number = 0
paymentid: number = 0
paymentmodetypeid: number = 0
paymentmodetype: string = ""
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: Timeline.AttributesData = new Timeline.AttributesData()
isactive: boolean = false
issuspended: boolean = false
notes: string = ""
}

export namespace Timeline {
  
                export class AttributesData
                {
                    
                }  
                
}

export class TimelineSelectReq {
  id: number = 0;
  appointmentid: number = 0;
}

export class TimelineDeleteReq {
  id: number = 0;
  version: number = 0;
}