export class OrganisationServices {
  id: number = 0
prize: number = 0
timetaken: number = 0
servicesids: OrganisationServices.ServicesidsData = new OrganisationServices.ServicesidsData()
Iscombo: boolean = false
offerprize: number = 0
Servicename: string = ""
code: string = ""
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: OrganisationServices.AttributesData = new OrganisationServices.AttributesData()
isactive: boolean = false
issuspended: boolean = false
organisationid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace OrganisationServices {
  
                export class ServicesidsData
                {
                  combolist: comboids[]=[];
                }  
                

                export class AttributesData
                {
                    
                }  
                
}

export class comboids{
  id:number=0;
  servicename:string=""
}

export class OrganisationServicesSelectReq {
  id: number = 0;
  organisationid:number =0
}

export class OrganisationServicesDeleteReq {
  id: number = 0;
  version: number = 0;
}