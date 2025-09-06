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
transactionid: string = ""
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
                    razorpay_order_id?: string = ""
                    razorpay_payment_id?: string = ""
                    payment_status?: string = ""
                    payment_method?: string = ""
                    captured_at?: string = ""
                    amount_paid?: number = 0
                    refund_id?: string = ""
                    refund_amount?: number = 0
                    refund_reason?: string = ""
                    refunded_at?: string = ""
                }  
                
}

export class PaymentSelectReq {
  id: number = 0;
}

export class PaymentDeleteReq {
  id: number = 0;
  version: number = 0;
}

// Razorpay Integration Models
export class CreateOrderRequest {
  OrganisationLocationId: number = 0;
  OrganisationId: number = 0;
  StaffId: number = 0;
  AppointmentId: number = 0;
  CustomerId: number = 0;
  CustomerName: string = "";
  CustomerEmail: string = "";
  CustomerContact: string = "";
  Amount: number = 0;
  Notes: string = "";
}

export class CreateOrderResponse {
  success: boolean = false;
  payment_id: number = 0;
  order_id: string = "";
  amount: number = 0;
  currency: string = "";
  checkout_url: string = "";
  message: string = "";
}

export class ProcessPaymentRequest {
  RazorpayOrderId: string = "";
  RazorpayPaymentId: string = "";
  RazorpaySignature: string = "";
}

export class PaymentStatusResponse {
  payment_id: number = 0;
  amount: number = 0;
  payment_mode: string = "";
  payment_type: string = "";
  transaction_id: string = "";
  status: string = "";
  created_on: string = "";
  attributes: any = {};
}

export class RefundRequest {
  PaymentId: number = 0;
  RefundAmount: number = 0;
  Reason: string = "";
}