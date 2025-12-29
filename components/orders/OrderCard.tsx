import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { MapPin, Clock, Check, ChevronRight, MessageCircle, AlertCircle } from 'lucide-react-native';
import ProgressBar from '@/components/ui/ProgressBar';
import { firestore } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { colors } from '@/styles/theme';

// Define the type for order items - align with Firestore data
export type OrderStatus = 'Pending' | 'Scheduled' | 'Waiting' | 'In Progress' | 'InProgress' | 'Completed' | 'Cancelled' | 'Denied' | 'Accepted' | 'PendingApproval';

// Represents a single item within an order
export type OrderItemDetail = {
  id: string; // Service ID
  name: string;
  price: number;
  quantity: number;
  vehicleId?: string | null; // Allow both null and undefined
  vehicleDisplay?: string | null;
};

// Represents the overall order document
export type Order = {
  id: string; // Firestore document ID
  items: OrderItemDetail[]; // Array of items in the order
  totalPrice: number;
  status: OrderStatus;
  createdAt: any; // Firestore Timestamp (or convert to Date)
  customerId: string; // Keep track of the customer
  locationDetails: {
      address: string;
  };
  providerId?: string | null; // Optional provider ID
  providerName?: string | null; // Added providerName
  // Add other potential fields like providerName, scheduledDateTime if needed later
};

interface OrderCardProps {
  order: Order;
  onViewDetails: (orderId: string) => void;
  onChatPress: (orderId: string, providerName?: string) => void; // Pass provider name for chat
}

