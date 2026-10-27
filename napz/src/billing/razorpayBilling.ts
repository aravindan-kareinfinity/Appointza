import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { USER_PROFILE_KEY } from '../constants/authStorage';
import { napzFunctions } from '../services/firebase/functionsClient';
import { fetchEntitlementFromFirestore } from '../services/firebase/entitlementService';
import { isPremium } from '../entitlement/PremiumGate';
import type { NapzEntitlement } from '../entitlement/entitlementTypes';
import {
  CheckoutCancelledError,
  openRazorpayCheckout,
} from './RazorpayNativeCheckout';
import { RAZORPAY_PACKAGES, type RazorpayPackageId } from './razorpayPackages';

export { CheckoutCancelledError };

let lastOrderId: string | null = null;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function tenDigitMobile(mobile: string): string | undefined {
  const digits = digitsOnly(mobile);
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return undefined;
}

async function loadCheckoutPrefill(): Promise<{
  name?: string;
  email?: string;
  contact: string;
}> {
  const user = auth().currentUser;
  let mobile = '';
  let name = user?.displayName ?? '';
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { mobile?: string; name?: string };
      mobile = String(parsed.mobile ?? '');
      if (!name) name = String(parsed.name ?? '');
    }
  } catch {
    /* keep empty */
  }
  const contact = tenDigitMobile(mobile);
  if (!contact) {
    throw new Error('Save a 10-digit mobile number on Account, then try payment again.');
  }
  return {
    name: name.trim() || undefined,
    email: user?.email ?? undefined,
    contact,
  };
}

function entitlementAdvanced(before: NapzEntitlement, next: NapzEntitlement): boolean {
  if (!isPremium(next)) return false;
  if (next.isLifetime && !before.isLifetime) return true;
  if (next.expiresAt && next.expiresAt !== before.expiresAt) return true;
  if (next.productId && next.productId !== before.productId) return true;
  return isPremium(next) && !isPremium(before);
}

export function describeBillingError(error: unknown): string {
  if (error instanceof CheckoutCancelledError) return '';
  const code = String((error as { code?: string })?.code ?? '');
  const message = String((error as Error)?.message ?? error);
  if (code.includes('unauthenticated') || /auth/i.test(message)) {
    return 'Sign in first, then try Premium checkout again.';
  }
  if (code.includes('not-found') || /NOT.?FOUND/i.test(message)) {
    return 'Napz billing is not on the server yet. Deploy Cloud Functions (createRazorpayOrder) in asia-south1, then try again.';
  }
  if (/Organization .* not found/i.test(message)) {
    return 'Appointza booking org is not set up for Napz. Use Napz Razorpay checkout (Cloud Functions), not /api/Payment/CreateOrder with organizationid 1.';
  }
  return message.replace(/^\[.*?\]\s*/, '') || 'Could not start Razorpay checkout.';
}

export async function confirmLatestRazorpayOrder(): Promise<NapzEntitlement> {
  const confirmOrder = napzFunctions().httpsCallable('confirmRazorpayOrder');
  const result = await confirmOrder(lastOrderId ? { orderId: lastOrderId } : {});
  const data = result.data as { entitlement?: NapzEntitlement };
  if (data.entitlement) return data.entitlement;
  return fetchEntitlementFromFirestore();
}

export async function startRazorpayCheckout(
  packageId: RazorpayPackageId
): Promise<NapzEntitlement> {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    throw new Error('Sign in first, then try Premium checkout again.');
  }

  const before = await fetchEntitlementFromFirestore();
  const selected = RAZORPAY_PACKAGES[packageId];
  const prefill = await loadCheckoutPrefill();
  const createOrder = napzFunctions().httpsCallable('createRazorpayOrder');
  const result = await createOrder({ packageId, contact: prefill.contact });
  const data = result.data as {
    orderId?: string;
    keyId?: string;
    amount?: number;
    currency?: string;
  };
  const orderId = String(data.orderId ?? '');
  const keyId = String(data.keyId ?? '');
  const amountPaise = Number(data.amount ?? selected.amountPaise);
  if (!orderId.startsWith('order_') || !keyId) {
    throw new Error('Could not create a Razorpay order.');
  }
  lastOrderId = orderId;

  await openRazorpayCheckout({
    key: keyId,
    orderId,
    amountPaise,
    currency: String(data.currency ?? 'INR'),
    description: selected.name,
    prefillEmail: prefill.email,
    prefillName: prefill.name,
    prefillContact: prefill.contact,
  });

  const granted = await confirmLatestRazorpayOrder();
  if (entitlementAdvanced(before, granted) || isPremium(granted)) {
    return granted;
  }
  return fetchEntitlementFromFirestore();
}
