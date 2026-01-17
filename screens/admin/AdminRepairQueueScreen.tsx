import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, query, getDoc, doc } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase';
import { colors } from '@/styles/theme';
import { Lock, Clock, ChevronRight } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RepairOrder = {
  id: string;
  customerId: string;
  customerName?: string;
  providerName?: string;
  providerId?: string | null;
  description?: string;
  vehicleInfo?: string;
  locationDetails?: { address?: string };
  categories?: string[];
  mediaUrls?: string[];
  status?: string;
  orderType?: string;
  createdAt?: any;
  claimExpiresAt?: any;
};

type FilterType = 'myOrders' | 'all' | 'claimed' | 'accepted' | 'inProgress' | 'completed' | 'cancelled';

export default function AdminRepairQueueScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('myOrders'); // Default to My Orders
  const [visibleCount, setVisibleCount] = useState<number>(15);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [timerTick, setTimerTick] = useState(0); // Forces re-render for timer updates
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserId = auth.currentUser?.uid;

  // Timer refresh - updates every second to keep claim timers in sync with detail view
  useFocusEffect(
    useCallback(() => {
      // Start timer when screen is focused
      timerRef.current = setInterval(() => {
        setTimerTick(t => t + 1);
      }, 1000); // Update every second for consistent countdown

      return () => {
        // Clear timer when screen loses focus
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [])
  );

  useEffect(() => {
    const q = query(collection(firestore, 'repair-orders'));
    const unsub = onSnapshot(q, async (snap) => {
      const ordersData = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setOrders(ordersData);

      // Fetch customer names for all unique customerIds
      const uniqueCustomerIds = [...new Set(ordersData.map(o => o.customerId).filter(Boolean))];
      const namesMap: Record<string, string> = {};
      
      await Promise.all(
        uniqueCustomerIds.map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              const name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
              namesMap[uid] = name || 'Unknown';
            } else {
              namesMap[uid] = 'Unknown';
            }
          } catch {
            namesMap[uid] = 'Unknown';
          }
        })
      );
      setCustomerNames(namesMap);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const handleViewDetails = (orderId: string) => {
    navigation.navigate('RequestDetail', { orderId });
  };

  const getTimeRemaining = (claimExpiresAt: any) => {
    if (!claimExpiresAt) return '';
    const expiresAt = claimExpiresAt?.toDate?.() || new Date(claimExpiresAt);
    const diff = expiresAt.getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'claimed') return { bg: colors.warningLight, text: colors.warning };
    if (s === 'accepted') return { bg: colors.primaryLight, text: colors.primary };
    if (s === 'inprogress' || s === 'in progress') return { bg: colors.warningLight, text: colors.warning };
    if (s === 'completed') return { bg: colors.successLight, text: colors.success };
    if (s === 'cancelled') return { bg: colors.dangerLight, text: colors.danger };
    return { bg: colors.surfaceAlt, text: colors.textSecondary };
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

  // Filter orders - exclude Pending (those are in Requests screen)
  const filtered = orders.filter(order => {
    const status = (order.status || '').toLowerCase();
    // Exclude pending orders - they belong in Requests screen
    if (status === 'pending') return false;
    
    // My Orders filter - show orders where I'm the provider (claimed or accepted by me)
    if (filter === 'myOrders') {
      return order.providerId === currentUserId;
    }
    
    if (filter === 'claimed') return status === 'claimed';
    if (filter === 'accepted') return status === 'accepted';
    if (filter === 'inProgress') return status === 'inprogress' || status === 'in progress';
    if (filter === 'completed') return status === 'completed';
    if (filter === 'cancelled') return status === 'cancelled';
    return true; // 'all' shows everything except pending
  });
  
  const visible = filtered.slice(0, visibleCount);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Repair Queue</Text>
        <Text style={styles.subtitle}>Orders being worked on</Text>

        {/* Filters - horizontal scrollable row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          <Pressable style={[styles.filterBtn, filter === 'myOrders' && styles.filterBtnActive]} onPress={() => setFilter('myOrders')}>
            <Text style={[styles.filterText, filter === 'myOrders' && styles.filterTextActive]}>My Orders</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]} onPress={() => setFilter('all')}>
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'claimed' && styles.filterBtnActive]} onPress={() => setFilter('claimed')}>
            <Text style={[styles.filterText, filter === 'claimed' && styles.filterTextActive]}>Claimed</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'accepted' && styles.filterBtnActive]} onPress={() => setFilter('accepted')}>
            <Text style={[styles.filterText, filter === 'accepted' && styles.filterTextActive]}>Accepted</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'inProgress' && styles.filterBtnActive]} onPress={() => setFilter('inProgress')}>
            <Text style={[styles.filterText, filter === 'inProgress' && styles.filterTextActive]}>In Progress</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'completed' && styles.filterBtnActive]} onPress={() => setFilter('completed')}>
            <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>Completed</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'cancelled' && styles.filterBtnActive]} onPress={() => setFilter('cancelled')}>
            <Text style={[styles.filterText, filter === 'cancelled' && styles.filterTextActive]}>Cancelled</Text>
          </Pressable>
        </ScrollView>

        <View style={{ height: 12 }} />

        {visible.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders in queue</Text>
            <Text style={styles.emptySubtext}>Orders will appear here once claimed or accepted</Text>
          </View>
        ) : (
          <>
            {visible.map(order => {
              const isClaimed = (order.status || '').toLowerCase() === 'claimed';
              const statusColors = getStatusColor(order.status || '');
              
              return (
                <Pressable 
                  key={order.id} 
                  style={[styles.card, isClaimed && styles.claimedCard]}
                  onPress={() => handleViewDetails(order.id)}
                >
                  {/* Timer Banner for Claimed Orders - prominent yellow banner */}
                  {isClaimed && (
                    <View style={styles.timerBanner}>
                      <Clock size={16} color={colors.warning} />
                      <Text style={styles.timerText}>
                        {order.claimExpiresAt 
                          ? `Claim expires in ${getTimeRemaining(order.claimExpiresAt)}`
                          : 'Claimed (no timer set)'
                        }
                      </Text>
                    </View>
                  )}

                  {/* Status Badge */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                      {isClaimed && <Lock size={12} color={statusColors.text} />}
                      <Text style={[styles.statusText, { color: statusColors.text }]}>
                        {order.status || 'Unknown'}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.textTertiary} />
                  </View>

                  {/* Customer Name */}
                  <Text style={styles.cardTitle}>{customerNames[order.customerId] || 'Loading...'}</Text>
                  
                  {/* Vehicle */}
                  <Text style={styles.cardSubtitle}>{order.vehicleInfo || 'No vehicle info'}</Text>
                  
                  {/* Location */}
                  {order.locationDetails?.address ? (
                    <Text style={styles.cardHint}>📍 {order.locationDetails.address}</Text>
                  ) : null}
                  
                  {/* Category */}
                  {order.categories?.length ? (
                    <View style={styles.categoryContainer}>
                      <Text style={styles.cardCategory}>{order.categories.join(', ')}</Text>
                    </View>
                  ) : null}

                  {/* Provider Info */}
                  {order.providerName || order.providerId ? (
                    <Text style={styles.providerText}>
                      🔧 {order.providerName || 'Mechanic'} {order.providerId === auth.currentUser?.uid ? '(You)' : ''}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
            
            {filtered.length > visibleCount && (
              <Pressable 
                style={styles.loadMoreBtn} 
                onPress={() => setVisibleCount(c => c + 10)}
              >
                <Text style={styles.loadMoreText}>Load More</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { 
    color: colors.primary, 
    fontFamily: 'Inter_500Medium', 
    marginTop: 12 
  },
  content: { padding: 16, paddingBottom: 100 },
  title: { 
    color: colors.textPrimary, 
    fontFamily: 'Inter_700Bold', 
    fontSize: 22, 
    marginBottom: 4 
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
  
  // Load more
  loadMoreBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  loadMoreText: {
    color: colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});
