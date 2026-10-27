import RazorpayCheckout from 'react-native-razorpay';
import type { RazorpayCheckoutSuccess } from './appointzaPaymentApi';

export type RazorpayCheckoutRequest = {
  key: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  description: string;
  prefillEmail?: string;
  prefillName?: string;
  prefillContact?: string;
};

export class CheckoutCancelledError extends Error {
  constructor() {
    super('Payment cancelled');
    this.name = 'CheckoutCancelledError';
  }
}

type NativeCheckoutError = {
  description?: unknown;
  message?: unknown;
};

export async function openRazorpayCheckout(
  request: RazorpayCheckoutRequest
): Promise<RazorpayCheckoutSuccess> {
  try {
    return await RazorpayCheckout.open({
      key: request.key,
      amount: String(request.amountPaise),
      currency: request.currency || 'INR',
      name: 'Napz',
      description: request.description,
      order_id: request.orderId,
      prefill: {
        email: request.prefillEmail || '',
        name: request.prefillName || '',
        contact: request.prefillContact
          ? `+91${request.prefillContact.replace(/\D/g, '')}`
          : '',
      },
      theme: { color: '#1B4D8B' },
    });
  } catch (error) {
    const nativeError = (error ?? {}) as NativeCheckoutError;
    const description = String(nativeError.description ?? nativeError.message ?? error ?? '');
    if (/cancel/i.test(description)) {
      throw new CheckoutCancelledError();
    }
    throw new Error(description || 'Razorpay checkout failed. Please try again.');
  }
}
