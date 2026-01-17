import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useStripe } from '@stripe/stripe-react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, firestore } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { XCircle, CheckCircle, Wrench, ChevronLeft } from 'lucide-react-native';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Card } from 'react-native-paper';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomQuoteDetail'>;

const CustomQuoteDetailScreen = ({ route, navigation }: Props) => {
  const { charge } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [denying, setDenying] = useState(false);

  const onCheckout = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Authentication Error", "You must be logged in to make a payment.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create a payment intent on the server
      const functions = getFunctions();
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      const response = await createPaymentIntent({
        amount: Math.round(charge.totalPrice * 100), // Amount in cents
        currency: 'usd',
        customChargeId: charge.id, // Pass charge ID for linking
      });
      
      const { clientSecret, paymentIntentId } = response.data as { clientSecret: string, paymentIntentId: string };

      // 2. Initialize the Payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Fixd Repair, Inc.",
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
        Alert.alert("Error", initError.message);
        return;
      }

      // 3. Present the Payment sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== 'Canceled') {
          Alert.alert(`Error: ${paymentError.code}`, paymentError.message);
        }
      } else {
        // SUCCESS! Now finalize the order on our backend.
        const markChargeAsPaid = httpsCallable(functions, 'markChargeAsPaid');
        await markChargeAsPaid({
          customChargeId: charge.id,
          paymentIntentId: paymentIntentId,
        });

        Alert.alert(
          "Payment Complete", 
          "Your service has been scheduled! You will now be returned to the home screen.",
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (err: any) {
      console.error("Payment processing error:", err);
      Alert.alert("Error", "An unexpected error occurred during payment.");
    } finally {
      setLoading(false);
    }
  };

  const handleDenyQuote = async () => {
    Alert.alert(
      "Deny Quote",
      "Are you sure you want to deny this quote? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Deny",
          style: "destructive",
          onPress: async () => {
            setDenying(true);
            try {
              const chargeRef = doc(firestore, 'customCharges', charge.id!);
              await updateDoc(chargeRef, {
                status: 'DeclinedByCustomer'
              });
              Alert.alert("Quote Denied", "You have successfully denied the quote.");
              navigation.goBack();
            } catch (err: any) {
              console.error("Error denying quote:", err);
              Alert.alert("Error", "Could not deny the quote. Please try again.");
            } finally {
              setDenying(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color="#FFF" />
        </Pressable>
        <Text style={styles.title}>Review Your Quote</Text>
        <View style={{ width: 28 }} /> 
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.mechanic}>Quote from: {charge.mechanicName}</Text>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.vehicle}>{charge.vehicleDisplay || 'Vehicle Not Specified'}</Text>
            
            {charge.locationDetails && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Service Address</Text>
                <Text style={styles.infoText}>{charge.locationDetails.address}</Text>
                <Text style={styles.infoText}>{`${charge.locationDetails.city}, ${charge.locationDetails.state} ${charge.locationDetails.zipCode}`}</Text>
              </View>
            )}

            {charge.scheduledAt && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Appointment</Text>
                <Text style={styles.infoText}>
                  {charge.scheduledAt.toDate().toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </Text>
                <Text style={styles.infoText}>
                  {charge.scheduledAt.toDate().toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit', hour12: true
                  })}
                </Text>
              </View>
            )}

            <View style={styles.itemsContainer}>
                <Text style={styles.sectionTitle}>Quoted Services</Text>
                {charge.items.map((item, index) => (
                <View key={index} style={styles.item}>
                    <View style={styles.itemDetails}>
                        <Wrench size={18} color="#7A89FF" style={{ marginRight: 8 }} />
                        <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                </View>
                ))}
            </View>

            <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Quote Total</Text>
                <Text style={styles.totalPrice}>${charge.totalPrice.toFixed(2)}</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <ThemedButton
          variant="primary"
          onPress={onCheckout}
          disabled={loading || denying}
          loading={loading}
          icon="check-circle"
          style={styles.actionButtonFlex}
        >
          Approve & Pay
        </ThemedButton>
        <ThemedButton
          variant="danger"
          onPress={handleDenyQuote}
          disabled={loading || denying}
          loading={denying}
          icon="close-circle"
          style={styles.actionButtonFlex}
        >
          Deny Quote
        </ThemedButton>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0F1E' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },
    backButton: {
        padding: 4,
    },
    title: { 
        fontSize: 28, 
        fontFamily: 'Inter_700Bold', 
        color: '#FFF', 
    },
    mechanic: { 
        fontSize: 16, 
        color: '#7A89FF', 
        fontFamily: 'Inter_500Medium',
        textAlign: 'center',
        marginBottom: 24,
    },
    card: { 
        backgroundColor: '#1A2138', 
        borderRadius: 16, 
        padding: 20, 
        borderWidth: 1,
        borderColor: '#2A3555',
    },
    vehicle: { 
        fontSize: 20, 
        fontFamily: 'Inter_600SemiBold', 
        color: '#FFF', 
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2A3555',
    },
    itemsContainer: { 
        marginBottom: 20,
    },
    item: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2A3555',
    },
    itemDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemName: { 
        fontSize: 16, 
        color: '#E0E0E0',
        fontFamily: 'Inter_400Regular',
    },
    itemPrice: { 
        fontSize: 16, 
        color: '#FFF', 
        fontFamily: 'Inter_600SemiBold' 
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    totalLabel: { 
        fontSize: 22, 
        color: '#FFF', 
        fontFamily: 'Inter_700Bold' 
    },
    totalPrice: { 
        fontSize: 22, 
        color: '#00F0FF', 
        fontFamily: 'Inter_700Bold' 
    },
    footer: { 
        padding: 16, 
        borderTopWidth: 1, 
        borderTopColor: '#2A3555',
        backgroundColor: '#1A2138',
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16, 
        borderRadius: 12,
        gap: 10,
    },
    approveButton: {
        backgroundColor: '#00F0FF',
    },
    denyButton: {
        backgroundColor: 'rgba(255, 61, 113, 0.2)',
        borderWidth: 1,
        borderColor: '#FF3D71',
    },
    actionButtonText: {
        fontSize: 16, 
        fontFamily: 'Inter_600SemiBold', 
    },
    approveButtonText: {
        color: '#0A0F1E',
    },
    denyButtonText: {
        color: '#FFD0D0',
    },
    disabledButton: { opacity: 0.5 },
    infoSection: {
      marginBottom: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#2A3555',
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: '#7A89FF',
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    infoText: {
      fontSize: 16,
      fontFamily: 'Inter_400Regular',
      color: '#E0E0E0',
      lineHeight: 24,
    },
});

export default CustomQuoteDetailScreen; 