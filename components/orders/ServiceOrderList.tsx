import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SectionList,
  ActivityIndicator, 
  RefreshControl, 
  Pressable,
  ScrollView
} from 'react-native';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import OrderCard, { Order, OrderStatus } from './OrderCard';
import ProgressBar from '../ui/ProgressBar';

// Add filter-related props
type FilterType = 'All' | 'Active' | 'PendingApproval' | 'Scheduled' | 'Completed' | 'Cancelled';

interface ServiceOrderListProps {
  title?: string;
  showTitle?: boolean;
  initialOrders?: Order[];
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => Promise<void>;
  emptyStateMessage?: string;
  loadingStateMessage?: string;
  errorStateMessage?: string;
  limit?: number;
  // New props for filters
  filterOptions?: FilterType[];
  activeFilter?: FilterType;
  onFilterChange?: (filter: FilterType) => void;
  getFilterCount?: (filter: FilterType) => number;
}

// Define structure for SectionList
interface OrderSection {
  title: string;
  data: Order[];
  status: OrderStatus | 'Active'; // Helper to identify section type
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
  limit,
  // Destructure new props
  filterOptions,
  activeFilter,
  onFilterChange,
  getFilterCount,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [groupedOrders, setGroupedOrders] = useState<OrderSection[]>([]);
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

  // Effect to group orders whenever initialOrders changes
  useEffect(() => {
    const groupOrders = (ordersToGroup: Order[]): OrderSection[] => {
      const active: Order[] = [];
      const pending: Order[] = [];
      const scheduled: Order[] = [];
      const completed: Order[] = [];
      const cancelled: Order[] = [];

      ordersToGroup.forEach(order => {
        switch (order.status) {
          case 'In Progress':
            active.push(order);
            break;
          case 'Pending':
          case 'Waiting':
            pending.push(order);
            break;
          case 'Scheduled':
          case 'Accepted':
            scheduled.push(order);
            break;
          case 'Completed':
            completed.push(order);
            break;
          case 'Cancelled':
            cancelled.push(order);
            break;
        }
      });

      const sections: OrderSection[] = [];
      if (active.length > 0) sections.push({ title: 'Active Orders', data: active, status: 'Active' });
      if (pending.length > 0) sections.push({ title: 'Pending Assignment', data: pending, status: 'Pending' });
      if (scheduled.length > 0) sections.push({ title: 'Scheduled Services', data: scheduled, status: 'Scheduled' });
      if (completed.length > 0) sections.push({ title: 'Completed Orders', data: completed, status: 'Completed' });
      // Optionally add cancelled section
      // if (cancelled.length > 0) sections.push({ title: 'Cancelled Orders', data: cancelled, status: 'Cancelled' });
      
      return sections;
    };

    setGroupedOrders(groupOrders(initialOrders));

  }, [initialOrders]);

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
    // Find order across all sections
    const order = groupedOrders.flatMap(section => section.data).find(o => o.id === orderId);
    if (order) {
      // Use 'In Progress' which is the correct status string
      if (order.status === 'In Progress') { 
        // For active orders, go to mechanic chat
        navigation.navigate('MechanicChat', { 
          orderId, 
          // Use providerName from the OrderItem type - This should be Order type now, check if providerName is on Order
          mechanicName: (order as any).providerName || 'Assigned Mechanic' // Casting to any temporarily if providerName is not directly on Order type
        });
      } else {
        // For past orders, show chat history
        navigation.navigate('PastChats');
      }
    }
  };

  // Render each order item using OrderCard
  const renderOrderItem = ({ item }: { item: Order }) => (
    <OrderCard
      order={item}
      onViewDetails={handleViewDetails}
      onChatPress={handleChatPress}
    />
  );

  // Render section headers
  const renderSectionHeader = ({ section: { title } }: { section: OrderSection }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
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

  // Update renderContent to use SectionList
  const renderContent = () => {
    if (isLoading) {
      return renderLoadingState();
    }
    if (error) {
      return renderErrorState();
    }
    // Check if groupedOrders is empty AFTER grouping
    if (groupedOrders.length === 0) { 
      return renderEmptyState();
    }

    return (
      <SectionList
        sections={groupedOrders}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderOrderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false} // Optional: makes headers scroll with content
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
      {showTitle && title && <Text style={styles.title}>{title.toUpperCase()}</Text>}

      {/* Filter Chips */}
      {filterOptions && activeFilter && onFilterChange && getFilterCount && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filterOptions.map((filter) => (
            <Pressable
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.activeFilterChip,
              ]}
              onPress={() => onFilterChange(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter.replace('Approval', '')} ({getFilterCount(filter)})
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Conditional Rendering Logic */}
      <View style={{ flex: 1 }}>
        {isLoading ? (
          <View style={styles.centeredMessageContainer}>
            {renderLoadingState()}
          </View>
        ) : error ? (
          <View style={styles.centeredMessageContainer}>
            {renderErrorState()}
          </View>
        ) : groupedOrders.length === 0 ? (
          <View style={styles.centeredMessageContainer}>
            {renderEmptyState()}
          </View>
        ) : (
          <SectionList
            sections={groupedOrders}
            keyExtractor={(item, index) => item.id + index}
            renderItem={renderOrderItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false} // Optional: makes headers scroll with content
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
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4, // Reduced space between title and filters
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8, // Keep first item away from filters
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
  sectionHeader: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    marginTop: 24, 
    marginBottom: 8,
    paddingHorizontal: 16, // Match list padding
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Add styles for filters
  filterContainer: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 8, // Space between filters and list
  },
  filterContent: {
    alignItems: 'center',
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: '#00F0FF',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
  },
  activeFilterText: {
    color: '#00F0FF',
  },
  centeredMessageContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 16, // space below filters
  },
});

export default ServiceOrderList; 