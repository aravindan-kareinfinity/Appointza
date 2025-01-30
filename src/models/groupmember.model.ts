export class GroupMember {
  id: number = 0
organizationgroupid: number = 0
userid: number = 0
usertype: number = 0
usertypecode: string = ""
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: GroupMember.AttributesData = new GroupMember.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace GroupMember {
  
                export class AttributesData
                {
                    
                }  
                
}

export class GroupMemberSelectReq {
  id: number = 0;
}

export class GroupMemberDeleteReq {
  id: number = 0;
  version: number = 0;
}