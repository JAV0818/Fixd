import * as admin from "firebase-admin";
import * as functions from "firebase-functions"; // For functions.config()
import {https as v1https} from "firebase-functions/v1"; // Specific import for v1 https services
import Stripe from "stripe";

if (!admin.apps.length) { // Ensure Firebase is initialized only once
  admin.initializeApp();
}
const db = admin.firestore(); // Ensure db is initialized

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

  const {amount, currency, customChargeId, description} = data as CreatePaymentIntentData;
  const providedCustomerStripeId = data.customerStripeId as string | undefined; // Explicitly get it

  if (!amount || amount <= 0) {
    console.error("Invalid amount provided:", amount);
    throw new v1https.HttpsError("invalid-argument", "The function must be called with a valid \"amount\".");
  }
  if (!currency || typeof currency !== "string") {
    console.error("Currency not provided or invalid type:", currency);
    throw new v1https.HttpsError("invalid-argument", "The function must be called with a valid \"currency\".");
  }

  let finalCustomerStripeId: string | undefined = providedCustomerStripeId;
  const userId = context.auth.uid;

  if (!finalCustomerStripeId) {
    console.log(`No customerStripeId provided by client for user ${userId}. Checking Firestore.`);
    const userDocRef = db.collection("users").doc(userId);
    try {
      const userDoc = await userDocRef.get();
      if (userDoc.exists && userDoc.data()?.stripeId) {
        finalCustomerStripeId = userDoc.data()?.stripeId as string;
        console.log(`Found existing Stripe ID in Firestore for user ${userId}: ${finalCustomerStripeId}`);
      } else {
        console.log(`No Stripe ID found in Firestore for user ${userId}. Creating new Stripe customer.`);
        const customerCreateParams: Stripe.CustomerCreateParams = {
          metadata: {firebaseUID: userId},
        };
        if (context.auth.token.email) {
          customerCreateParams.email = context.auth.token.email;
        }
        // You could add name here if available: context.auth.token.name

        const newStripeCustomer = await stripeClient.customers.create(customerCreateParams);
        finalCustomerStripeId = newStripeCustomer.id;
        console.log(`Created new Stripe customer for user ${userId}: ${finalCustomerStripeId}`);

        await userDocRef.set({stripeId: finalCustomerStripeId}, {merge: true});
        console.log(`Saved new Stripe ID to Firestore for user ${userId}.`);
      }
    } catch (err) {
      console.error(`Error fetching/creating Stripe customer for user ${userId}:`, err);
      throw new v1https.HttpsError("internal", "Failed to retrieve or create Stripe customer information.");
    }
  } else {
    console.log(`Using provided customerStripeId for user ${userId}: ${finalCustomerStripeId}`);
  }


  try {
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      payment_method_types: ["card"], // Defaulting to card. Adjust if needed.
      metadata: {}, // Initialized here
    };

    if (finalCustomerStripeId) {
      paymentIntentParams.customer = finalCustomerStripeId;
    }

    if (description) {
      paymentIntentParams.description = description;
    }

    // Ensure metadata is always an object before assigning to its properties
    // Although initialized above, this makes it robust through conditional logic
    if (!paymentIntentParams.metadata) {
      paymentIntentParams.metadata = {};
    }

    if (customChargeId) {
      paymentIntentParams.metadata.customChargeId = customChargeId;
      paymentIntentParams.metadata.firestoreUserId = userId;
    }

    console.log("Creating PaymentIntent with params:", paymentIntentParams);
    const paymentIntent = await stripeClient.paymentIntents.create(paymentIntentParams);

    console.log("PaymentIntent created successfully:", paymentIntent.id);
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerStripeId: finalCustomerStripeId,
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

