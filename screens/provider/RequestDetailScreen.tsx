import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { ArrowLeft, Check, X, MessageCircle, Play, Ban, CalendarClock, UserCircle } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { firestore, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, increment, getDoc } from 'firebase/firestore';
import { RepairOrder } from '@/types/orders';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { colors } from '@/styles/theme';

type Props = NativeStackScreenProps<ProviderStackParamList, 'RequestDetail'>;

export default function RequestDetailScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [customerDisplayName, setCustomerDisplayName] = useState<string>('Anonymous User');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setLoading(true);
    const docRef = doc(firestore, 'repair-orders', orderId);

    const unsubscribe = onSnapshot(docRef, 
      async (docSnap) => {
        if (docSnap.exists()) {
          const orderData = { id: docSnap.id, ...docSnap.data() } as RepairOrder;
          setOrder(orderData);
          setError(null);

          if (orderData.customerId) {
            try {
              const userDocRef = doc(firestore, 'users', orderData.customerId);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const firstName = userData.firstName;
                const lastName = userData.lastName;
                if (firstName && lastName) {
                  setCustomerDisplayName(`${firstName} ${lastName}`);
                } else if (orderData.customerName) {
                  setCustomerDisplayName(orderData.customerName);
                } else {
                  setCustomerDisplayName('Anonymous User');
                }
              } else {
                setCustomerDisplayName(orderData.customerName || 'Anonymous User');
                console.log("Customer user document not found, using order.customerName or default.");
              }
            } catch (userError) {
              console.error("Error fetching customer details:", userError);
              setCustomerDisplayName(orderData.customerName || 'Anonymous User');
            }
          } else {
            setCustomerDisplayName(orderData.customerName || 'Anonymous User');
          }

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
    const orderDocRef = doc(firestore, 'repair-orders', orderId);
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
      const docRef = doc(firestore, 'repair-orders', orderId);
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
            const docRef = doc(firestore, 'repair-orders', order.id);
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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top']}>
        <View style={styles.header_basic}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton_basic}>
            <ArrowLeft size={24} color={colors.textPrimary} />
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

  const getScheduleDateTime = () => {
    if (order.startedAt && typeof order.startedAt.toDate === 'function') {
      return { label: "Service Started:", dateTime: `${order.startedAt.toDate().toLocaleDateString()} ${order.startedAt.toDate().toLocaleTimeString()}` };
    } else if (order.acceptedAt && typeof order.acceptedAt.toDate === 'function') {
      return { label: "Service Accepted:", dateTime: `${order.acceptedAt.toDate().toLocaleDateString()} ${order.acceptedAt.toDate().toLocaleTimeString()}` };
    } else if (order.createdAt && typeof order.createdAt.toDate === 'function') {
      return { label: "Date Requested:", dateTime: `${order.createdAt.toDate().toLocaleDateString()} ${order.createdAt.toDate().toLocaleTimeString()}` };
    }
    return { label: "Schedule:", dateTime: 'N/A' };
  };

  const scheduleInfo = getScheduleDateTime();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        <View style={{ width: 40 }} />
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
              <Text style={styles.detailLabel}>{scheduleInfo.label}</Text>
              <Text style={styles.detailValue}>{scheduleInfo.dateTime}</Text>
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
              <Text style={styles.detailLabel}>Customer:</Text>
              <Text style={styles.detailValue}>{customerDisplayName}</Text>
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
                <MessageCircle size={20} color={colors.primary} />
                <Text style={styles.contactButtonText}>Contact</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.declineButton]} 
                onPress={handleDecline} 
                disabled={isUpdating}
              >
                <X size={20} color={colors.danger} />
                <Text style={styles.declineButtonText}>{isUpdating ? 'Declining...' : 'Decline'}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.acceptButton]} 
                onPress={handleAccept} 
                disabled={isUpdating}
              >
                <Check size={20} color="#FFFFFF" />
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
                <MessageCircle size={20} color={colors.primary} />
                <Text style={styles.contactButtonText}>Contact</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelServiceButton]} 
                onPress={handleCancelService}
                disabled={isUpdating} 
              >
                <Ban size={20} color={colors.danger} />
                <Text style={styles.cancelServiceButtonText}>Cancel Service</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.startServiceButton]} 
                onPress={handleStartService}
                disabled={isUpdating} 
              >
                <Play size={20} color="#FFFFFF" />
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
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.primary,
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    color: colors.danger,
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
    borderBottomColor: colors.border,
  },
  backButton_basic: {
    padding: 4,
  },
  headerTitle_basic: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.textTertiary,
    marginRight: 8,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    minHeight: 44,
    gap: 6,
  },
  contactButton: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  contactButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  declineButton: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  declineButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  cancelServiceButton: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  cancelServiceButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  startServiceButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  startServiceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
}); 