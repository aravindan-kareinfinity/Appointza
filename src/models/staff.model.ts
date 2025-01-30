export class Staff {
  id: number = 0
userid: number = 0
organizationid: string = ""
roles: Staff.RolesData = new Staff.RolesData()
image: number = 0
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: Staff.AttributesData = new Staff.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace Staff {
  
                export class RolesData
                {
                    
                }  
                

                export class AttributesData
                {
                    
                }  
                
}

export class StaffSelectReq {
  id: number = 0;
}

export class StaffDeleteReq {
  id: number = 0;
  version: number = 0;
}