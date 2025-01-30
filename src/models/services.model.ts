export class Services {
  id: number = 0
prize: number = 0
timetaken: number = 0
servicesids: Services.ServicesidsData = new Services.ServicesidsData()
Iscombo: boolean = false
offerprize: number = 0
Servicename: string = ""
code: string = ""
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: Services.AttributesData = new Services.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace Services {
  
                export class ServicesidsData
                {
                    
                }  
                

                export class AttributesData
                {
                    
                }  
                
}

export class ServicesSelectReq {
  id: number = 0;
}

export class ServicesDeleteReq {
  id: number = 0;
  version: number = 0;
}