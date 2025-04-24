import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  Pressable 
} from 'react-native';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import OrderCard, { OrderItem } from './OrderCard';
import ProgressBar from '../ui/ProgressBar';

interface ServiceOrderListProps {
  title?: string;
  showTitle?: boolean;
  initialOrders?: OrderItem[];
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => Promise<void>;
  emptyStateMessage?: string;
  loadingStateMessage?: string;
  errorStateMessage?: string;
  limit?: number;
}

const ServiceOrderList: React.FC<ServiceOrderListProps> = ({
  title = 'Your Orders',
  showTitle = true,
  initialOrders = [],
  isLoading = false,
  error = '',
  onRefresh,
  emptyStateMessage = 'No orders found',
  loadingStateMessage = 'Loading your orders...',
  errorStateMessage = 'Something went wrong while loading your orders',
  limit
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Effect to simulate or track loading progress
  useEffect(() => {
    if (isLoading) {
      // Simulate progress updates
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const nextProgress = prev + 0.05;
          return nextProgress > 0.95 ? 0.95 : nextProgress;
        });
      }, 300);
      
      return () => {
        clearInterval(interval);
        setLoadingProgress(0);
      };
    } else {
      setLoadingProgress(1); // Complete the progress
    }
  }, [isLoading]);

  // Effect to update orders from props
  useEffect(() => {
    if (initialOrders.length > 0) {
      setOrders(limit ? initialOrders.slice(0, limit) : initialOrders);
    }
  }, [initialOrders, limit]);

  // Handle refreshing the order list
  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  // Handle viewing order details
  const handleViewDetails = (orderId: string) => {
    navigation.navigate('OrderDetail', { orderId });
  };

  // Handle chat button press
  const handleChatPress = (orderId: string) => {
    // Get the order to determine if it's active
    const order = orders.find(o => o.id === orderId);
    if (order) {
      if (order.status === 'in-progress') {
        // For active orders, go to mechanic chat
        navigation.navigate('MechanicChat', { 
          orderId, 
          mechanicName: order.provider || 'Assigned Mechanic'
        });
      } else {
        // For past orders, show chat history
        navigation.navigate('PastChats');
      }
    }
  };

  // Render each order item
  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <OrderCard
      order={item}
      onViewDetails={handleViewDetails}
      onChatPress={handleChatPress}
    />
  );

  // Render loading state
  const renderLoadingState = () => (
    <View style={styles.stateContainer}>
      <ProgressBar 
        progress={loadingProgress} 
        label="Loading your orders" 
        showPercentage={false}
        height={6}
        animated={true}
      />
      <ActivityIndicator size="large" color="#00F0FF" style={styles.activityIndicator} />
      <Text style={styles.stateMessage}>{loadingStateMessage}</Text>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.stateContainer}>
      <Clock size={50} color="#7A89FF" style={styles.stateIcon} />
      <Text style={styles.stateTitle}>No orders yet</Text>
      <Text style={styles.stateMessage}>{emptyStateMessage}</Text>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.stateContainer}>
      <AlertTriangle size={50} color="#FF3D71" style={styles.stateIcon} />
      <Text style={styles.stateTitle}>Oops!</Text>
      <Text style={styles.stateMessage}>{errorStateMessage}</Text>
      {onRefresh && (
        <Pressable style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      )}
    </View>
  );

  // Determine what to render based on component state
  const renderContent = () => {
    if (isLoading) {
      return renderLoadingState();
    }
    
    if (error) {
      return renderErrorState();
    }

    if (orders.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#00F0FF"
              colors={["#00F0FF", "#7A89FF"]}
            />
          ) : undefined
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      {showTitle && <Text style={styles.title}>{title}</Text>}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  listContent: {
    padding: 16,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  stateIcon: {
    marginBottom: 16,
  },
  activityIndicator: {
    marginVertical: 20,
  },
  stateTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stateMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#D0DFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  retryButtonText: {
    color: '#00F0FF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});

export default ServiceOrderList; 