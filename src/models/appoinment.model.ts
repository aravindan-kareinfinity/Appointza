export class Appoinment {
  id: number = 0
userid: number = 0
organizationid: number = 0
fromtime: Date = new Date()
totime: Date = new Date()
appoinmentdate: Date = new Date()
status: number = 0
statuscode: string = ""
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: Appoinment.AttributesData = new Appoinment.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace Appoinment {
  
                export class AttributesData
                {

                   servicelist: SelectedSerivice[]=[];
                    
                }  
                
}


export class SelectedSerivice{
  id:number=0;
  servicename:string=""
  serviceprice:number=0
  servicetimetaken:number =0
  iscombo:boolean=false
}
export class AppoinmentSelectReq {
  id: number = 0;
  organizationid: number = 0
  parentid: number = 0
}

export class AppoinmentDeleteReq {
  id: number = 0;
  version: number = 0;
}