// Glowing border component
const GlowingBorder = () => {
  const pulseAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    const startPulseAnimation = () => {
      Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false, // We need to animate border colors
        })
      ).start();
    };
    
    startPulseAnimation();
    
    return () => {
      pulseAnim.stopAnimation();
    };
  }, []);
  
  const borderColorAnim = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgba(91, 87, 245, 0.4)', 'rgba(91, 87, 245, 0.8)', 'rgba(91, 87, 245, 0.4)'],
  });
  
  const shadowOpacityAnim = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.4, 0.2],
  });
  
  return (
    <Animated.View 
      style={[
        styles.glowingBorder,
        {
          borderColor: borderColorAnim,
          shadowOpacity: shadowOpacityAnim,
        }
      ]}
    />
  );
};

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewDetails, onChatPress }) => {
  const [displayedProviderName, setDisplayedProviderName] = useState<string | null | undefined>(order.providerName);
  const [isFetchingName, setIsFetchingName] = useState<boolean>(false);

  useEffect(() => {
    if (order.providerId && !order.providerName && !displayedProviderName) {
      setIsFetchingName(true);
      const fetchProviderName = async () => {
        try {
          const providerDocRef = doc(firestore, 'users', order.providerId!);
          const providerDoc = await getDoc(providerDocRef);
          if (providerDoc.exists()) {
            const pData = providerDoc.data();
            setDisplayedProviderName(pData?.displayName || pData?.firstName || 'Mechanic');
          } else {
            setDisplayedProviderName('Mechanic (Not Found)');
          }
        } catch (e) {
          console.error(`Error fetching provider name for order ${order.id}:`, e);
          setDisplayedProviderName('Mechanic (Error)');
        }
        setIsFetchingName(false);
      };
      fetchProviderName();
    } else if (order.providerName && order.providerName !== displayedProviderName) {
      // If order.providerName is provided later (e.g. parent re-fetches), update displayed name
      setDisplayedProviderName(order.providerName);
    }
  }, [order.providerId, order.providerName, displayedProviderName]); // Re-run if providerId or order.providerName changes

  // Determine the primary service name (e.g., first item or a summary)
  const primaryServiceName = order.items.length > 0 ? order.items[0].name : 'Order';
  const serviceCount = order.items.length;

  const isActive = order.status === 'In Progress';
  const isPending = order.status === 'Pending' || order.status === 'Scheduled' || order.status === 'Waiting';
  const isCompleted = order.status === 'Completed';
  const isCancelled = order.status === 'Cancelled';

  // Format Date/Time from Timestamp
  const createdDate = order.createdAt?.toDate ? order.createdAt.toDate() : null; // Handle potential null or non-timestamp
  const formattedDate = createdDate?.toLocaleDateString() || 'N/A';
  const formattedTime = createdDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'N/A';

  // Determine status badge style and text
  const getStatusStyle = () => {
    switch (order.status) {
      case 'In Progress':
      case 'InProgress': // Also handle the legacy status without a space
        return { badge: styles.activeStatusBadge, text: styles.activeStatusText, label: 'In Progress' };
      case 'Accepted':
        return { badge: styles.acceptedStatusBadge, text: styles.acceptedStatusText, label: 'Accepted' };
      case 'Pending':
      case 'Scheduled':
      case 'Waiting':
        return { badge: styles.pendingStatusBadge, text: styles.pendingStatusText, label: order.status };
      case 'Completed':
        return { badge: styles.completedStatusBadge, text: styles.completedStatusText, label: 'Completed' };
      case 'Cancelled':
        return { badge: styles.cancelledStatusBadge, text: styles.cancelledStatusText, label: 'Cancelled' };
      case 'Denied':
        return { badge: styles.cancelledStatusBadge, text: styles.cancelledStatusText, label: 'Denied' };
      default:
        return { badge: {}, text: {}, label: order.status };
    }
  };
  const statusStyle = getStatusStyle();

  // Calculate progress based on estimated arrival time
  const getEstimatedProgress = (estimatedArrival: string) => {
    // Parse the estimated time (e.g., "15 mins" -> 15)
    const timeMatch = estimatedArrival.match(/(\d+)/);
    if (!timeMatch) return 0.5; // Default to 50% if can't parse
    
    const minutes = parseInt(timeMatch[0], 10);
    // Scale the progress: closer to arrival = higher progress
    // Assuming max wait time is 60 mins
    const MAX_WAIT_TIME = 60;
    const remainingTime = Math.min(minutes, MAX_WAIT_TIME);
    // Invert the progress (less time = more progress)
    return 1 - (remainingTime / MAX_WAIT_TIME);
  };

  // Determine chat button availability and text
  const canChat = isActive || isCompleted; // Allow chat for active and completed
  const chatButtonText = isActive ? 'Chat With Mechanic' : (isCompleted ? 'View Chat' : 'Chat');

  return (
    <View style={styles.cardContainer}>
      {isActive && <GlowingBorder />}
      <Pressable 
        style={[
          styles.orderCard,
          isActive && styles.activeOrderCard,
          isCancelled && styles.cancelledOrderCard
        ]}
        onPress={() => onViewDetails(order.id)}
        // Optionally disable press based on status
        // disabled={isCancelled}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderService}>
            {primaryServiceName}{serviceCount > 1 ? ` (+${serviceCount - 1})` : ''}
          </Text>
          <View style={[styles.statusBadge, statusStyle.badge]}>
            <Text style={[styles.statusText, statusStyle.text]}>
              {statusStyle.label.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetail}>
          <Clock size={16} color={colors.textTertiary} />
          <Text style={styles.orderDetailText}>
            {formattedDate} • {formattedTime}
          </Text>
        </View>

        <View style={styles.orderDetail}>
          <MapPin size={14} color={colors.textTertiary} />
          <Text style={styles.orderDetailText}>{order.locationDetails?.address || 'Address unavailable'}</Text>
        </View>

        {/* Show different content based on status */} 
        {isActive && (
          <View style={styles.estimatedArrival}>
            <Text style={styles.arrivalLabel}>Estimated Arrival</Text>
            <Text style={styles.arrivalTime}>N/A</Text>
            <View style={styles.progressBarContainer}>
              <ProgressBar progress={0.7} height={6} />
            </View>
          </View>
        )}

        {/* Show provider info if available and relevant */}
        {order.status !== 'Pending' && order.status !== 'Cancelled' && order.status !== 'Denied' && (
          <View style={styles.providerInfo}>
            <Text style={styles.providerLabel}>Assigned Provider</Text>
            <Text style={styles.providerName}>
              {order.providerId 
                ? (isFetchingName ? 'Fetching name...' : (displayedProviderName || 'Details unavailable')) 
                : 'Waiting for assignment...'}
            </Text>
          </View>
        )}

        {isPending && (
          <View style={styles.pendingInfo}>
            <AlertCircle size={14} color={colors.warning} />
            <Text style={styles.pendingText}>Waiting for provider assignment / scheduling</Text>
          </View>
        )}

        {isCancelled && (
           <View style={styles.cancelledInfo}>
             <Text style={styles.cancelledText}>This order was cancelled.</Text>
           </View>
        )}

        {/* Buttons Section */} 
        <View style={styles.buttonContainer}>
          <Pressable 
            style={styles.viewDetailsButton}
            onPress={() => onViewDetails(order.id)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <ChevronRight size={18} color={colors.primary} />
          </Pressable>
          
          {/* Only show chat if applicable */} 
          {canChat && (
            <Pressable 
              style={styles.chatButton}
              onPress={() => onChatPress(order.id/* , order.providerName */)}
            >
              <MessageCircle size={18} color={colors.primary} />
              <Text style={styles.chatButtonText}>
                {chatButtonText}
              </Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  glowingBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'transparent',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 10,
    zIndex: 0,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activeOrderCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cancelledOrderCard: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    opacity: 0.7,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderService: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeStatusBadge: { 
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  pendingStatusBadge: { 
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
    borderWidth: 1,
  },
  completedStatusBadge: { 
    backgroundColor: colors.successLight,
    borderColor: colors.success,
    borderWidth: 1,
  },
  acceptedStatusBadge: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  cancelledStatusBadge: { 
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  activeStatusText: { color: colors.primary },
  pendingStatusText: { color: colors.warning },
  completedStatusText: { color: colors.success },
  acceptedStatusText: { color: colors.primary },
  cancelledStatusText: { color: '#6B7280' },
  orderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderDetailText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginLeft: 8,
    flex: 1,
  },
  estimatedArrival: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  arrivalLabel: {
    color: colors.textTertiary,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  arrivalTime: {
    color: colors.primary,
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 10,
  },
  progressBarContainer: {
    marginTop: 5,
    marginBottom: 0,
  },
  providerInfo: { 
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
  },
  providerLabel: { 
    color: colors.textTertiary, 
    fontSize: 12, 
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  providerName: { 
    color: colors.textPrimary, 
    fontSize: 15, 
    fontFamily: 'Inter_600SemiBold',
  },
  buttonContainer: {
    gap: 10,
    marginTop: 16,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewDetailsText: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginRight: 4,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 8,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  pendingText: {
    color: colors.warning,
    fontSize: 13,
    marginLeft: 8,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  cancelledInfo: { 
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  cancelledText: { 
    color: '#6B7280', 
    fontSize: 13, 
    fontFamily: 'Inter_400Regular',
  },
});

export default OrderCard; 