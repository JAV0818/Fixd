import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Circle, Loader, User, MapPin, Wrench } from 'lucide-react-native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '@/navigation/ProviderNavigator';
import { RepairOrder } from '@/types/orders';
import { auth, firestore } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { CommonActions } from '@react-navigation/native';
import { ProviderTabParamList } from '@/navigation/ProviderTabNavigator';
import { useReview } from '@/contexts/ReviewContext';

type Props = NativeStackScreenProps<ProviderStackParamList, 'UpdateStatus'>;

// Define possible statuses with descriptions
type StatusValue = 'Accepted' | 'InProgress' | 'Completed' | 'Cancelled';

const STATUS_OPTIONS: Array<{
  value: StatusValue;
  label: string;
  description: string;
  canUpdateTo: StatusValue[];
}> = [
  {
    value: 'Accepted',
    label: 'Accepted',
    description: 'Order has been accepted and is scheduled',
    canUpdateTo: ['InProgress', 'Cancelled']
  },
  {
    value: 'InProgress',
    label: 'In Progress',
    description: 'Service is currently being performed',
    canUpdateTo: ['Completed', 'Cancelled']
  },
  {
    value: 'Completed',
    label: 'Completed',
    description: 'Service has been completed successfully',
    canUpdateTo: []
  },
  {
    value: 'Cancelled',
    label: 'Cancelled',
    description: 'Order has been cancelled',
    canUpdateTo: []
  }
];

interface OrderDetails {
  id: string;
  customerName?: string;
  status: RepairOrder['status'];
  serviceName?: string;
  locationAddress?: string;
  createdAt?: any;
}

