import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { NativeStackScreenProps } from '@react-navigation/native-stack'; // We'll add this once navigator is known
import { useRoute, useNavigation } from '@react-navigation/native';
import { firestore, functions, auth } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CustomCharge } from '../../types/customCharges'; // Adjust path if needed
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react-native';
import { useStripe } from '@stripe/stripe-react-native'; // Import useStripe

// Assuming your CustomerNavigator (or equivalent) will have a param list like:
// export type CustomerStackParamList = {
//   Home: undefined;
//   CustomChargeDetail: { customChargeId: string };
//   // ... other routes
// };
// type Props = NativeStackScreenProps<CustomerStackParamList, 'CustomChargeDetail'>;

// Placeholder for navigation props until integrated with actual navigator
type RouteParams = {
  customChargeId: string;
};

export default function CustomChargeDetailScreen(/* { navigation, route }: Props */) {
  const route = useRoute();
  const navigation = useNavigation();
  const { customChargeId } = route.params as RouteParams;

  const [charge, setCharge] = useState<CustomCharge | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe(); // Get Stripe functions, removed stripeLoading

  useEffect(() => {
    if (!customChargeId) {
      Alert.alert("Error", "No charge ID provided.");
      setLoading(false);
      navigation.goBack();
      return;
    }

    const fetchCharge = async () => {
      setLoading(true);
      try {
        const chargeDocRef = doc(firestore, 'customCharges', customChargeId);
        const docSnap = await getDoc(chargeDocRef);
        if (docSnap.exists()) {
          setCharge({ id: docSnap.id, ...docSnap.data() } as CustomCharge);
        } else {
          Alert.alert("Error", "Custom charge not found.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching custom charge:", error);
        Alert.alert("Error", "Could not load the charge details.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchCharge();
  }, [customChargeId, navigation]);

  const handleUpdateStatus = async (newStatus: CustomCharge['status']) => {
    if (!charge || !charge.id) return;
    setIsUpdating(true);
    try {
      const chargeDocRef = doc(firestore, 'customCharges', charge.id);
      await updateDoc(chargeDocRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      // Store the new status locally before calling handlePayment, so UI can react if needed
      const updatedChargeData = { ...charge, status: newStatus, updatedAt: new Date() } as CustomCharge;
      setCharge(updatedChargeData);
      
      Alert.alert("Success", `Charge has been ${newStatus === 'ApprovedAndPendingPayment' ? 'approved' : 'declined'}.`);

      if (newStatus === 'ApprovedAndPendingPayment') {
        console.log("Charge approved, proceeding to payment flow.");
        // Pass the updated charge object to handlePayment if it relies on the most current state
        // For now, handlePayment fetches the charge from state, which we just updated.
        await handlePayment(); 
      } else if (newStatus === 'DeclinedByCustomer') {
        navigation.goBack(); // Or to a confirmation screen
      }
    } catch (error) {
      console.error(`Error updating charge status to ${newStatus}:`, error);
      Alert.alert("Error", `Could not update the charge status.`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePayment = async () => {
    if (!charge || !charge.id || !charge.price) {
      Alert.alert("Error", "Charge details are missing for payment.");
      return;
    }

    setIsPaying(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Authentication Error", "You need to be logged in to make a payment.");
        setIsPaying(false);
        return;
      }

      // The following block that incorrectly checked for stripeCustomerId on the client-side is now removed.
      // Stripe Customer ID logic is handled by the createPaymentIntent Cloud Function.

      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      const amountInCents = Math.round(charge.price * 100); // Convert dollars to cents

      console.log(`Calling createPaymentIntent with: amount=${amountInCents}, currency='usd', customChargeId=${charge.id}`);

      const result = await createPaymentIntent({
        amount: amountInCents,
        currency: "usd", // Pass currency to the cloud function
        customChargeId: charge.id, // Optional: pass the charge ID for linking
        // customerId is no longer sent from client
      });

      const { clientSecret, error, customerStripeId } = result.data as { clientSecret?: string; error?: string, customerStripeId?: string };

      if (error) {
        console.error("Error from createPaymentIntent function:", error);
        Alert.alert("Payment Error", error);
      } else if (clientSecret) {
        console.log("Received clientSecret:", clientSecret, "Stripe Customer ID:", customerStripeId);
        
        // Initialize the Payment Sheet
        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: "Fixd Services", // Replace with your app/merchant name
          paymentIntentClientSecret: clientSecret,
          customerId: customerStripeId, // Optional: use the customer ID from the cloud function
          // allowsDelayedPaymentMethods: true, // Set to true if you want to support delayed payment methods like bank debits
          // returnURL: 'yourappscheme://stripe-redirect', // Optional, for deep linking back to your app
          appearance: {
            colors: {
              primary: '#00F0FF', // Your primary brand color
              background: '#1C2333',
              componentBackground: '#2A3555',
              componentText: '#FFFFFF',
              icon: '#FFFFFF',
              placeholderText: '#AEAEAE',
            }
          }
        });

        if (initError) {
          console.error("Error initializing payment sheet:", initError);
          Alert.alert("Payment Setup Error", initError.message);
          setIsPaying(false);
          return;
        }

        // Present the Payment Sheet
        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          if (presentError.code === 'Canceled') {
            Alert.alert("Payment Canceled", "The payment process was canceled.");
          } else {
            console.error("Error presenting payment sheet:", presentError);
            Alert.alert("Payment Failed", presentError.message);
          }
        } else {
          Alert.alert("Payment Success!", "Your payment has been processed. Updating status...");
          // Call markChargeAsPaid Cloud Function instead of updating Firestore directly
          try {
            const markAsPaidFunction = httpsCallable(functions, 'markChargeAsPaid');
            const paymentIntentId = clientSecret.split('_secret')[0];
            
            console.log(`Calling markChargeAsPaid with: customChargeId=${charge.id}, paymentIntentId=${paymentIntentId}`);
            
            const result = await markAsPaidFunction({ 
              customChargeId: charge.id, 
              paymentIntentId: paymentIntentId 
            });

            const { success: markAsPaidSuccess, message: markAsPaidMessage, error: markAsPaidError } = result.data as { success?: boolean; message?: string; error?: string };

            if (markAsPaidSuccess) {
              setCharge(prev => prev ? { ...prev, status: 'Accepted' } : null);
              console.log("Charge status updated to Accepted via Cloud Function:", markAsPaidMessage);
              Alert.alert("Status Updated", "Charge has been successfully accepted and payment confirmed.");
              navigation.goBack();
            } else {
              console.error("Error from markChargeAsPaid function:", markAsPaidError || markAsPaidMessage);
              Alert.alert("Update Error", `Payment was successful, but failed to mark charge as paid: ${markAsPaidError || markAsPaidMessage}`);
            }
          } catch (cloudFunctionError: any) {
            console.error("Error calling markChargeAsPaid function:", cloudFunctionError);
            const errorMessage = cloudFunctionError?.message || "An unknown error occurred while finalizing payment.";
            Alert.alert("Update Error", `Payment was successful, but there was an issue updating the charge status. ${errorMessage}`);
          }
        }
      } else {
        console.error("Invalid response from createPaymentIntent function.");
        Alert.alert("Payment Error", "Could not initialize payment. Invalid response from server.");
      }
    } catch (err) {
      console.error("Error calling createPaymentIntent function:", err);
      const errorMessage = (err as any)?.message || "An unknown error occurred.";
      Alert.alert("Payment Setup Error", `Failed to initiate payment. ${errorMessage}`);
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#00F0FF" /></View>;
  }

  if (!charge) {
    return <View style={styles.centered}><Text style={styles.errorText}>Charge details not available.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quote Details</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>From Mechanic:</Text>
          <Text style={styles.detailValue}>{charge.mechanicName}</Text>
        </View>
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Total Amount:</Text>
          <Text style={[styles.detailValue, styles.priceValue]}>${charge.price.toFixed(2)}</Text>
        </View>
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.detailValue}>{charge.description}</Text>
        </View>
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={styles.detailValue}>{charge.status}</Text>
        </View>
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Date Created:</Text>
          <Text style={styles.detailValue}>
            {charge.createdAt?.toDate ? charge.createdAt.toDate().toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        {charge.status === 'PendingApproval' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]} 
              onPress={handlePayment}
              disabled={isUpdating || isPaying}
            >
              {(isUpdating || isPaying) ? <ActivityIndicator color="#FFFFFF"/> : <CheckCircle size={20} color="#FFFFFF" style={{marginRight: 8}} />}
              <Text style={styles.actionButtonText}>Approve & Pay Quote</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.declineButton]} 
              onPress={() => handleUpdateStatus('DeclinedByCustomer')}
              disabled={isUpdating || isPaying}
            >
              {isUpdating ? <ActivityIndicator color="#FFFFFF"/> : <XCircle size={20} color="#FFFFFF" style={{marginRight: 8}} />}
              <Text style={styles.actionButtonText}>Decline Quote</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Add logic here for payment if status is ApprovedAndPendingPayment */}
         {/* THIS BLOCK WILL BE REMOVED as ApprovedAndPendingPayment status will be skipped */}
         {/* {charge.status === 'ApprovedAndPendingPayment' && (
            <View style={styles.actionsContainer}> 
                <TouchableOpacity 
                  style={[styles.actionButton, styles.payButton, isPaying && styles.disabledButton]} 
                  onPress={handlePayment}
                  disabled={isPaying}
                >
                  {isPaying ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>Pay Now (${charge.price.toFixed(2)})</Text>
                  )}
                </TouchableOpacity>
            </View>
        )} */}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0F1E' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F1E' },
  errorText: { color: '#FF6B6B', fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#121827',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  container: { flex: 1, padding: 20 },
  detailBlock: {
    marginBottom: 18,
    padding: 15,
    backgroundColor: '#1C2333',
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#AEAEAE',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
  },
  priceValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#00F0FF',
  },
  actionsContainer: {
    marginTop: 30,
    paddingBottom: 20, // For scroll room
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  approveButton: {
    backgroundColor: '#4CAF50', // Green
  },
  declineButton: {
    backgroundColor: '#F44336', // Red
  },
  payButton: {
      backgroundColor: '#007BFF', // Blue
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0', // Grey out when disabled
  },
}); 