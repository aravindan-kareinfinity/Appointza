export class Staff {
  id: number = 0
userid: number = 0
organizationid: string = ""
roles: UsersPermissionData = new UsersPermissionData();
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

export class UsersPermissionData {
  createstaff: UsersPermissionGroupData = new UsersPermissionGroupData();
  creategroup: UsersPermissionGroupData = new UsersPermissionGroupData();
  approveusersingroup: UsersPermissionGroupData = new UsersPermissionGroupData();
  createmessage: UsersPermissionGroupData = new UsersPermissionGroupData();
  createtask:UsersPermissionGroupData = new UsersPermissionGroupData();
  dashboard:UsersPermissionGroupData = new UsersPermissionGroupData();
  approveappoinment: UsersPermissionGroupData = new UsersPermissionGroupData();
}
export class UsersPermissionGroupData {
  view: boolean = false;
  manage: boolean = false;
}

export class StaffSelectReq {
  id: number = 0;
}

export class StaffDeleteReq {
  id: number = 0;
  version: number = 0;
}