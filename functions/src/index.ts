import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import {
  lessonHours,
  resolveHourlyRateFromMountain,
  getSessionType,
  type LessonType
} from './pricing';

admin.initializeApp();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const db = admin.firestore();

interface CheckoutSessionData {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
}

/** Client sends lesson booking drafts (same shape as Cart / UnifiedLessonModal). */
interface LessonBookingDraftInput {
  title: string;
  instructorId: string;
  date: string;
  sport?: string;
  sessionType?: string;
  startTime: string;
  endTime: string;
  type: LessonType;
  maxStudents: number;
  skillLevel: string;
  skillsFocus?: string[];
  notes?: string;
  description: string;
}

interface PrepareLessonCheckoutData {
  items: LessonBookingDraftInput[];
  successUrl: string;
  cancelUrl: string;
}

function timeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const newStart = new Date(`2000-01-01T${aStart}`);
  const newEnd = new Date(`2000-01-01T${aEnd}`);
  const lessonStart = new Date(`2000-01-01T${bStart}`);
  const lessonEnd = new Date(`2000-01-01T${bEnd}`);
  return (
    (newStart >= lessonStart && newStart < lessonEnd) ||
    (newEnd > lessonStart && newEnd <= lessonEnd) ||
    (newStart <= lessonStart && newEnd >= lessonEnd)
  );
}

async function instructorHasConflict(
  instructorId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const snap = await db
    .collection('lessons')
    .where('instructorId', '==', instructorId)
    .where('date', '==', date)
    .where('status', 'in', ['available', 'scheduled', 'in_progress', 'booked'])
    .get();

  for (const doc of snap.docs) {
    const lesson = doc.data() as { startTime?: string; endTime?: string };
    if (!lesson.startTime || !lesson.endTime) continue;
    if (timeRangesOverlap(startTime, endTime, lesson.startTime, lesson.endTime)) {
      return true;
    }
  }
  return false;
}

export const createCheckoutSession = functions.https.onCall(
  async (data: CheckoutSessionData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { priceId, mode, successUrl, cancelUrl } = data;

    if (!priceId || !mode || !successUrl || !cancelUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
      const customerSnapshot = await db
        .collection('stripe_customers')
        .where('userId', '==', context.auth.uid)
        .limit(1)
        .get();

      let customerId: string;

      if (customerSnapshot.empty) {
        const customer = await stripe.customers.create({
          email: context.auth.token.email,
          metadata: {
            userId: context.auth.uid
          }
        });

        await db.collection('stripe_customers').add({
          userId: context.auth.uid,
          customerId: customer.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        customerId = customer.id;
      } else {
        customerId = customerSnapshot.docs[0].data().customerId;
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: context.auth.uid
        }
      });

      return { url: session.url };
    } catch (error: unknown) {
      console.error('Error creating checkout session:', error);

      if (
        error &&
        typeof error === 'object' &&
        'type' in error &&
        (error as { type: string }).type === 'StripeCardError' &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
      ) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          (error as { message: string }).message
        );
      }

      throw new functions.https.HttpsError('internal', 'An unexpected error occurred');
    }
  }
);

export const prepareLessonCheckout = functions.https.onCall(
  async (data: PrepareLessonCheckoutData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const uid = context.auth.uid;
    const userSnap = await db.collection('users').doc(uid).get();
    const userData = userSnap.data() as { role?: string } | undefined;
    if (!userData || userData.role !== 'student') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only students can purchase lesson bookings'
      );
    }

    const { items, successUrl, cancelUrl } = data;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Cart is empty');
    }
    if (items.length > 25) {
      throw new functions.https.HttpsError('invalid-argument', 'Too many items');
    }
    if (!successUrl || !cancelUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing redirect URLs');
    }

    const mountainsSnap = await db.collection('mountains').get();
    const mountains = mountainsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as Array<{
      id: string;
      name: string;
      privateLessonPrice?: number;
      groupLessonPrice?: number;
    }>;

    const resolved: Array<{
      lessonPayload: Record<string, unknown>;
      amountCents: number;
      productName: string;
    }> = [];

    for (const draft of items) {
      if (
        !draft.title ||
        !draft.instructorId ||
        !draft.date ||
        !draft.startTime ||
        !draft.endTime
      ) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid lesson line');
      }

      const instSnap = await db.collection('users').doc(draft.instructorId).get();
      if (!instSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Instructor not found');
      }
      const instructor = instSnap.data() as {
        mountainId?: string;
        homeMountain?: string;
        name?: string;
      };

      const hourly = resolveHourlyRateFromMountain(instructor, mountains, draft.type);
      if (hourly == null || hourly <= 0) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Could not resolve price for a lesson. Check resort pricing.'
        );
      }

      const hours = lessonHours(draft.startTime, draft.endTime);
      if (hours <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid time range');
      }

      const totalUsd = hourly * hours;
      const amountCents = Math.round(totalUsd * 100);
      if (amountCents < 50) {
        throw new functions.https.HttpsError('invalid-argument', 'Amount too small');
      }

      const sessionType = getSessionType(draft.startTime, draft.endTime);

      const lessonPayload: Record<string, unknown> = {
        title: draft.title,
        instructorId: draft.instructorId,
        date: draft.date,
        sport: draft.sport ?? 'skiing',
        sessionType,
        startTime: draft.startTime,
        endTime: draft.endTime,
        status: 'scheduled',
        type: draft.type,
        maxStudents: draft.maxStudents,
        skillLevel: draft.skillLevel,
        price: hourly,
        description: draft.description,
        skillsFocus: draft.skillsFocus ?? [],
        notes: draft.notes ?? ''
      };

      const instructorName = instructor.name ?? 'Instructor';
      const productName = `${draft.title} — ${instructorName} — ${draft.date}`;

      resolved.push({ lessonPayload, amountCents, productName });
    }

    const customerSnapshot = await db
      .collection('stripe_customers')
      .where('userId', '==', uid)
      .limit(1)
      .get();

    let customerId: string;
    if (customerSnapshot.empty) {
      const customer = await stripe.customers.create({
        email: context.auth.token.email,
        metadata: { userId: uid }
      });
      await db.collection('stripe_customers').add({
        userId: uid,
        customerId: customer.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      customerId = customer.id;
    } else {
      customerId = customerSnapshot.docs[0].data().customerId;
    }

    const pendingRef = db.collection('pending_lesson_checkouts').doc();

    await pendingRef.set({
      userId: uid,
      status: 'pending',
      items: resolved,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const lineItems = resolved.map((r) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: r.productName.slice(0, 120)
        },
        unit_amount: r.amountCents
      },
      quantity: 1
    }));

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: uid,
        pendingCheckoutId: pendingRef.id
      }
    });

    await pendingRef.update({
      stripeSessionId: session.id
    });

    return { url: session.url, pendingCheckoutId: pendingRef.id };
  }
);

