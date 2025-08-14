import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Types for better type safety
interface CheckoutSessionData {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
}



export const createCheckoutSession = functions.https.onCall(async (data: CheckoutSessionData, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { priceId, mode, successUrl, cancelUrl } = data;

  // Validate required fields
  if (!priceId || !mode || !successUrl || !cancelUrl) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields'
    );
  }

  try {
    // Get or create Stripe customer
    const customerSnapshot = await admin.firestore()
      .collection('stripe_customers')
      .where('userId', '==', context.auth.uid)
      .limit(1)
      .get();

    let customerId: string;

    if (customerSnapshot.empty) {
      // Create new customer
      const customer = await stripe.customers.create({
        email: context.auth.token.email,
        metadata: {
          userId: context.auth.uid
        }
      });

      await admin.firestore().collection('stripe_customers').add({
        userId: context.auth.uid,
        customerId: customer.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      customerId = customer.id;
    } else {
      customerId = customerSnapshot.docs[0].data().customerId;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
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
    
    // Handle specific Stripe errors
    if (error && typeof error === 'object' && 'type' in error && error.type === 'StripeCardError') {
      throw new functions.https.HttpsError('failed-precondition', (error as { message: string }).message);
    }
    
    throw new functions.https.HttpsError('internal', 'An unexpected error occurred');
  }
});

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
        
        // Store order in Firestore with better error handling
        try {
          const orderRef = admin.firestore().collection('orders').doc();
          
          await admin.firestore().runTransaction(async (transaction) => {
            // Create the order
            transaction.set(orderRef, {
              customerId: session.customer,
              paymentStatus: session.payment_status,
              amountTotal: session.amount_total,
              currency: session.currency,
              status: 'completed',
              metadata: session.metadata,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Update customer record if needed
            if (session.metadata?.userId) {
              const customerRef = admin.firestore()
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
          throw error; // Re-throw to be caught by outer try-catch
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        try {
          await admin.firestore().collection('subscriptions').doc(subscription.id).set({
            customerId: subscription.customer,
            status: subscription.status,
            priceId: subscription.items.data[0].price.id,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        try {
          await admin.firestore().collection('subscriptions').doc(subscription.id).update({
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
          await admin.firestore().collection('payments').add({
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