export default function UpdateStatusScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const { showReviewForOrder } = useReview();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<RepairOrder['status'] | null>(null);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const orderRef = doc(firestore, 'repair-orders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        setError("Order not found.");
        return;
      }

      const orderData = orderSnap.data() as RepairOrder;
      
      // Verify that this order belongs to the current provider
      if (orderData.providerId !== auth.currentUser?.uid) {
        setError("You don't have permission to update this order.");
        return;
      }

      // Fetch customer details if available
      let customerName = 'Unknown Customer';
      if (orderData.customerId) {
        try {
          const customerRef = doc(firestore, 'users', orderData.customerId);
          const customerSnap = await getDoc(customerRef);
          if (customerSnap.exists()) {
            const customerData = customerSnap.data();
            customerName = `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
          }
        } catch (customerError) {
          console.warn("Could not fetch customer details:", customerError);
        }
      }

      const details: OrderDetails = {
        id: orderId,
        customerName,
        status: orderData.status,
        serviceName: orderData.items?.[0]?.name || 'Service',
        locationAddress: orderData.locationDetails?.address || 'Address not specified',
        createdAt: orderData.createdAt
      };

      setOrderDetails(details);
      setSelectedStatus(orderData.status);
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableStatuses = () => {
    if (!orderDetails) return [];
    
    const currentOption = STATUS_OPTIONS.find(option => option.value === orderDetails.status);
    if (!currentOption) return STATUS_OPTIONS;
    
    // Return current status + statuses it can transition to
    const availableValues = [currentOption.value, ...currentOption.canUpdateTo];
    return STATUS_OPTIONS.filter(option => availableValues.includes(option.value));
  };

  const validateStatusTransition = (fromStatus: RepairOrder['status'], toStatus: RepairOrder['status']): boolean => {
    if (fromStatus === toStatus) return true;
    
    const currentOption = STATUS_OPTIONS.find(option => option.value === fromStatus);
    return currentOption ? currentOption.canUpdateTo.includes(toStatus as StatusValue) : false;
  };

  const handleUpdateStatus = async () => {
    if (!orderDetails || !selectedStatus) return;
    
    if (selectedStatus === orderDetails.status) {
      Alert.alert("No Change", "The status has not been changed.");
      return;
    }

    if (!validateStatusTransition(orderDetails.status, selectedStatus)) {
      Alert.alert(
        "Invalid Status Change", 
        `Cannot change status from ${orderDetails.status} to ${selectedStatus}.`
      );
      return;
    }

    // Show confirmation for certain status changes
    if (selectedStatus === 'Cancelled') {
      Alert.alert(
        "Confirm Cancellation",
        "Are you sure you want to cancel this order? This action cannot be undone.",
        [
          { text: "No", style: "cancel" },
          { text: "Yes, Cancel", style: "destructive", onPress: () => performStatusUpdate() }
        ]
      );
      return;
    }

    if (selectedStatus === 'Completed') {
      Alert.alert(
        "Confirm Completion",
        "Are you sure you want to mark this service as completed?",
        [
          { text: "No", style: "cancel" },
          { text: "Yes, Complete", onPress: () => performStatusUpdate() }
        ]
      );
      return;
    }

    performStatusUpdate();
  };

  const performStatusUpdate = async () => {
    if (!orderDetails || !selectedStatus) return;

    setUpdating(true);
    try {
      const orderRef = doc(firestore, 'repair-orders', orderId);
      const updateData: any = {
        status: selectedStatus,
        updatedAt: serverTimestamp()
      };

      // Add specific timestamps for certain status changes
      if (selectedStatus === 'InProgress' && orderDetails.status !== 'InProgress') {
        updateData.startedAt = serverTimestamp();
      } else if (selectedStatus === 'Completed' && orderDetails.status !== 'Completed') {
        updateData.completedAt = serverTimestamp();
        
        // Update provider's job completion count
        if (auth.currentUser) {
          const providerRef = doc(firestore, 'users', auth.currentUser.uid);
          await updateDoc(providerRef, {
            numberOfJobsCompleted: increment(1)
          });
        }
      } else if (selectedStatus === 'Cancelled' && orderDetails.status !== 'Cancelled') {
        updateData.cancelledAt = serverTimestamp();
      }

      await updateDoc(orderRef, updateData);

      // If status changed to Completed, get updated order and show review modal
      if (selectedStatus === 'Completed' && orderDetails.status !== 'Completed') {
        const updatedOrderDoc = await getDoc(orderRef);
        const updatedOrder = { id: orderId, ...updatedOrderDoc.data() } as RepairOrder;
        
        Alert.alert(
          "Status Updated", 
          `Order status has been changed to ${selectedStatus}.`,
          [
            {
              text: "OK",
              onPress: () => {
                // Reset navigation
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'ProviderApp' }],
                  })
                );
                // Show review modal after navigation
                setTimeout(() => {
                  showReviewForOrder(updatedOrder, 'provider');
                }, 500);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          "Status Updated", 
          `Order status has been changed to ${selectedStatus}.`,
          [
            {
              text: "OK",
              onPress: () => {
                if (selectedStatus === 'Cancelled') {
                  // Reset the ProviderNavigator stack (associated with 'Requests' tab) to its initial route
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                    routes: [{ name: 'Requests' }], // 'Requests' is initial route of ProviderNavigator
                  })
                );
                // Navigate to the 'RepairOrders' tab in the parent TabNavigator
                const tabNavigator = navigation.getParent<NativeStackNavigationProp<ProviderTabParamList>>();
                tabNavigator?.navigate('RepairOrders');
              } else {
                navigation.goBack();
              }
            }
          }
        ]
      );

      // Update local state
      setOrderDetails(prev => prev ? { ...prev, status: selectedStatus } : null);

    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert("Error", "Failed to update order status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#00F0FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>UPDATE STATUS</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#00F0FF" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !orderDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#00F0FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>UPDATE STATUS</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error || "Order details not available."}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const availableStatuses = getAvailableStatuses();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>UPDATE STATUS</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Order Summary */}
        <View style={styles.orderSummary}>
          <Text style={styles.summaryTitle}>ORDER DETAILS</Text>
          <View style={styles.summaryRow}>
            <User size={16} color="#7A89FF" />
            <Text style={styles.summaryText}>{orderDetails.customerName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Wrench size={16} color="#7A89FF" />
            <Text style={styles.summaryText}>{orderDetails.serviceName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <MapPin size={16} color="#7A89FF" />
            <Text style={styles.summaryText}>{orderDetails.locationAddress}</Text>
          </View>
        </View>

        {/* Current Status */}
        <View style={styles.currentStatusContainer}>
          <Text style={styles.currentStatusLabel}>CURRENT STATUS</Text>
          <Text style={styles.currentStatusValue}>{orderDetails.status.toUpperCase()}</Text>
        </View>

        {/* Status Options */}
        <Text style={styles.selectTitle}>SELECT NEW STATUS</Text>
        <View style={styles.statusOptionsContainer}>
          {availableStatuses.map((statusOption) => (
            <TouchableOpacity 
              key={statusOption.value} 
              style={styles.statusOption}
              onPress={() => setSelectedStatus(statusOption.value)}
              disabled={updating}
            >
              {selectedStatus === statusOption.value ? (
                <CheckCircle size={20} color="#00F0FF" />
              ) : (
                <Circle size={20} color="#7A89FF" />
              )}
              <View style={styles.statusContent}>
                <Text 
                  style={[
                    styles.statusLabel,
                    selectedStatus === statusOption.value && styles.selectedStatusLabel
                  ]}
                >
                  {statusOption.label.toUpperCase()}
                </Text>
                <Text style={styles.statusDescription}>{statusOption.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Update Button */}
        <TouchableOpacity 
          style={[
            styles.updateButton, 
            (selectedStatus === orderDetails.status || updating) && styles.disabledButton
          ]} 
          onPress={handleUpdateStatus}
          disabled={selectedStatus === orderDetails.status || updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#0A0F1E" />
          ) : (
            <Text style={styles.updateButtonText}>UPDATE STATUS</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  orderSummary: {
    backgroundColor: 'rgba(26, 33, 56, 1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 1,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  currentStatusContainer: {
    backgroundColor: 'rgba(26, 33, 56, 1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  currentStatusLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  currentStatusValue: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
  },
  selectTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 1,
  },
  statusOptionsContainer: {
    backgroundColor: 'rgba(26, 33, 56, 1)',
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 32,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  statusContent: {
    flex: 1,
    marginLeft: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  selectedStatusLabel: {
    color: '#00F0FF',
  },
  statusDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    opacity: 0.7,
    lineHeight: 16,
  },
  updateButton: {
    backgroundColor: '#00F0FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  updateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0A0F1E',
    letterSpacing: 1,
  },
  disabledButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.5)',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#FF3D71',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#00F0FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#0A0F1E',
  },
}); 