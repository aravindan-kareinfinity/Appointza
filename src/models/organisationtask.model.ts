export class OrganisationTask {
  id: number = 0
name: string = ""
organizationid: number = 0
appoinmentid: number = 0
description: string = ""
userid: number = 0
descriptionimage: OrganisationTask.DescriptionimageData = new OrganisationTask.DescriptionimageData()
code: string = ""
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: OrganisationTask.AttributesData = new OrganisationTask.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace OrganisationTask {
  
                export class DescriptionimageData
                {
                    
                }  
                

                export class AttributesData
                {
                    
                }  
                
}

export class OrganisationTaskSelectReq {
  id: number = 0;
}

export class OrganisationTaskDeleteReq {
  id: number = 0;
  version: number = 0;
}