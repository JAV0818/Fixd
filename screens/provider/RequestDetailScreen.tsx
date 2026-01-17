import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Check, X, MessageCircle, Play, Ban, Clock, Lock } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { firestore, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, increment, getDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { RepairOrder } from '@/types/orders';
import { colors } from '@/styles/theme';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Card } from 'react-native-paper';

type Props = NativeStackScreenProps<any, 'RequestDetail'>;

const CLAIM_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_CLAIMS_PER_PROVIDER = 2;

export default function RequestDetailScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [customerDisplayName, setCustomerDisplayName] = useState<string>('Anonymous User');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [claimExpired, setClaimExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();
  
  const currentUser = auth.currentUser;
  const isMyClaimedOrder = order?.status === 'Claimed' && order?.providerId === currentUser?.uid;
  const isClaimedByOther = order?.status === 'Claimed' && order?.providerId !== currentUser?.uid;
  const isPending = order?.status === 'Pending';
  const isAccepted = order?.status === 'Accepted';
  const isInProgress = order?.status === 'InProgress';

  // Timer effect for claimed orders
  useEffect(() => {
    if (isMyClaimedOrder && order?.claimExpiresAt) {
      const updateTimer = () => {
        const expiresAt = order.claimExpiresAt?.toDate?.() || new Date(order.claimExpiresAt as any);
        const now = new Date();
        const diff = expiresAt.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeRemaining('Expired');
          setClaimExpired(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }
        
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        setClaimExpired(false);
      };
      
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isMyClaimedOrder, order?.claimExpiresAt]);

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

  // Check how many orders this provider has claimed
  const checkClaimLimit = async (): Promise<boolean> => {
    if (!currentUser) return false;
    
    const claimedQuery = query(
      collection(firestore, 'repair-orders'),
      where('providerId', '==', currentUser.uid),
      where('status', '==', 'Claimed')
    );
    
    const snapshot = await getDocs(claimedQuery);
    return snapshot.size < MAX_CLAIMS_PER_PROVIDER;
  };

  const handleClaimOrder = async () => {
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to claim orders.");
      return;
    }
    if (!order) {
      Alert.alert("Error", "Order data is not available.");
      return;
    }

    setIsUpdating(true);
    
    try {
      // Check claim limit
      const canClaim = await checkClaimLimit();
      if (!canClaim) {
        Alert.alert(
          "Claim Limit Reached", 
          `You can only claim up to ${MAX_CLAIMS_PER_PROVIDER} orders at a time. Please accept or release your current claims first.`
        );
        setIsUpdating(false);
        return;
      }

      const orderDocRef = doc(firestore, 'repair-orders', orderId);
      const claimExpiresAt = Timestamp.fromDate(new Date(Date.now() + CLAIM_DURATION_MS));
      
      // Get provider name from user doc
      const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      const providerName = userDoc.exists() 
        ? `${userDoc.data().firstName || ''} ${userDoc.data().lastName || ''}`.trim() || 'Mechanic'
        : currentUser.displayName || 'Mechanic';
      
      console.log('Attempting to claim order:', orderId);
      console.log('Current user:', currentUser.uid);
      console.log('Setting status to Claimed, providerId to:', currentUser.uid);
      
      await updateDoc(orderDocRef, {
        providerId: currentUser.uid,
        providerName,
        status: 'Claimed',
        claimedAt: serverTimestamp(),
        claimExpiresAt,
      });
      
      console.log('Order claimed successfully!');
      Alert.alert("Order Claimed", "You have 1 hour to chat with the customer and decide. You can accept or release the order anytime.");
    } catch (err) {
      console.error("Error claiming order:", err);
      Alert.alert("Error", "Could not claim the order. It may have been claimed by another mechanic.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReleaseClaim = async () => {
    if (!order) return;

    Alert.alert(
      "Release Order",
      "Are you sure you want to release this order? It will be available for other mechanics to claim.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Release",
          style: "destructive",
          onPress: async () => {
            setIsUpdating(true);
            try {
              const orderDocRef = doc(firestore, 'repair-orders', orderId);
              await updateDoc(orderDocRef, {
                providerId: null,
                providerName: null,
                status: 'Pending',
                claimedAt: null,
                claimExpiresAt: null,
              });
              Alert.alert("Released", "The order is now available for other mechanics.");
              navigation.goBack();
            } catch (err) {
              console.error("Error releasing claim:", err);
              Alert.alert("Error", "Could not release the order. Please try again.");
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleAccept = async () => {
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to accept requests.");
      return;
    }
    if (!order) {
      Alert.alert("Error", "Order data is not available.");
      return;
    }

    // Only allow accepting if you have claimed the order
    if (order.status === 'Claimed' && order.providerId !== currentUser.uid) {
      Alert.alert("Error", "You must claim this order first before accepting.");
      return;
    }

    setIsUpdating(true);
    const orderDocRef = doc(firestore, 'repair-orders', orderId);
    const providerDocRef = doc(firestore, 'users', currentUser.uid);

    try {
      await updateDoc(orderDocRef, {
        status: 'Accepted',
        acceptedAt: serverTimestamp(),
        claimedAt: null, // Clear claim fields
        claimExpiresAt: null,
      });

      await updateDoc(providerDocRef, {
        numberOfAcceptedJobs: increment(1)
      });
      
      Alert.alert("Success", "Request accepted! You're now committed to this job.");
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
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Service Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service:</Text>
                <Text style={styles.detailValue}>
                  {(order as any).categories?.join(', ') || order.items?.[0]?.name || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{scheduleInfo.label}</Text>
                <Text style={styles.detailValue}>{scheduleInfo.dateTime}</Text>
              </View>
              {order.totalPrice != null && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Price:</Text>
                  <Text style={styles.detailValue}>${order.totalPrice?.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vehicle:</Text>
                <Text style={styles.detailValue}>
                  {(order as any).vehicleInfo || order.items?.[0]?.vehicleDisplay || 'N/A'}
                </Text>
              </View>
            </Card.Content>
          </Card>
          
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Customer & Location</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer:</Text>
                <Text style={styles.detailValue}>{customerDisplayName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>
                  {order.locationDetails?.address || 
                    (order.locationDetails?.city 
                      ? `${order.locationDetails.address || ''}, ${order.locationDetails.city}, ${order.locationDetails.state} ${order.locationDetails.zipCode || ''}`.trim()
                      : 'Address not provided')}
                </Text>
              </View>
              {order.locationDetails?.phoneNumber && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{order.locationDetails.phoneNumber}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
          
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>
                {(order as any).description || order.locationDetails?.additionalNotes || 'No description provided.'}
              </Text>
            </Card.Content>
          </Card>
        </ScrollView>
        
        {/* Timer Banner for Claimed Orders */}
        {isMyClaimedOrder && (
          <View style={styles.timerBanner}>
            <Clock size={18} color={claimExpired ? colors.danger : colors.warning} />
            <Text style={[styles.timerText, claimExpired && styles.timerExpired]}>
              {claimExpired ? 'Claim Expired' : `Time Remaining: ${timeRemaining}`}
            </Text>
          </View>
        )}

        {/* Claimed by Another Mechanic Banner */}
        {isClaimedByOther && (
          <View style={styles.claimedBanner}>
            <Lock size={18} color={colors.textTertiary} />
            <Text style={styles.claimedText}>
              Being reviewed by another mechanic
            </Text>
          </View>
        )}

        <View style={[styles.actionButtonsContainer, { paddingBottom: insets.bottom + 12 }]}>
          {/* PENDING: Show Claim button */}
          {isPending && (
            <ThemedButton
              variant="primary"
              onPress={handleClaimOrder}
              disabled={isUpdating}
              loading={isUpdating}
              icon="lock"
              style={styles.actionButtonFlex}
            >
              {isUpdating ? 'Claiming...' : 'Claim Order'}
            </ThemedButton>
          )}

          {/* CLAIMED BY ME: Show Chat, Release, Accept */}
          {isMyClaimedOrder && !claimExpired && (
            <>
              <ThemedButton
                variant="outlined"
                onPress={handleContact}
                disabled={isUpdating}
                icon="message"
                style={styles.actionButtonFlex}
              >
                Chat
              </ThemedButton>
              
              <ThemedButton
                variant="outlined"
                onPress={handleReleaseClaim}
                disabled={isUpdating}
                icon="close"
                style={styles.actionButtonFlex}
              >
                Release
              </ThemedButton>

              <ThemedButton
                variant="primary"
                onPress={handleAccept}
                disabled={isUpdating}
                loading={isUpdating}
                icon="check"
                style={styles.actionButtonFlex}
              >
                {isUpdating ? 'Accepting...' : 'Accept'}
              </ThemedButton>
            </>
          )}

          {/* CLAIMED BY ME BUT EXPIRED: Show Release only */}
          {isMyClaimedOrder && claimExpired && (
            <ThemedButton
              variant="outlined"
              onPress={handleReleaseClaim}
              disabled={isUpdating}
              icon="close"
              style={styles.actionButtonFlex}
            >
              Release Expired Claim
            </ThemedButton>
          )}

          {/* CLAIMED BY ANOTHER: Show nothing actionable */}
          {isClaimedByOther && (
            <View style={styles.unavailableContainer}>
              <Text style={styles.unavailableText}>
                This order is currently being reviewed. Check back later.
              </Text>
            </View>
          )}

          {/* ACCEPTED or IN PROGRESS: Show service actions */}
          {(isAccepted || isInProgress) && (
            <>
              <ThemedButton
                variant="outlined"
                onPress={handleContact}
                disabled={isUpdating}
                icon="message"
                style={styles.actionButtonFlex}
              >
                Contact
              </ThemedButton>

              <ThemedButton
                variant="danger"
                onPress={handleCancelService}
                disabled={isUpdating}
                icon="ban"
                style={styles.actionButtonFlex}
              >
                Cancel
              </ThemedButton>

              <ThemedButton
                variant="primary"
                onPress={handleStartService}
                disabled={isUpdating}
                icon="play"
                style={styles.actionButtonFlex}
              >
                {isInProgress ? 'Continue' : 'Start'}
              </ThemedButton>
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
  actionButtonFlex: {
    flex: 1,
    marginHorizontal: 4,
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
  // Claim system styles
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warningLight || '#FFF8E1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning || '#FFA000',
  },
  timerText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.warning || '#FFA000',
  },
  timerExpired: {
    color: colors.danger,
  },
  claimedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  claimedText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textTertiary,
  },
  claimButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  releaseButton: {
    backgroundColor: colors.warningLight || '#FFF8E1',
    borderColor: colors.warning || '#FFA000',
  },
  releaseButtonText: {
    color: colors.warning || '#FFA000',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  unavailableContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  unavailableText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textTertiary,
    textAlign: 'center',
  },
}); 