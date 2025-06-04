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
import { firestore } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CustomCharge } from '../../types/customCharges'; // Adjust path if needed
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react-native';

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
      setCharge(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date() } : null); // Update local state
      Alert.alert("Success", `Charge has been ${newStatus === 'ApprovedAndPendingPayment' ? 'approved' : 'declined'}.`);
      // Navigate or update UI further based on newStatus
      if (newStatus === 'ApprovedAndPendingPayment') {
        // TODO: Navigate to payment flow or show payment button
        console.log("Charge approved, ready for payment flow.");
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
              onPress={() => handleUpdateStatus('ApprovedAndPendingPayment')} 
              disabled={isUpdating}
            >
              {isUpdating ? <ActivityIndicator color="#FFFFFF"/> : <CheckCircle size={20} color="#FFFFFF" style={{marginRight: 8}} />}
              <Text style={styles.actionButtonText}>Approve & Proceed</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.declineButton]} 
              onPress={() => handleUpdateStatus('DeclinedByCustomer')} 
              disabled={isUpdating}
            >
              {isUpdating ? <ActivityIndicator color="#FFFFFF"/> : <XCircle size={20} color="#FFFFFF" style={{marginRight: 8}} />}
              <Text style={styles.actionButtonText}>Decline Quote</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Add logic here for payment if status is ApprovedAndPendingPayment */}
         {charge.status === 'ApprovedAndPendingPayment' && (
            <View style={styles.actionsContainer}> 
                <TouchableOpacity style={[styles.actionButton, styles.payButton]} onPress={() => Alert.alert("Pay Now", "Payment flow to be implemented.")}>
                    <Text style={styles.actionButtonText}>Pay Now (${charge.price.toFixed(2)})</Text>
                </TouchableOpacity>
            </View>
        )}

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
}); 