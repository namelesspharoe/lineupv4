import { getFunctions, httpsCallable } from 'firebase/functions';
import { products } from '../stripe-config';
import app from './firebase';
import type { LessonBookingDraft } from '../types/cart';

const functions = getFunctions(app);
const createCheckoutSessionCall = httpsCallable(functions, 'createCheckoutSession');
const prepareLessonCheckoutCall = httpsCallable(functions, 'prepareLessonCheckout');

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
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    throw new Error(message);
  }
}

export async function prepareLessonCheckout(
  items: LessonBookingDraft[],
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    const result = await prepareLessonCheckoutCall({
      items: items.map((d) => ({
        title: d.title,
        instructorId: d.instructorId,
        date: d.date,
        sport: d.sport,
        sessionType: d.sessionType,
        startTime: d.startTime,
        endTime: d.endTime,
        type: d.type,
        maxStudents: d.maxStudents,
        skillLevel: d.skillLevel,
        skillsFocus: d.skillsFocus,
        notes: d.notes,
        description: d.description
      })),
      successUrl,
      cancelUrl
    });

    const { url } = result.data as { url: string };
    if (!url) {
      throw new Error('No checkout URL returned');
    }
    return url;
  } catch (error: unknown) {
    console.error('Error preparing lesson checkout:', error);
    const message = error instanceof Error ? error.message : 'Failed to start checkout';
    throw new Error(message);
  }
}

export function getProductByPriceId(priceId: string) {
  return Object.values(products).find(product => product.priceId === priceId);
}