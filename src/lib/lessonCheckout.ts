import { auth } from './firebase';
import { bookStudentLessonsFromDrafts } from '../services/studentBooking';
import type { LessonBookingDraft } from '../types/cart';

/**
 * Books cart drafts in Firestore and returns the success redirect URL (no Stripe / no Cloud Functions).
 */
export async function prepareLessonCheckout(
  items: LessonBookingDraft[],
  successUrl: string,
  _cancelUrl: string
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Must be logged in');
  }

  await bookStudentLessonsFromDrafts(user.uid, items);

  const base = successUrl.replace('{CHECKOUT_SESSION_ID}', 'local');
  const join = base.includes('?') ? '&' : '?';
  return `${base}${join}test=1`;
}
