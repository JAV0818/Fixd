import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { MapPin, Clock, Check, ChevronRight, MessageCircle } from 'lucide-react-native';
import ProgressBar from '@/components/ui/ProgressBar';

// Define the type for order items
export type OrderItem = {
  id: string;
  service: string;
  date: string;
  time: string;
  status: 'in-progress' | 'completed';
  location: string;
  estimatedArrival?: string;
  provider?: string;
};

interface OrderCardProps {
  order: OrderItem;
  onViewDetails: (orderId: string) => void;
  onChatPress: (orderId: string) => void;
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
  const isActive = order.status === 'in-progress';
  
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

  return (
    <View style={styles.cardContainer}>
      {isActive && <GlowingBorder />}
      <Pressable 
        style={[
          styles.orderCard,
          isActive && styles.activeOrderCard
        ]}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderService}>{order.service}</Text>
          <View style={[
            styles.statusBadge,
            isActive ? styles.activeStatusBadge : styles.completedStatusBadge
          ]}>
            <Text style={styles.statusText}>
              {isActive ? 'In Progress' : 'Completed'}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetail}>
          <Clock size={16} color="#7A89FF" />
          <Text style={styles.orderDetailText}>
            {order.date} • {order.time}
          </Text>
        </View>

        <View style={styles.orderDetail}>
          <MapPin size={16} color="#7A89FF" />
          <Text style={styles.orderDetailText}>
            {order.location}
          </Text>
        </View>

        {isActive ? (
          <View style={styles.estimatedArrival}>
            <Text style={styles.arrivalLabel}>Estimated arrival:</Text>
            <Text style={styles.arrivalTime}>{order.estimatedArrival}</Text>
            <ProgressBar 
              progress={order.estimatedArrival ? getEstimatedProgress(order.estimatedArrival) : 0.5}
              height={6}
              showPercentage={false}
              gradientColors={['#7A89FF', '#00F0FF']}
              backgroundColor="rgba(10, 15, 30, 0.5)"
              containerStyle={styles.progressBarContainer}
            />
          </View>
        ) : (
          <View style={styles.providerInfo}>
            <Text style={styles.providerLabel}>Serviced by:</Text>
            <Text style={styles.providerName}>{order.provider}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Pressable 
            style={styles.viewDetailsButton}
            onPress={() => onViewDetails(order.id)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <ChevronRight size={18} color="#00F0FF" />
          </Pressable>
          
          <Pressable 
            style={styles.chatButton}
            onPress={() => onChatPress(order.id)}
          >
            <MessageCircle size={18} color="#00F0FF" />
            <Text style={styles.chatButtonText}>
              {isActive ? 'Chat With Mechanic' : 'Chat'}
            </Text>
          </Pressable>
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
    backgroundColor: 'rgba(10, 15, 30, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
    zIndex: 1,
  },
  activeOrderCard: {
    borderColor: '#00F0FF',
    borderWidth: 2,
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
    backgroundColor: 'rgba(122, 137, 255, 0.2)',
  },
  completedStatusBadge: {
    backgroundColor: 'rgba(56, 229, 77, 0.2)',
  },
  statusText: {
    color: '#00F0FF',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
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
  providerInfo: {
    marginVertical: 12,
  },
  providerLabel: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  providerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
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
});

export default OrderCard; 