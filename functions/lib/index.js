"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = exports.prepareLessonCheckout = exports.createCheckoutSession = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const pricing_1 = require("./pricing");
admin.initializeApp();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
const db = admin.firestore();
function timeRangesOverlap(aStart, aEnd, bStart, bEnd) {
    const newStart = new Date(`2000-01-01T${aStart}`);
    const newEnd = new Date(`2000-01-01T${aEnd}`);
    const lessonStart = new Date(`2000-01-01T${bStart}`);
    const lessonEnd = new Date(`2000-01-01T${bEnd}`);
    return ((newStart >= lessonStart && newStart < lessonEnd) ||
        (newEnd > lessonStart && newEnd <= lessonEnd) ||
        (newStart <= lessonStart && newEnd >= lessonEnd));
}
async function instructorHasConflict(instructorId, date, startTime, endTime) {
    const snap = await db
        .collection('lessons')
        .where('instructorId', '==', instructorId)
        .where('date', '==', date)
        .where('status', 'in', ['available', 'scheduled', 'in_progress', 'booked'])
        .get();
    for (const doc of snap.docs) {
        const lesson = doc.data();
        if (!lesson.startTime || !lesson.endTime)
            continue;
        if (timeRangesOverlap(startTime, endTime, lesson.startTime, lesson.endTime)) {
            return true;
        }
    }
    return false;
}
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
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
        let customerId;
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
        }
        else {
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
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        if (error &&
            typeof error === 'object' &&
            'type' in error &&
            error.type === 'StripeCardError' &&
            'message' in error &&
            typeof error.message === 'string') {
            throw new functions.https.HttpsError('failed-precondition', error.message);
        }
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred');
    }
});
exports.prepareLessonCheckout = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    const uid = context.auth.uid;
    const userSnap = await db.collection('users').doc(uid).get();
    const userData = userSnap.data();
    if (!userData || userData.role !== 'student') {
        throw new functions.https.HttpsError('permission-denied', 'Only students can purchase lesson bookings');
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
    }));
    const resolved = [];
    for (const draft of items) {
        if (!draft.title ||
            !draft.instructorId ||
            !draft.date ||
            !draft.startTime ||
            !draft.endTime) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid lesson line');
        }
        const instSnap = await db.collection('users').doc(draft.instructorId).get();
        if (!instSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Instructor not found');
        }
        const instructor = instSnap.data();
        const hourly = (0, pricing_1.resolveHourlyRateFromMountain)(instructor, mountains, draft.type);
        if (hourly == null || hourly <= 0) {
            throw new functions.https.HttpsError('failed-precondition', 'Could not resolve price for a lesson. Check resort pricing.');
        }
        const hours = (0, pricing_1.lessonHours)(draft.startTime, draft.endTime);
        if (hours <= 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid time range');
        }
        const totalUsd = hourly * hours;
        const amountCents = Math.round(totalUsd * 100);
        if (amountCents < 50) {
            throw new functions.https.HttpsError('invalid-argument', 'Amount too small');
        }
        const sessionType = (0, pricing_1.getSessionType)(draft.startTime, draft.endTime);
        const lessonPayload = {
            title: draft.title,
            instructorId: draft.instructorId,
            date: draft.date,
            sport: (_a = draft.sport) !== null && _a !== void 0 ? _a : 'skiing',
            sessionType,
            startTime: draft.startTime,
            endTime: draft.endTime,
            status: 'scheduled',
            type: draft.type,
            maxStudents: draft.maxStudents,
            skillLevel: draft.skillLevel,
            price: hourly,
            description: draft.description,
            skillsFocus: (_b = draft.skillsFocus) !== null && _b !== void 0 ? _b : [],
            notes: (_c = draft.notes) !== null && _c !== void 0 ? _c : ''
        };
        const instructorName = (_d = instructor.name) !== null && _d !== void 0 ? _d : 'Instructor';
        const productName = `${draft.title} — ${instructorName} — ${draft.date}`;
        resolved.push({ lessonPayload, amountCents, productName });
    }
    const customerSnapshot = await db
        .collection('stripe_customers')
        .where('userId', '==', uid)
        .limit(1)
        .get();
    let customerId;
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
    }
    else {
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
});
exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
    var _a, _b;
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        res.status(400).send('Missing signature');
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Webhook signature verification failed:', errorMessage);
        res.status(400).send(`Webhook Error: ${errorMessage}`);
        return;
    }
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const pendingCheckoutId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.pendingCheckoutId;
                if (pendingCheckoutId && ((_b = session.metadata) === null || _b === void 0 ? void 0 : _b.userId)) {
                    const pendingRef = db.collection('pending_lesson_checkouts').doc(pendingCheckoutId);
                    const pendingSnap = await pendingRef.get();
                    if (!pendingSnap.exists) {
                        console.error('Pending checkout missing:', pendingCheckoutId);
                        break;
                    }
                    const pending = pendingSnap.data();
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
                        const instructorId = p.instructorId;
                        const date = p.date;
                        const startTime = p.startTime;
                        const endTime = p.endTime;
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
                        var _a;
                        transaction.set(orderRef, {
                            customerId: session.customer,
                            paymentStatus: session.payment_status,
                            amountTotal: session.amount_total,
                            currency: session.currency,
                            status: 'completed',
                            metadata: session.metadata,
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        if ((_a = session.metadata) === null || _a === void 0 ? void 0 : _a.userId) {
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
                }
                catch (error) {
                    console.error('Error storing order:', error);
                    throw error;
                }
                break;
            }
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                try {
                    await db.collection('subscriptions').doc(subscription.id).set({
                        customerId: subscription.customer,
                        status: subscription.status,
                        priceId: subscription.items.data[0].price.id,
                        currentPeriodStart: subscription.current_period_start,
                        currentPeriodEnd: subscription.current_period_end,
                        cancelAtPeriodEnd: subscription.cancel_at_period_end,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
                catch (error) {
                    console.error('Error updating subscription:', error);
                    throw error;
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                try {
                    await db.collection('subscriptions').doc(subscription.id).update({
                        status: 'canceled',
                        canceledAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
                catch (error) {
                    console.error('Error canceling subscription:', error);
                    throw error;
                }
                break;
            }
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                try {
                    await db.collection('payments').add({
                        paymentIntentId: paymentIntent.id,
                        customerId: paymentIntent.customer,
                        amount: paymentIntent.amount,
                        currency: paymentIntent.currency,
                        status: paymentIntent.status,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
                catch (error) {
                    console.error('Error storing payment:', error);
                    throw error;
                }
                break;
            }
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Webhook processing failed');
    }
});
//# sourceMappingURL=index.js.map