// New function to mark a custom charge as paid
export const markChargeAsPaid = v1https.onCall(async (data: any, context: v1https.CallableContext) => {
  console.log("markChargeAsPaid called with data:", data);

  if (!context.auth) {
    console.error("User not authenticated to mark charge as paid.");
    throw new v1https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const {customChargeId, paymentIntentId} = data;

  if (!customChargeId || typeof customChargeId !== "string") {
    console.error("Invalid customChargeId provided:", customChargeId);
    throw new v1https.HttpsError("invalid-argument", "The function must be called with a valid \"customChargeId\".");
  }

  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    console.error("Invalid paymentIntentId provided:", paymentIntentId);
    throw new v1https.HttpsError("invalid-argument", "The function must be called with a valid \"paymentIntentId\".");
  }

  const userId = context.auth.uid; // The user who made the payment

  try {
    const chargeDocRef = db.collection("customCharges").doc(customChargeId);
    const chargeDoc = await chargeDocRef.get();

    if (!chargeDoc.exists) {
      console.error(`Custom charge ${customChargeId} not found.`);
      throw new v1https.HttpsError("not-found", "Custom charge not found.");
    }

    const chargeData = chargeDoc.data();
    if (!chargeData) {
      console.error(`Custom charge data for ${customChargeId} is undefined.`);
      throw new v1https.HttpsError("internal", "Could not retrieve charge data.");
    }

    // Security check: Ensure the authenticated user is the customer for this charge
    if (chargeData.customerId !== userId) {
      console.error(`User ${userId} is not authorized to update charge ${customChargeId} owned by ${chargeData.customerId}.`);
      throw new v1https.HttpsError("permission-denied", "You are not authorized to update this charge.");
    }

    // Ensure the charge is in 'PendingApproval' status before marking as paid and accepted
    if (chargeData.status !== "PendingApproval") {
      console.warn(`Charge ${customChargeId} is not in 'PendingApproval' status. Current status: ${chargeData.status}. Cannot mark as accepted.`);
      throw new v1https.HttpsError("failed-precondition", `Charge is not pending approval. Current status: ${chargeData.status}`);
    }

    // Create a new RepairOrder from this CustomCharge
    const newRepairOrderRef = db.collection("repairOrders").doc(); // Auto-generate ID
    const repairOrderData = {
      customerId: chargeData.customerId,
      customerName: chargeData.customerName || null,
      providerId: chargeData.mechanicId, // Mechanic who created the quote is the provider
      providerName: chargeData.mechanicName || null,
      items: [{
        id: customChargeId, // Use custom charge ID as a unique item ID here
        name: chargeData.description,
        price: chargeData.price,
        quantity: 1,
        vehicleId: null,
        vehicleDisplay: "Custom Service",
      }],
      totalPrice: chargeData.price,
      status: "Accepted", // Initial status for the new repair order
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // Timestamp for the new order
      originalCustomChargeId: customChargeId, // Link back to the original quote
      locationDetails: chargeData.locationDetails || { // Use location from custom charge if it exists, else placeholder
        address: "Location TBD by Provider",
        city: "",
        state: "",
        zipCode: "",
        phoneNumber: "", // Ensure trailing comma for multiline objects
      },
      paymentMethod: null, // Or determine from payment, e.g., 'creditCard'
      // Add any other necessary fields for RepairOrder, ensuring they have defaults if not from CustomCharge
    };

    await newRepairOrderRef.set(repairOrderData);
    console.log(`Created new RepairOrder ${newRepairOrderRef.id} from CustomCharge ${customChargeId}.`);

    // Update the original CustomCharge status
    await chargeDocRef.update({
      status: "Accepted", // Or "ConvertedToOrder" if you prefer to distinguish
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentIntentId: paymentIntentId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      linkedRepairOrderId: newRepairOrderRef.id, // Link to the new repair order
    });

    // Shortened log message for line length
    console.log(`CustomCharge ${customChargeId} marked Accepted, linked to RepairOrder ${newRepairOrderRef.id}.`);
    return {
      success: true,
      message: "Charge accepted, payment confirmed, and service order created.",
      repairOrderId: newRepairOrderRef.id,
    }; // Ensured no extra padding before this line or after
  } catch (error: any) {
    console.error(`Error in markChargeAsPaid for ${customChargeId}:`, error);
    if (error instanceof v1https.HttpsError) { // Re-throw HttpsError instances
      throw error;
    }
    throw new v1https.HttpsError("internal", error.message || "Failed to mark charge as accepted.");
  }
});

// New function for provider to cancel a custom charge quote
export const cancelCustomChargeByProvider = v1https.onCall(async (data: any, context: v1https.CallableContext) => {
  console.log("cancelCustomChargeByProvider called with data:", data);

  if (!context.auth) {
    console.error("User not authenticated to cancel custom charge.");
    throw new v1https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const {customChargeId} = data;

  if (!customChargeId || typeof customChargeId !== "string") {
    console.error("Invalid customChargeId provided:", customChargeId);
    throw new v1https.HttpsError("invalid-argument", "The function must be called with a valid \"customChargeId\".");
  }

  const mechanicId = context.auth.uid; // The mechanic calling the function

  try {
    const chargeDocRef = db.collection("customCharges").doc(customChargeId);
    const chargeDoc = await chargeDocRef.get();

    if (!chargeDoc.exists) {
      console.error(`Custom charge ${customChargeId} not found.`);
      throw new v1https.HttpsError("not-found", "Custom charge not found.");
    }

    const chargeData = chargeDoc.data();
    if (!chargeData) {
      console.error(`Custom charge data for ${customChargeId} is undefined.`);
      throw new v1https.HttpsError("internal", "Could not retrieve charge data.");
    }

    // Security check: Ensure the authenticated user is the mechanic for this charge
    if (chargeData.mechanicId !== mechanicId) {
      console.error(`User ${mechanicId} is not authorized to cancel charge ${customChargeId} created by ${chargeData.mechanicId}.`);
      throw new v1https.HttpsError("permission-denied", "You are not authorized to cancel this charge.");
    }

    // Ensure the charge is in 'PendingApproval' status
    if (chargeData.status !== "PendingApproval") {
      console.warn(`Charge ${customChargeId} is not in 'PendingApproval' status. Current status: ${chargeData.status}. Cannot cancel.`);
      throw new v1https.HttpsError("failed-precondition", `Charge is not pending approval. Current status: ${chargeData.status}`);
    }

    await chargeDocRef.update({
      status: "CancelledByMechanic",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Custom charge ${customChargeId} successfully cancelled by mechanic ${mechanicId}.`);
    return {success: true, message: "Custom charge cancelled successfully."};
  } catch (error: any) {
    console.error(`Error cancelling charge ${customChargeId} by provider:`, error);
    if (error instanceof v1https.HttpsError) {
      throw error;
    }
    throw new v1https.HttpsError("internal", error.message || "Failed to cancel custom charge.");
  }
});

// REMOVED onnewpreacceptancemessage function entirely
