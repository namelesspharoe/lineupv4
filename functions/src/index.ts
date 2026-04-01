/**
 * Minimal Cloud Functions entry (lesson booking is client-side + Firestore).
 * Add new callables here when needed; Stripe checkout was removed.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/** Optional deploy smoke test — callable with no side effects. */
export const healthCheck = functions.https.onCall(async () => {
  return { ok: true as const, ts: Date.now() };
});