export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    res.status(400).send('Missing signature');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    res.status(400).send(`Webhook Error: ${errorMessage}`);
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const pendingCheckoutId = session.metadata?.pendingCheckoutId;

        if (pendingCheckoutId && session.metadata?.userId) {
          const pendingRef = db.collection('pending_lesson_checkouts').doc(pendingCheckoutId);
          const pendingSnap = await pendingRef.get();

          if (!pendingSnap.exists) {
            console.error('Pending checkout missing:', pendingCheckoutId);
            break;
          }

          const pending = pendingSnap.data() as {
            userId: string;
            status: string;
            items: Array<{ lessonPayload: Record<string, unknown>; amountCents: number }>;
          };

          if (pending.status === 'completed') {
            break;
          }

          if (pending.userId !== session.metadata.userId) {
            console.error('User mismatch on pending checkout');
            await pendingRef.update({
              status: 'failed',
              error: 'user_mismatch',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            break;
          }

          if (session.payment_status !== 'paid') {
            await pendingRef.update({
              status: 'pending_payment',
              paymentStatus: session.payment_status,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            break;
          }

          const studentId = pending.userId;

          for (const row of pending.items) {
            const p = row.lessonPayload;
            const instructorId = p.instructorId as string;
            const date = p.date as string;
            const startTime = p.startTime as string;
            const endTime = p.endTime as string;
            const conflict = await instructorHasConflict(instructorId, date, startTime, endTime);
            if (conflict) {
              await pendingRef.update({
                status: 'failed_conflict',
                stripeSessionId: session.id,
                error: 'time_slot_taken',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              res.json({ received: true });
              return;
            }
          }

          const batch = db.batch();
          const now = admin.firestore.FieldValue.serverTimestamp();

          for (const row of pending.items) {
            const lp = {
              ...row.lessonPayload,
              studentIds: [studentId],
              createdAt: now,
              updatedAt: now
            };
            const lessonRef = db.collection('lessons').doc();
            batch.set(lessonRef, lp);
          }

          await batch.commit();

          await pendingRef.update({
            status: 'completed',
            stripeSessionId: session.id,
            amountTotal: session.amount_total,
            currency: session.currency,
            completedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          const orderRef = db.collection('orders').doc();
          await orderRef.set({
            customerId: session.customer,
            paymentStatus: session.payment_status,
            amountTotal: session.amount_total,
            currency: session.currency,
            status: 'completed',
            kind: 'lesson_booking',
            pendingCheckoutId,
            metadata: session.metadata,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          const customerSnap = await db
            .collection('stripe_customers')
            .where('userId', '==', session.metadata.userId)
            .limit(1)
            .get();
          if (!customerSnap.empty) {
            await customerSnap.docs[0].ref.update({
              lastOrderAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }

          break;
        }

        try {
          const orderRef = db.collection('orders').doc();

          await db.runTransaction(async (transaction) => {
            transaction.set(orderRef, {
              customerId: session.customer,
              paymentStatus: session.payment_status,
              amountTotal: session.amount_total,
              currency: session.currency,
              status: 'completed',
              metadata: session.metadata,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            if (session.metadata?.userId) {
              const customerRef = db
                .collection('stripe_customers')
                .where('userId', '==', session.metadata.userId)
                .limit(1);

              const customerDoc = await transaction.get(customerRef);

              if (!customerDoc.empty) {
                transaction.update(customerDoc.docs[0].ref, {
                  lastOrderAt: admin.firestore.FieldValue.serverTimestamp()
                });
              }
            }
          });
        } catch (error) {
          console.error('Error storing order:', error);
          throw error;
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        try {
          await db.collection('subscriptions').doc(subscription.id).set(
            {
              customerId: subscription.customer,
              status: subscription.status,
              priceId: subscription.items.data[0].price.id,
              currentPeriodStart: subscription.current_period_start,
              currentPeriodEnd: subscription.current_period_end,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            },
            { merge: true }
          );
        } catch (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        try {
          await db.collection('subscriptions').doc(subscription.id).update({
            status: 'canceled',
            canceledAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (error) {
          console.error('Error canceling subscription:', error);
          throw error;
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        try {
          await db.collection('payments').add({
            paymentIntentId: paymentIntent.id,
            customerId: paymentIntent.customer,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (error) {
          console.error('Error storing payment:', error);
          throw error;
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Webhook processing failed');
  }
});
