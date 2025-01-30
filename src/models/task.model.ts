export class Task {
  id: number = 0
name: string = ""
organizationid: number = 0
appoinmentdate: Date = new Date()
description: string = ""
userid: number = 0
descriptionimage: Task.DescriptionimageData = new Task.DescriptionimageData()
code: string = ""
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: Task.AttributesData = new Task.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace Task {
  
                export class DescriptionimageData
                {
                    
                }  
                

                export class AttributesData
                {
                    
                }  
                
}

export class TaskSelectReq {
  id: number = 0;
}

export class TaskDeleteReq {
  id: number = 0;
  version: number = 0;
}