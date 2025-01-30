export class Message {
  id: number = 0
message: string = ""
imageids: Message.ImageidsData = new Message.ImageidsData()
description: string = ""
organizationgroupid: number = 0
type: number = 0
typecode: string = ""
status: number = 0
statuscode: string = ""
organisationid: number = 0
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: Message.AttributesData = new Message.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace Message {
  
                export class ImageidsData
                {
                    
                }  
                

                export class AttributesData
                {
                    
                }  
                
}

export class MessageSelectReq {
  id: number = 0;
}

export class MessageDeleteReq {
  id: number = 0;
  version: number = 0;
}