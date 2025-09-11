import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Payment,
  PaymentDeleteReq,
  PaymentSelectReq,
  CreateOrderRequest,
  CreateOrderResponse,
  ProcessPaymentRequest,
  PaymentStatusResponse,
  RefundRequest,
} from '../models/payment.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';
import RazorpayCheckout from 'react-native-razorpay';

export class PaymentService {
    baseurl: string;
    http: AxiosHelperUtils;
    razorpayKeyId: string;
    
    constructor() {
        this.baseurl = environment.baseurl + '/api/Payment';
        this.http = new AxiosHelperUtils();
        // You should get this from your environment or config
        this.razorpayKeyId = 'rzp_live_RCRKKPVDZ3tLDv'; // Replace with your actual Razorpay key
    }
    async select(req: PaymentSelectReq) {
        let postdata: ActionReq<PaymentSelectReq> =
            new ActionReq<PaymentSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Payment>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }
    async save(req: Payment) {
        let postdata: ActionReq<Payment> = new ActionReq<Payment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Payment>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: Payment) {
        let postdata: ActionReq<Payment> = new ActionReq<Payment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Payment>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: Payment) {
        let postdata: ActionReq<Payment> = new ActionReq<Payment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Payment>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: PaymentDeleteReq) {
        let postdata: ActionReq<PaymentDeleteReq> = new ActionReq<PaymentDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }

    // Razorpay Integration Methods
    async createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
        try {
            // Validate request
            if (!req.Amount || req.Amount <= 0) {
                throw new Error('Invalid amount');
            }
            if (!req.CustomerContact) {
                throw new Error('Customer contact is required');
            }
            if (!req.OrganisationId || !req.OrganisationLocationId) {
                throw new Error('Organisation and location are required');
            }
            if (!req.UserId) {
                throw new Error('User ID is required');
            }

            const response = await this.http.post<CreateOrderResponse>(
                this.baseurl + '/create-order',
                req
            );
            return response;
        } catch (error) {
            throw new Error(`Failed to create payment order: ${error}`);
        }
    }

    async processPayment(req: ProcessPaymentRequest): Promise<{ success: boolean; message: string }> {
        try {
            // Validate request
            if (!req.RazorpayOrderId || !req.RazorpayPaymentId || !req.RazorpaySignature) {
                throw new Error('Missing required payment parameters');
            }

            const response = await this.http.post<{ success: boolean; message: string }>(
                this.baseurl + '/process-payment',
                req
            );
            return response;
        } catch (error) {
            throw new Error(`Failed to process payment: ${error}`);
        }
    }

    async getPaymentStatus(paymentId: number): Promise<PaymentStatusResponse> {
        try {
            const response = await this.http.get<PaymentStatusResponse>(
                this.baseurl + `/payment-status/${paymentId}`
            );
            return response;
        } catch (error) {
            throw new Error(`Failed to get payment status: ${error}`);
        }
    }

    async processRefund(req: RefundRequest): Promise<{ success: boolean; refund_id: string; amount: number; status: string }> {
        try {
            const response = await this.http.post<{ success: boolean; refund_id: string; amount: number; status: string }>(
                this.baseurl + '/refund',
                req
            );
            return response;
        } catch (error) {
            throw new Error(`Failed to process refund: ${error}`);
        }
    }

    async initiateRazorpayPayment(orderData: CreateOrderResponse, customerDetails: {
        name: string;
        email: string;
        contact: string;
    }): Promise<{ success: boolean; paymentId?: string; error?: string }> {
        try {
            const options = {
                description: 'Appointment Payment',
                image: 'https://i.imgur.com/3g7nmJC.png',
                currency: orderData.currency,
                key: this.razorpayKeyId,
                amount: orderData.amount,
                order_id: orderData.order_id,
                name: 'Appointza',
                prefill: {
                    email: customerDetails.email,
                    contact: customerDetails.contact,
                    name: customerDetails.name,
                },
                theme: { color: '#3399cc' },
            };

            const data = await RazorpayCheckout.open(options);
            
            // Process the payment with the server
            const processReq = new ProcessPaymentRequest();
            processReq.RazorpayOrderId = orderData.order_id;
            processReq.RazorpayPaymentId = data.razorpay_payment_id;
            processReq.RazorpaySignature = data.razorpay_signature;

            const processResult = await this.processPayment(processReq);
            
            return {
                success: processResult.success,
                paymentId: data.razorpay_payment_id,
            };
        } catch (error: any) {
            console.error('Razorpay payment error:', error);
            return {
                success: false,
                error: error.description || error.message || 'Payment failed',
            };
        }
    }
}
