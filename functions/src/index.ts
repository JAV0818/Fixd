import * as admin from "firebase-admin";
import * as functions from "firebase-functions"; // For functions.config()
import {https as v1https} from "firebase-functions/v1"; // Specific import for v1 https services
import Stripe from "stripe";

if (!admin.apps.length) { // Ensure Firebase is initialized only once
  admin.initializeApp();
}
// const db = admin.firestore(); // Not needed for this simplified version

// Initialize Stripe with secret key and API version
const stripeClient = new Stripe(functions.config().stripe.secret, { // functions.config() from main import
  apiVersion: "2025-05-28.basil", // UPDATED to the version expected by the library's types
});

// Define an interface for the expected data
interface CreatePaymentIntentData {
  amount: number; // Amount in cents
  currency: string; // e.g., 'usd'
  customChargeId?: string; // Optional: To link to the custom charge in Firestore
  description?: string; // Optional: For the payment intent description
  customerStripeId?: string; // Optional: If you create and use Stripe Customer objects
  // Add any other relevant data you might want to pass
}

// Reverted to the simpler form using specific v1 https import
export const createPaymentIntent = v1https.onCall(async (data: any, context: v1https.CallableContext) => {
  console.log("createPaymentIntent called with data:", data);

  if (!context.auth) {
    console.error("User not authenticated to create payment intent.");
    throw new v1https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const {amount, currency, customChargeId, description, customerStripeId} = data as CreatePaymentIntentData;

  if (!amount || amount <= 0) {
    console.error("Invalid amount provided:", amount);
    throw new v1https.HttpsError("invalid-argument", "The function must be called with a valid \"amount\".");
  }
  if (!currency || typeof currency !== "string") {
    console.error("Currency not provided or invalid type:", currency);
    throw new v1https.HttpsError("invalid-argument", "The function must be called with a valid \"currency\".");
  }

  try {
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      payment_method_types: ["card"],
      metadata: {},
    };

    if (description) {
      paymentIntentParams.description = description;
    }
    if (customChargeId) {
      if (!paymentIntentParams.metadata) paymentIntentParams.metadata = {};
      paymentIntentParams.metadata.customChargeId = customChargeId;
      paymentIntentParams.metadata.firestoreUserId = context.auth.uid;
    }
    if (customerStripeId) {
      paymentIntentParams.customer = customerStripeId;
    }

    console.log("Creating PaymentIntent with params:", paymentIntentParams);
    const paymentIntent = await stripeClient.paymentIntents.create(paymentIntentParams);

    console.log("PaymentIntent created successfully:", paymentIntent.id);
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: any) {
    console.error("Error creating PaymentIntent:", error);
    let errorCode: v1https.FunctionsErrorCode = "internal";
    if (error.type === "StripeCardError") {
      errorCode = "invalid-argument";
    } else if (error.type === "StripeInvalidRequestError") {
      errorCode = "invalid-argument";
    }
    throw new v1https.HttpsError(errorCode, error.message || "Failed to create payment intent.");
  }
});

// REMOVED onnewpreacceptancemessage function entirely
