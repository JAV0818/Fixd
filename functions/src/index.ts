import * as admin from "firebase-admin";
import {beforeUserCreated, AuthBlockingEvent} from "firebase-functions/v2/identity";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";

// import {https as v1https} from "firebase-functions/v1"; // Specific import for v1 https services
// import Stripe from "stripe";

if (!admin.apps.length) { // Ensure Firebase is initialized only once
  admin.initializeApp();
}
const db = admin.firestore(); // Ensure db is initialized

// =====================================================================
// AUTO-EXPIRE CLAIMED ORDERS
// Runs every 10 minutes to release expired claims back to the pool
// =====================================================================
export const autoExpireClaims = onSchedule("every 10 minutes", async () => {
  const now = admin.firestore.Timestamp.now();

  console.log("Running autoExpireClaims check at:", now.toDate().toISOString());

  try {
    // Query for claimed orders where the claim has expired
    const expiredClaimsQuery = await db
      .collection("repair-orders")
      .where("status", "==", "Claimed")
      .where("claimExpiresAt", "<", now)
      .get();

    if (expiredClaimsQuery.empty) {
      console.log("No expired claims found.");
      return;
    }

    console.log(`Found ${expiredClaimsQuery.size} expired claim(s). Releasing...`);

    // Batch update all expired claims
    const batch = db.batch();

    expiredClaimsQuery.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`Releasing expired claim for order ${doc.id}, was claimed by provider ${data.providerId}`);
      batch.update(doc.ref, {
        status: "Pending",
        providerId: null,
        providerName: null,
        claimedAt: null,
        claimExpiresAt: null,
        // Keep a record of who had it claimed
        lastExpiredClaimBy: data.providerId,
        lastExpiredClaimAt: now,
      });
    });

    await batch.commit();
    console.log(`Successfully released ${expiredClaimsQuery.size} expired claim(s).`);
  } catch (error) {
    console.error("Error in autoExpireClaims:", error);
    throw error;
  }
});

// Create a Firestore user profile document before a new auth user is created.
export const onAuthUserCreate = beforeUserCreated(
  {region: "us-central1"},
  async (event: AuthBlockingEvent) => {
    const user = event.data;
    if (!user) {
      console.error("onAuthUserCreate called without user data");
      return;
    }

  const userDocRef = db.collection("users").doc(user.uid);
  const existing = await userDocRef.get();
  const existingRole = existing.exists ? existing.data()?.role : undefined;

  const role = existingRole || "customer";
  const profile = {
    role,
    email: user.email || null,
    firstName: user.displayName?.split(" ")?.[0] || null,
    lastName: user.displayName?.split(" ")?.slice(1).join(" ") || null,
    phone: user.phoneNumber || null,
    photoUrl: user.photoURL || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await userDocRef.set(profile, {merge: true});
  }
);

// =====================================================================
// RECALCULATE USER RATINGS WHEN ORDER IS RATED
// Triggers when a repair-order document is updated with a rating
// =====================================================================
export const onRatingSubmit = onDocumentUpdated(
  {
    document: "repair-orders/{orderId}",
    region: "us-central1",
  },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    const orderId = event.params.orderId;

    if (!beforeData || !afterData) {
      console.log("Missing before/after data for order:", orderId);
      return;
    }

    // Check if customer rating was added
    const customerRatingAdded = !beforeData.customerRating && afterData.customerRating;
    // Check if provider rating was added
    const providerRatingAdded = !beforeData.providerRating && afterData.providerRating;

    if (!customerRatingAdded && !providerRatingAdded) {
      // No rating was added, skip
      return;
    }

    try {
      // Recalculate provider's average rating if customer rated
      if (customerRatingAdded && afterData.providerId) {
        await recalculateUserRating(afterData.providerId, "provider");
      }

      // Recalculate customer's average rating if provider rated
      if (providerRatingAdded && afterData.customerId) {
        await recalculateUserRating(afterData.customerId, "customer");
      }

      console.log(`Successfully recalculated ratings for order ${orderId}`);
    } catch (error) {
      console.error(`Error recalculating ratings for order ${orderId}:`, error);
      throw error;
    }
  }
);

/**
 * Helper function to recalculate a user's average rating
 */
async function recalculateUserRating(userId: string, role: "customer" | "provider"): Promise<void> {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    console.warn(`User ${userId} does not exist`);
    return;
  }

  // Query all completed orders where this user was rated
  const ratingField = role === "customer" ? "providerRating" : "customerRating";
  const userIdField = role === "customer" ? "customerId" : "providerId";

  const completedOrdersQuery = await db
    .collection("repair-orders")
    .where(userIdField, "==", userId)
    .where("status", "==", "Completed")
    .where(ratingField, ">", 0) // Only orders with ratings
    .get();

  if (completedOrdersQuery.empty) {
    // No ratings yet, set to 0
    await userRef.update({
      averageRating: 0,
      totalRatingsCount: 0,
    });
    return;
  }

  // Calculate average rating
  let totalRating = 0;
  let ratingCount = 0;

  completedOrdersQuery.docs.forEach((doc) => {
    const data = doc.data();
    const rating = data[ratingField];
    if (rating && typeof rating === "number" && rating > 0) {
      totalRating += rating;
      ratingCount++;
    }
  });

  const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

  // Update user document
  await userRef.update({
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    totalRatingsCount: ratingCount,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(
    `Updated ${role} ${userId}: averageRating=${averageRating.toFixed(1)}, count=${ratingCount}`
  );
}

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
