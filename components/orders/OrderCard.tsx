import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { MapPin, Clock, Check, ChevronRight, MessageCircle, AlertCircle } from 'lucide-react-native';
import ProgressBar from '@/components/ui/ProgressBar';
import { firestore } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Define the type for order items - align with Firestore data
export type OrderStatus = 'Pending' | 'Scheduled' | 'Waiting' | 'In Progress' | 'InProgress' | 'Completed' | 'Cancelled' | 'Denied' | 'Accepted';

// Represents a single item within an order
export type OrderItemDetail = {
  id: string; // Service ID
  name: string;
  price: number;
  quantity: number;
  vehicleId: string | null;
  vehicleDisplay: string | null;
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
    outputRange: ['rgba(0, 240, 255, 0.6)', 'rgba(0, 240, 255, 1)', 'rgba(0, 240, 255, 0.6)'],
  });
  
  const shadowOpacityAnim = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.9, 0.5],
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
          <Clock size={16} color="#7A89FF" />
          <Text style={styles.orderDetailText}>
            {formattedDate} • {formattedTime}
          </Text>
        </View>

        <View style={styles.orderDetail}>
          <MapPin size={14} color="#7A89FF" />
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
             <AlertCircle size={14} color="#FFB800" />
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
            <ChevronRight size={18} color="#00F0FF" />
          </Pressable>
          
          {/* Only show chat if applicable */} 
          {canChat && (
            <Pressable 
              style={styles.chatButton}
              onPress={() => onChatPress(order.id/* , order.providerName */)}
            >
              <MessageCircle size={18} color="#00F0FF" />
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
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 10,
    zIndex: 0,
  },
  orderCard: {
    backgroundColor: 'rgba(26, 33, 56, 1)', // Updated background
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
    zIndex: 1,
    overflow: 'hidden', // Ensure glow doesn't overlap content badly
  },
  activeOrderCard: {
    borderColor: '#00F0FF',
    borderWidth: 1, // Keep subtle border even when active
  },
  cancelledOrderCard: {
     borderColor: '#4B5563', // Grey border for cancelled
     backgroundColor: 'rgba(42, 53, 85, 0.6)', // Dimmed background
     opacity: 0.7,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderService: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeStatusBadge: { 
    backgroundColor: 'rgba(0, 122, 255, 0.2)', // A vibrant blue
    borderColor: '#007BFF',
    borderWidth: 1,
  },
  pendingStatusBadge: { backgroundColor: 'rgba(255, 184, 0, 0.2)' }, // Yellow/Orange
  completedStatusBadge: { backgroundColor: 'rgba(56, 229, 77, 0.2)' }, // Green
  acceptedStatusBadge: {
    backgroundColor: 'rgba(128, 0, 128, 0.2)',
    borderColor: 'rgba(128, 0, 128, 1)',
    borderWidth: 1,
  },
  cancelledStatusBadge: { backgroundColor: 'rgba(107, 114, 128, 0.2)' }, // Grey
  statusText: {
    fontSize: 10, // Smaller status text
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  activeStatusText: { color: '#00A2FF' }, // Bright blue text
  pendingStatusText: { color: '#FFB800' },
  completedStatusText: { color: '#38E54D' },
  acceptedStatusText: { color: '#C070FF' },
  cancelledStatusText: { color: '#9CA3AF' },
  orderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderDetailText: {
    color: '#D0DFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginLeft: 8,
  },
  estimatedArrival: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  arrivalLabel: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  arrivalTime: {
    color: '#00F0FF',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 10,
  },
  progressBarContainer: {
    marginTop: 5,
    marginBottom: 0,
  },
  providerInfo: { marginVertical: 12, },
  providerLabel: { color: '#7A89FF', fontSize: 12, marginBottom: 2 },
  providerName: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_500Medium' },
  buttonContainer: {
    gap: 10,
    marginTop: 8,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 15, 30, 0.6)',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  viewDetailsText: {
    color: '#00F0FF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginRight: 4,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  chatButtonText: {
    color: '#00F0FF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginLeft: 8,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginVertical: 12,
  },
  pendingText: {
    color: '#FFB800',
    fontSize: 13,
    marginLeft: 8,
    fontFamily: 'Inter_400Regular',
  },
  cancelledInfo: { marginVertical: 12, },
  cancelledText: { color: '#9CA3AF', fontSize: 13, fontStyle: 'italic' },
});

export default OrderCard; 