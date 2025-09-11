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
  UserId: number = 0;
  OrganisationId: number = 0;
  OrganisationLocationId: number = 0;
  AppointmentId: number = 0;
  Amount: number = 0;
  CustomerName: string = "";
  CustomerEmail: string = "";
  CustomerContact: string = "";
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

// Enhanced Payment Models for new payment system
export class PaymentTransaction {
  Id: number = 0;
  OrderId: string = "";
  PaymentId: string = "";
  UserId: number = 0;
  Amount: number = 0;
  Currency: string = "INR";
  Status: PaymentStatus = PaymentStatus.CREATED;
  Method: string = "";
  OrganisationId: number = 0;
  OrganisationLocationId: number = 0;
  AppointmentId: number = 0;
  CustomerName: string = "";
  CustomerEmail: string = "";
  CustomerContact: string = "";
  Notes: string = "";
  RazorpayResponse: string = "";
  CreatedAt: Date = new Date();
  UpdatedAt: Date = new Date();
}

export enum PaymentStatus {
  CREATED = "CREATED",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  PENDING = "PENDING",
  REFUNDED = "REFUNDED",
  CANCELLED = "CANCELLED",
  AUTHORIZED = "AUTHORIZED"
}

export class PaymentLog {
  Id: number = 0;
  TransactionId: number = 0;
  Event: string = "";
  Status: string = "";
  RawPayload: string = "";
  ErrorMessage: string = "";
  WebhookSource: string = "";
  LoggedAt: Date = new Date();
}

export class PaymentEvents {
  static readonly PAYMENT_AUTHORIZED = "PAYMENT_AUTHORIZED";
  static readonly PAYMENT_CAPTURED = "PAYMENT_CAPTURED";
  static readonly PAYMENT_FAILED = "PAYMENT_FAILED";
  static readonly ORDER_PAID = "ORDER_PAID";
  static readonly REFUND_INITIATED = "REFUND_INITIATED";
  static readonly REFUND_PROCESSED = "REFUND_PROCESSED";
  static readonly ORDER_CREATED = "ORDER_CREATED";
  static readonly WEBHOOK_RECEIVED = "WEBHOOK_RECEIVED";
  static readonly PAYMENT_VERIFIED = "PAYMENT_VERIFIED";
  static readonly PAYMENT_CANCELLED = "PAYMENT_CANCELLED";
}