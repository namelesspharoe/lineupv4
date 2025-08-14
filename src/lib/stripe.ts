import { getFunctions, httpsCallable } from 'firebase/functions';
import { products } from '../stripe-config';
import { app } from './firebase';

const functions = getFunctions(app);
const createCheckoutSessionCall = httpsCallable(functions, 'createCheckoutSession');

export async function createCheckoutSession(
  priceId: string,
  mode: 'payment' | 'subscription',
  successUrl: string,
  cancelUrl: string,
  userId: string
) {
  try {
    const result = await createCheckoutSessionCall({
      priceId,
      mode,
      successUrl,
      cancelUrl,
      userId
    });

    const { url } = result.data as { url: string };
    return url;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw new Error(error.message || 'Failed to create checkout session');
  }
}

export function getProductByPriceId(priceId: string) {
  return Object.values(products).find(product => product.priceId === priceId);
}