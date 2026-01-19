import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Alert, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, PenTool as Tool, Clock, Activity, ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';
import NotificationPanel from '../../components/NotificationPanel';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { auth, firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { RepairOrder, OrderItem } from '@/types/orders';
import { CustomCharge } from '@/types/customCharges';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { componentStyles, colors } from '@/styles/theme';
import { ThemedButton } from '@/components/ui/ThemedButton';

// Define all possible statuses
type AllStatus = RepairOrder['status'] | CustomCharge['status'];

// Unified type for displaying either an order or a quote
type DisplayableItem = Omit<Partial<RepairOrder & CustomCharge>, 'status'> & {
  itemType: 'order' | 'quote';
  id: string; // Ensure id is always present
  status: AllStatus;
  claimExpiresAt?: Timestamp | null;
};

export default function RepairOrdersScreen() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // State for both data sources
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [quotes, setQuotes] = useState<CustomCharge[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [timerTick, setTimerTick] = useState(0); // Force re-render every second for timers
  
  // Animated values for pull-to-refresh indicator
  const scrollY = useRef(new Animated.Value(0)).current;
  const pullDistance = useRef(new Animated.Value(0)).current;
  const [isPulling, setIsPulling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadOrdersAndQuotes = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("User not authenticated.");
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);

    // Fetch Repair Orders
    const ordersRef = collection(firestore, 'repair-orders');
    const ordersQuery = query(ordersRef, where('providerId', '==', currentUser.uid));
    const unsubscribeOrders = onSnapshot(ordersQuery, 
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as RepairOrder));
        setOrders(fetchedOrders);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error("Error fetching repair orders:", err);
        setError("Failed to load repair orders.");
        setLoading(false);
        setRefreshing(false);
      }
    );

    // Fetch Custom Charges (Quotes)
    const quotesRef = collection(firestore, 'customCharges');
    const quotesQuery = query(quotesRef, where('mechanicId', '==', currentUser.uid));
    const unsubscribeQuotes = onSnapshot(quotesQuery,
      (snapshot) => {
        const fetchedQuotes = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CustomCharge));
        setQuotes(fetchedQuotes);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error("Error fetching custom charges:", err);
        // Don't set main error state if orders loaded fine
        setRefreshing(false);
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribeQuotes();
    };
  };

  useEffect(() => {
    return loadOrdersAndQuotes();
  }, []);

  // Timer effect to update claimed order timers every second
  // Optimized: Only runs when there are claimed orders, and cleans up properly
  useEffect(() => {
    // Check if there are any claimed orders with claimExpiresAt
    const hasClaimedOrders = orders.some(o => o.status === 'Claimed' && o.claimExpiresAt) ||
                            quotes.some(q => (q as any).claimExpiresAt);
    
    if (!hasClaimedOrders) {
      // Clean up timer if no claimed orders
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    // Update timer every second - this is necessary for countdown timers
    // The re-render is minimal since we use useMemo for expensive calculations
    timerRef.current = setInterval(() => {
      setTimerTick(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [orders, quotes]);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1); // Reset to first page on refresh
    // The onSnapshot listeners will automatically update the data
    // We just need to wait a moment for it to sync
    setTimeout(() => {
      setRefreshing(false);
      setIsPulling(false);
      Animated.timing(pullDistance, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, 500);
  };

  // Handle scroll events to track pull distance
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    
    // If scrolling up (negative offset), user is pulling down
    if (offsetY < 0) {
      setIsPulling(true);
      const pullAmount = Math.abs(offsetY);
      // Cap the pull distance for animation purposes
      const maxPull = 80;
      const normalizedPull = Math.min(pullAmount, maxPull) / maxPull;
      Animated.spring(pullDistance, {
        toValue: normalizedPull,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      setIsPulling(false);
      Animated.timing(pullDistance, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const combinedItems = useMemo((): DisplayableItem[] => {
    const allOrders: DisplayableItem[] = orders.map(o => ({ ...o, itemType: 'order' }));
    const allQuotes: DisplayableItem[] = quotes.map(q => ({ ...q, itemType: 'quote' }));
    
    const combined = [...allOrders, ...allQuotes];
    
    // Priority order: InProgress -> Accepted -> Claimed -> Completed/Cancelled
    const getStatusPriority = (status: string): number => {
      switch (status) {
        case 'InProgress':
          return 1; // Highest priority
        case 'Accepted':
          return 2;
        case 'Claimed':
          return 3;
        case 'Completed':
          return 4;
        case 'Cancelled':
        case 'CancelledByMechanic':
        case 'DeclinedByCustomer':
          return 4; // Same priority as Completed (lowest priority)
        case 'Pending':
          return 5; // Pending orders (not yet claimed) - after main priorities
        case 'PendingApproval':
          return 5; // New quotes pending approval
        default:
          return 6; // Unknown statuses go to bottom
      }
    };
    
    // Sort by status priority first, then by creation date (newest first) within each priority
    return combined.sort((a, b) => {
      const priorityA = getStatusPriority(a.status || '');
      const priorityB = getStatusPriority(b.status || '');
      
      // If priorities are different, sort by priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If priorities are the same, sort by creation date (newest first)
      const dateA = (a.createdAt as Timestamp)?.toDate() || new Date(0);
      const dateB = (b.createdAt as Timestamp)?.toDate() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [orders, quotes]);

  // Separate into Claimed Requests and All Requests
  const claimedItems = useMemo(() => {
    return combinedItems.filter(item => (item.status || '').toLowerCase() === 'claimed');
  }, [combinedItems]);

  const allOtherItems = useMemo(() => {
    return combinedItems.filter(item => (item.status || '').toLowerCase() !== 'claimed');
  }, [combinedItems]);

  // Apply filter to allOtherItems if needed
  const filteredAllItems = useMemo(() => {
    if (activeFilter === 'all') return allOtherItems;
    return allOtherItems.filter(item => item.status === activeFilter);
  }, [allOtherItems, activeFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredAllItems.length / pageSize)), [filteredAllItems, pageSize]);
  const pagedAllItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredAllItems.slice(start, end);
  }, [filteredAllItems, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
    // Reset to page 1 when filter changes
    setCurrentPage(1);
  }, [totalPages, activeFilter]);

  const handleInitiateService = async (orderId: string) => {
    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const orderRef = doc(firestore, 'repair-orders', orderId);
      // Proceed with starting service directly
      await updateDoc(orderRef, {
        status: 'InProgress',
        startedAt: new Date(), // Or serverTimestamp() if preferred for consistency
      });
      // Navigate to the RequestStartScreen (assuming 'Requests' is the correct stack name)
      navigation.navigate('RequestStart', { orderId: orderId });
    } catch (err: any) {
      console.error("Error initiating service:", err);
      Alert.alert("Error", err.message || "Could not start service. Please try again.");
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleCancelQuote = async (quoteId: string) => {
    Alert.alert(
      "Cancel Quote",
      "Are you sure you want to cancel this custom charge quote? This action cannot be undone.",
      [
        { text: "Don't Cancel", style: "cancel" },
        {
          text: "Yes, Cancel Quote",
          style: "destructive",
          onPress: async () => {
            setActionLoading(prev => ({ ...prev, [quoteId]: true }));
            try {
              const functionsInstance = getFunctions();
              const cancelFunction = httpsCallable(functionsInstance, 'cancelCustomChargeByProvider');
              await cancelFunction({ customChargeId: quoteId });
              Alert.alert("Success", "Custom charge quote has been cancelled.");
              // The snapshot listener should automatically update the list
            } catch (err: any) {
              console.error("Error cancelling quote:", err);
              Alert.alert("Error", err.message || "Could not cancel the quote. Please try again.");
            } finally {
              setActionLoading(prev => ({ ...prev, [quoteId]: false }));
            }
          },
        },
      ]
    );
  };

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this repair order? This action cannot be undone.",
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setActionLoading(prev => ({ ...prev, [orderId]: true }));
            try {
      const orderRef = doc(firestore, 'repair-orders', orderId);
              await updateDoc(orderRef, { status: 'Cancelled' });
              Alert.alert("Success", "The repair order has been cancelled.");
            } catch (err: any) {
              console.error("Error cancelling order:", err);
              Alert.alert("Error", err.message || "Could not cancel the order.");
            } finally {
              setActionLoading(prev => ({ ...prev, [orderId]: false }));
            }
          },
        },
      ]
    );
  };

  // Memoize timer calculations - only recalculates when timerTick changes
  const getTimeRemaining = useCallback((claimExpiresAt: any) => {
    if (!claimExpiresAt) return '';
    const expiresAt = claimExpiresAt?.toDate?.() || new Date(claimExpiresAt);
    const diff = expiresAt.getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
  }, [timerTick]); // Recalculate when timerTick changes

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'claimed') return { bg: colors.warningLight, text: colors.warning };
    if (s === 'accepted') return { bg: colors.primaryLight, text: colors.primary };
    if (s === 'inprogress' || s === 'in progress') return { bg: colors.warningLight, text: colors.warning };
    if (s === 'completed') return { bg: colors.successLight, text: colors.success };
    if (s === 'cancelled') return { bg: colors.dangerLight, text: colors.danger };
    return { bg: colors.surfaceAlt, text: colors.textSecondary };
  };

  const getStatusLabel = (status: string) => {
    if (!status) return 'UNKNOWN';
    return status.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
  };

  // Render order card component
  const renderOrderCard = (item: DisplayableItem) => {
    const handleCardPress = () => {
      if (item.id) {
        navigation.navigate('RequestDetail', { orderId: item.id });
      }
    };
    const isClaimed = (item.status || '').toLowerCase() === 'claimed';
    const statusColors = getStatusColor(item.status || '');
    const displayCustomerName = item.customerName || 'Customer';
    const displayVehicle = item.vehicleDisplay || item.items?.[0]?.vehicleDisplay || 'Vehicle not specified';
    const displayLocation = item.locationDetails?.address || 'Location not set';
    const displayService = item.items?.[0]?.name || 'Service not specified';
    const isButtonLoading = item.id ? actionLoading[item.id] : false;

    return (
      <Pressable 
        key={item.id} 
        style={[styles.card, isClaimed && styles.claimedCard]}
        onPress={() => {
          if (item.id) {
            navigation.navigate('RequestDetail', { orderId: item.id });
          }
        }}
      >
        {/* Timer Banner for Claimed Orders */}
        {isClaimed && item.claimExpiresAt && (
          <View style={styles.timerBanner}>
            <Clock size={16} color={colors.warning} />
            <Text style={styles.timerText}>
              Claim expires in {getTimeRemaining(item.claimExpiresAt)}
            </Text>
          </View>
        )}

        {/* Status Badge */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            {isClaimed && <Lock size={12} color={statusColors.text} />}
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textTertiary} />
        </View>

        {/* Customer Name */}
        <Text style={styles.cardTitle}>{displayCustomerName}</Text>
        
        {/* Vehicle */}
        <Text style={styles.cardSubtitle}>{displayVehicle}</Text>
        
        {/* Location */}
        {displayLocation && (
          <Text style={styles.cardHint}>📍 {displayLocation}</Text>
        )}
        
        {/* Service Type */}
        {displayService && (
          <View style={styles.categoryContainer}>
            <Text style={styles.cardCategory}>{displayService}</Text>
          </View>
        )}

        {/* Provider Info */}
        {item.providerName && (
          <Text style={styles.providerText}>
            🔧 {item.providerName} {item.providerId === auth.currentUser?.uid ? '(You)' : ''}
          </Text>
        )}
        
        {/* Action Button - Single "View Details" button */}
        <View style={styles.actionButtons}>
          <ThemedButton
            variant="primary"
            onPress={handleCardPress}
            style={styles.actionButtonFlex}
          >
            VIEW DETAILS
          </ThemedButton>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Animated styles for pull indicator
  const indicatorScale = pullDistance.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const indicatorOpacity = pullDistance.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const indicatorTranslateY = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Pull Indicator */}
      {(isPulling || refreshing) && (
        <Animated.View 
          style={[
            styles.pullIndicator,
            {
              opacity: refreshing ? 1 : indicatorOpacity,
              transform: [
                { scale: refreshing ? 1 : indicatorScale },
                { translateY: refreshing ? 0 : indicatorTranslateY },
              ],
            },
          ]}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Animated.View 
              style={[
                styles.pullCircle, 
                { 
                  transform: [
                    { 
                      rotate: pullDistance.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '720deg'],
                      })
                    },
                  ],
                }
              ]} 
            />
          )}
        </Animated.View>
      )}
      
      <Animated.ScrollView 
        contentContainerStyle={styles.content}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { 
            useNativeDriver: false,
            listener: (event: any) => {
              handleScroll(event);
            }
          }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={['transparent']}
            progressViewOffset={-1000}
          />
        }
          >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Repair Queue</Text>
        </View>
        <Text style={styles.subtitle}>Orders being worked on</Text>

        {/* Filters - horizontal scrollable row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
            <Pressable 
              style={[
                styles.filterBtn, 
                activeFilter === 'all' && styles.filterBtnActive
              ]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'all' && styles.filterTextActive
              ]}>All</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.filterBtn, 
                activeFilter === 'PendingApproval' && styles.filterBtnActive
              ]}
              onPress={() => setActiveFilter('PendingApproval')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'PendingApproval' && styles.filterTextActive
              ]}>New Quotes</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.filterBtn, 
                activeFilter === 'InProgress' && styles.filterBtnActive
              ]}
              onPress={() => setActiveFilter('InProgress')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'InProgress' && styles.filterTextActive
              ]}>In Progress</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.filterBtn, 
                activeFilter === 'Accepted' && styles.filterBtnActive
              ]}
              onPress={() => setActiveFilter('Accepted')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'Accepted' && styles.filterTextActive
              ]}>Accepted</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.filterBtn, 
                activeFilter === 'Completed' && styles.filterBtnActive
              ]}
              onPress={() => setActiveFilter('Completed')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'Completed' && styles.filterTextActive
              ]}>Completed</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.filterBtn, 
                activeFilter === 'Cancelled' && styles.filterBtnActive
              ]}
              onPress={() => setActiveFilter('Cancelled')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'Cancelled' && styles.filterTextActive
              ]}>Cancelled</Text>
            </Pressable>
          </ScrollView>

        <View style={{ height: 12 }} />

        {/* Claimed Requests Section */}
        {claimedItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Activity size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Claimed Requests</Text>
                  </View>
            <Text style={styles.sectionSubtitle}>Orders you've claimed and need to accept</Text>
            
            {claimedItems.map((item) => renderOrderCard(item))}
                </View>
        )}

        {/* All Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>All Requests</Text>
              </View>
          <Text style={styles.sectionSubtitle}>All other repair orders and quotes</Text>
          
          {filteredAllItems.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No orders found for "{activeFilter === 'all' ? 'All Orders' : getStatusLabel(activeFilter as string)}"
              </Text>
              </View>
          ) : (
            <>
              {pagedAllItems.map((item) => renderOrderCard(item))}
              
          {/* Pager */}
          <View style={componentStyles.pagerRow}>
            <Pressable
              accessibilityLabel="Previous page"
              onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={({ pressed }) => [
                componentStyles.tealIconButton,
                pressed && componentStyles.tealButtonPressed,
                    currentPage === 1 && componentStyles.tealButtonDisabled,
              ]}
            >
                  <ChevronLeft size={18} color={currentPage === 1 ? colors.textLight : colors.accent} />
            </Pressable>
            <Text style={componentStyles.pagerLabel}>Page {currentPage} of {totalPages}</Text>
            <Pressable
              accessibilityLabel="Next page"
              onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={({ pressed }) => [
                componentStyles.tealIconButton,
                pressed && componentStyles.tealButtonPressed,
                currentPage === totalPages && componentStyles.tealButtonDisabled,
              ]}
            >
                  <ChevronRight size={18} color={currentPage === totalPages ? colors.textLight : colors.accent} />
            </Pressable>
          </View>
            </>
      )}
        </View>
      </Animated.ScrollView>

      {showNotifications && (
        <NotificationPanel
          notifications={[
            {
              id: '1',
              title: 'NEW REPAIR ORDER',
              message: 'Emily Rodriguez has requested a battery jump start',
              timestamp: '2 minutes ago',
              read: false,
            },
            {
              id: '2',
              title: 'ORDER UPDATED',
              message: 'Michael Chen changed the service time',
              timestamp: '1 hour ago',
              read: false,
            },
          ]}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={() => {}}
          onMarkAllAsRead={() => {}}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background 
  },
  pullIndicator: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    paddingTop: 8,
  },
  pullCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderTopColor: 'transparent',
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  loadingText: { 
    color: colors.primary, 
    fontFamily: 'Inter_500Medium', 
    marginTop: 12 
  },
  content: { 
    padding: 16,
    paddingBottom: 100 
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: colors.textPrimary, 
    fontFamily: 'Inter_700Bold',
    fontSize: 22, 
  },
  refreshIndicator: {
    marginLeft: 4,
  },
  subtitle: {
    color: colors.textTertiary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  
  // Filter styles
  filterScroll: {
    flexGrow: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.textTertiary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Card styles
  card: { 
    borderWidth: 1.5, 
    borderColor: colors.border, 
    borderRadius: 16, 
    padding: 16,
    backgroundColor: colors.surface, 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 8, 
    elevation: 2,
  },
  claimedCard: {
    borderColor: colors.warning,
    borderWidth: 2,
  },
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warningLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  timerText: {
    color: colors.warning,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  cardTitle: {
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    marginBottom: 4,
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    marginBottom: 8,
  },
  cardHint: { 
    color: colors.textTertiary, 
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginTop: 4,
  },
  categoryContainer: {
    marginTop: 8,
  },
  cardCategory: {
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  providerText: {
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  actionButtonFlex: {
    flex: 1,
  },
  
  // Other styles
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  pagerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  pagerLabel: {
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textTertiary,
    marginBottom: 16,
  },
  emptyStateContainer: {
    padding: 24,
    alignItems: 'center',
  },
}); 