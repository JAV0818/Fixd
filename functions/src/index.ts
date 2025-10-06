import * as admin from "firebase-admin";
// import * as functions from "firebase-functions"; // For functions.config()
// import {https as v1https} from "firebase-functions/v1"; // Specific import for v1 https services
// import Stripe from "stripe";

if (!admin.apps.length) { // Ensure Firebase is initialized only once
  admin.initializeApp();
}
// const db = admin.firestore(); // Ensure db is initialized

// Initialize Stripe with secret key and API version
// const stripeClient = new Stripe(functions.config().stripe.secret, {
//   apiVersion: "2025-08-27.basil",
// });


// This is the only function needed for the in-app PaymentSheet flow.
// export const preparePaymentSheet = v1https.onCall(async (data: any, context: v1https.CallableContext) => {
//   if (!context.auth) {
//     throw new v1https.HttpsError('unauthenticated', 'Must be authenticated');
//   }
//   const { amount, currency, quoteId, description } = data as { amount: number; currency: string; quoteId?: string; description?: string };
//   if (!amount || amount <= 0) {
//     throw new v1https.HttpsError('invalid-argument', 'Invalid amount');
//   }
//   const userId = context.auth.uid;
//   try {
//     // Ensure customer exists or create
//     let customerId: string | undefined;
//     const userDoc = await db.collection('users').doc(userId).get();
//     if (userDoc.exists && userDoc.data()?.stripeId) {
//       const storedId = userDoc.data()!.stripeId as string;
//       try {
//         const retrieved = await stripeClient.customers.retrieve(storedId);
//         // @ts-ignore
//         if (retrieved && !(retrieved as any).deleted) {
//           customerId = storedId;
//         } else {
//           console.warn(`Stored Stripe customer ${storedId} was deleted – recreating`);
//         }
//       } catch (err: any) {
//         if (err?.raw?.type === 'invalid_request_error') {
//           console.warn(`Stored Stripe customer ${storedId} invalid – recreating`);
//         } else {
//           throw err;
//         }
//       }
//     }
//     if (!customerId) {
//       const customer = await stripeClient.customers.create({
//         metadata: { firebaseUID: userId },
//         email: (context.auth.token as any)?.email,
//       });
//       customerId = customer.id;
//       await db.collection('users').doc(userId).set({ stripeId: customerId }, { merge: true });
//     }

//     // Create Ephemeral key required by PaymentSheet
//     const ephemeralKey = await stripeClient.ephemeralKeys.create({ customer: customerId }, { apiVersion: '2025-08-27.basil' });

//     // Create PaymentIntent
//     const paymentIntent = await stripeClient.paymentIntents.create({
//       amount: Math.round(amount),
//       currency: (currency || 'usd').toLowerCase(),
//       customer: customerId,
//       metadata: { quoteId: quoteId || '', firebaseUID: userId },
//       description: description || `Deposit for quote ${quoteId}`,
//       payment_method_types: ['card'],
//     });

//     return {
//       paymentIntentClientSecret: paymentIntent.client_secret,
//       customerId,
//       customerEphemeralKeySecret: ephemeralKey.secret,
//     };
//   } catch (e: any) {
//     console.error('preparePaymentSheet error', e);
//     throw new v1https.HttpsError('internal', e?.message || 'Failed to prepare payment');
//   }
// });
