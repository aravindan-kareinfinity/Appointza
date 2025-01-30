export class Notification {
  id: number = 0
userid: number = 0
type: number = 0
typecode: string = ""
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: Notification.AttributesData = new Notification.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace Notification {
  
                export class AttributesData
                {
                  connectionrequestdata = new NotificationConnectionRequestData();
                }  
                
}

export class NotificationSelectReq {
  id: number = 0;
}

export class NotificationDeleteReq {
  id: number = 0;
  version: number = 0;
}

export class NotificationConnectionRequestData {
  organisationid: number = 0;
  organisationname: string = '';
  organisationimageid: number = 0;
  userid: number = 0;
  username: string = '';
  usermobile: string = '';
  isaccepted: boolean = false;
}

export class NotificationConnectionRequestAcceptedData {
  organisationid: number = 0;
  organisationname: string = '';
  organisationimageid: number = 0;
  userid: number = 0;
  username: string = '';
  usermobile: string = '';
}

export enum NotificationTypes {
  ConnectionRequest = 1,
  ConnectionRequestAccepted = 2,
}

export class NotificationNotificationScreenReq {

}