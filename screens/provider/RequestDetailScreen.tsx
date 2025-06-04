import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { ArrowLeft, Check, X, MessageCircle, Play, Ban } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { firestore, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { RepairOrder } from '@/types/orders';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

type Props = NativeStackScreenProps<ProviderStackParamList, 'RequestDetail'>;

export default function RequestDetailScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setLoading(true);
    const docRef = doc(firestore, 'repairOrders', orderId);

    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() } as RepairOrder);
          setError(null);
        } else {
          setError("Request not found.");
          setOrder(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching request details:", err);
        setError("Failed to load request details.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  const handleAccept = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to accept requests.");
      return;
    }
    if (!order) {
      Alert.alert("Error", "Order data is not available.");
      return;
    }

    setIsUpdating(true);
    const orderDocRef = doc(firestore, 'repairOrders', orderId);
    const providerDocRef = doc(firestore, 'users', currentUser.uid);

    try {
      await updateDoc(orderDocRef, {
        providerId: currentUser.uid,
        providerName: currentUser.displayName || 'Mechanic',
        status: 'Accepted',
        acceptedAt: serverTimestamp()
      });

      await updateDoc(providerDocRef, {
        numberOfAcceptedJobs: increment(1)
      });
      
      Alert.alert("Success", "Request accepted!");
      navigation.goBack();
    } catch (err) {
      console.error("Error accepting request:", err);
      Alert.alert("Error", "Could not accept the request. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecline = async () => {
    console.log("handleDecline called. isUpdating:", isUpdating, "Order exists:", !!order);
    if (!isUpdating && order) { 
      setIsUpdating(true);
      console.log("Attempting to decline order:", orderId);
      const docRef = doc(firestore, 'repairOrders', orderId);
      try {
        await updateDoc(docRef, {
          status: 'Cancelled'
        });
        console.log("Order status updated to Cancelled in Firestore.");
        navigation.goBack();
      } catch (err) {
        console.error("Firestore Error declining request:", err);
        Alert.alert("Error", "Could not decline the request. Please try again.");
        setIsUpdating(false);
      }
    } else {
      console.log("Decline condition not met (already updating or order is null).");
    }
  };

  const handleContact = () => {
    if (order) {
       navigation.navigate('RequestContact', { orderId: order.id });
    }
  };

  const handleStartService = () => {
    if (order) {
      navigation.navigate('RequestStart', { orderId: order.id });
    }
  };

  const handleCancelService = async () => {
    if (!order) {
      Alert.alert("Error", "Order data is not available.");
      return;
    }
    if (isUpdating) return; 

    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this service? This cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setIsUpdating(true);
            const docRef = doc(firestore, 'repairOrders', order.id);
            try {
              await updateDoc(docRef, {
                status: 'Cancelled',
                cancelledAt: serverTimestamp(),
              });
              console.log("Order status updated to Cancelled in Firestore.");
              navigation.goBack();
            } catch (err) {
              console.error("Firestore Error cancelling service:", err);
              Alert.alert("Error", "Could not cancel the service. Please try again.");
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#00F0FF" />
        <Text style={styles.loadingText}>Loading Details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top']}>
        <View style={styles.header_basic}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton_basic}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle_basic}>Error</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centeredContent}>
          <Text style={styles.errorText}>{error || "Order data could not be loaded."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.mainContentArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Service Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service:</Text>
              <Text style={styles.detailValue}>{order.items[0]?.name || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date Requested:</Text>
              <Text style={styles.detailValue}>{order.createdAt?.toDate() ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Price:</Text>
              <Text style={styles.detailValue}>${order.totalPrice?.toFixed(2) ?? 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle:</Text>
              <Text style={styles.detailValue}>{order.items[0]?.vehicleDisplay || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Customer & Location</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer ID:</Text>
              <Text style={styles.detailValue}>{order.customerId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>
                {`${order.locationDetails.address}, ${order.locationDetails.city}, ${order.locationDetails.state} ${order.locationDetails.zipCode}`}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{order.locationDetails.phoneNumber}</Text>
            </View>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.description}>{order.locationDetails.additionalNotes || 'No additional notes provided.'}</Text>
          </View>
        </ScrollView>
        
        <View style={[styles.actionButtonsContainer, { paddingBottom: insets.bottom + 12 }]}>
          {order.status === 'Pending' && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.contactButton]} 
                onPress={handleContact} 
                disabled={isUpdating}
              >
                <MessageCircle size={20} color="#7A89FF" />
                <Text style={styles.contactButtonText}>Contact</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.declineButton]} 
                onPress={handleDecline} 
                disabled={isUpdating}
              >
                <X size={20} color="#FF3D71" />
                <Text style={styles.declineButtonText}>{isUpdating ? 'Declining...' : 'Decline'}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.acceptButton]} 
                onPress={handleAccept} 
                disabled={isUpdating}
              >
                <Check size={20} color="#0A0F1E" />
                <Text style={styles.acceptButtonText}>{isUpdating ? 'Accepting...' : 'Accept'}</Text>
              </TouchableOpacity>
            </>
          )}

          {(order.status === 'Accepted' || order.status === 'InProgress') && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.contactButton]}
                onPress={handleContact}
                 disabled={isUpdating}
              >
                <MessageCircle size={20} color="#7A89FF" />
                <Text style={styles.contactButtonText}>Contact</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelServiceButton]} 
                onPress={handleCancelService}
                disabled={isUpdating} 
              >
                <Ban size={20} color="#FF3D71" />
                <Text style={styles.cancelServiceButtonText}>Cancel Service</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.startServiceButton]} 
                onPress={handleStartService}
                disabled={isUpdating} 
              >
                <Play size={20} color="#0A0F1E" />
                <Text style={styles.startServiceButtonText}>Start Service</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View> 
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0F1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#00F0FF',
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    color: '#FF3D71',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  header_basic: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  backButton_basic: {
    padding: 4,
  },
  headerTitle_basic: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
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
    backgroundColor: '#0A0F1E',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  mainContentArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#121827',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginRight: 8,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#E0EFFF',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    color: '#E0EFFF',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#121827',
    borderTopColor: '#2A3555',
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    minHeight: 44,
    gap: 6,
  },
  contactButton: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderColor: '#7A89FF',
  },
  contactButtonText: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  declineButton: {
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    borderColor: '#FF3D71',
  },
  declineButtonText: {
    color: '#FF3D71',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  acceptButton: {
    backgroundColor: '#00F0FF',
    borderColor: '#00F0FF',
  },
  acceptButtonText: {
    color: '#0A0F1E',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  cancelServiceButton: {
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    borderColor: '#FF3D71',
  },
  cancelServiceButtonText: {
    color: '#FF3D71',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  startServiceButton: {
    backgroundColor: '#00F0FF',
    borderColor: '#00F0FF',
  },
  startServiceButtonText: {
    color: '#0A0F1E',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
}); 