export class Payment {
  id: number = 0
organisationlocationid: number = 0
organisationid: number = 0
staffid: number = 0
paymentmodecode: string = ""
paymentmodetype: string = ""
paymentmodtypeid: number = 0
appoinmentid: number = 0
customerid: number = 0
customername: string = ""
transactionid: number = 0
amount: number = 0
version: number = 0
createdby: number = 0
createdon: Date = new Date()
modifiedby: number = 0
modifiedon: Date = new Date()
attributes: Payment.AttributesData = new Payment.AttributesData()
isactive: boolean = false
issuspended: boolean = false
parentid: number = 0
isfactory: boolean = false
notes: string = ""
}

export namespace Payment {
  
                export class AttributesData
                {
                    
                }  
                
}

export class PaymentSelectReq {
  id: number = 0;
}

export class PaymentDeleteReq {
  id: number = 0;
  version: number = 0;
}