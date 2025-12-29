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
import { AlertTriangle, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import OrderCard, { Order, OrderStatus } from './OrderCard';
import ProgressBar from '../ui/ProgressBar';
import { globalStyles, colors, spacing, componentStyles } from '@/styles/theme';

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
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPrev: () => void;
    onNext: () => void;
  };
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
  pagination,
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
      <ActivityIndicator size="large" color={colors.primary} style={styles.activityIndicator} />
      <Text style={styles.stateMessage}>{loadingStateMessage}</Text>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.stateContainer}>
      <Clock size={60} color={colors.textTertiary} style={styles.stateIcon} />
      <Text style={styles.stateTitle}>No orders yet</Text>
      <Text style={styles.stateMessage}>{emptyStateMessage}</Text>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.stateContainer}>
      <AlertTriangle size={60} color={colors.danger} style={styles.stateIcon} />
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
              tintColor={colors.accent}
              colors={[colors.accent, colors.textSecondary]}
            />
          ) : undefined
        }
         ListFooterComponent={pagination ? (
           <View style={globalStyles.listFooter}>
             <View style={componentStyles.pagerRow}>
               <Pressable
                 accessibilityLabel="Previous page"
                 onPress={pagination.onPrev}
                 disabled={pagination.currentPage === 1}
                 style={({ pressed }) => [
                   componentStyles.tealIconButton,
                   pressed && componentStyles.tealButtonPressed,
                   pagination.currentPage === 1 && componentStyles.tealButtonDisabled,
                 ]}
               >
                 <ChevronLeft size={18} color={colors.primary} />
               </Pressable>
               <Text style={componentStyles.pagerLabel}>Page {pagination.currentPage} of {pagination.totalPages}</Text>
               <Pressable
                 accessibilityLabel="Next page"
                 onPress={pagination.onNext}
                 disabled={pagination.currentPage === pagination.totalPages}
                 style={({ pressed }) => [
                   componentStyles.tealIconButton,
                   pressed && componentStyles.tealButtonPressed,
                   pagination.currentPage === pagination.totalPages && componentStyles.tealButtonDisabled,
                 ]}
               >
                 <ChevronRight size={18} color={colors.primary} />
               </Pressable>
             </View>
           </View>
         ) : null}
      />
    );
  };

  return (
    <View style={styles.container}>
      {showTitle && title && <Text style={styles.title}>{title.toUpperCase()}</Text>}

      {/* Filter Chips */}
      {filterOptions && activeFilter && onFilterChange && getFilterCount && (
        <View style={styles.filterBarContainer}>
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
        </View>
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
                  tintColor={colors.primary}
                  colors={[colors.primary, colors.textSecondary]}
                />
              ) : undefined
            }
            ListFooterComponent={pagination ? (
              <View style={globalStyles.listFooter}>
                <Text style={{ color: colors.textSecondary, marginBottom: spacing.sm }}>Page {pagination.currentPage} of {pagination.totalPages}</Text>
                <View style={{ flexDirection: 'row' }}>
                  <Pressable onPress={pagination.onPrev} disabled={pagination.currentPage === 1} style={[styles.pagerButton, pagination.currentPage === 1 && styles.pagerDisabled]}>
                    <Text style={styles.pagerText}>Previous</Text>
                  </Pressable>
                  <View style={{ width: spacing.sm }} />
                  <Pressable onPress={pagination.onNext} disabled={pagination.currentPage === pagination.totalPages} style={[styles.pagerButton, pagination.currentPage === pagination.totalPages && styles.pagerDisabled]}>
                    <Text style={styles.pagerText}>Next</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100, // Extra padding for tab bar
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
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  stateMessage: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  sectionHeader: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.textTertiary,
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Filter styles
  filterBarContainer: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 8,
  },
  filterContainer: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  filterContent: {
    alignItems: 'center',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  centeredMessageContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 16,
  },
  pagerButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  pagerDisabled: {
    opacity: 0.4,
  },
  pagerText: {
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  pagerPressed: {
    backgroundColor: colors.surface,
  },
  pagerRow: {},
  pagerLabel: {},
});

export default ServiceOrderList; 