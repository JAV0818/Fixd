import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Clock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from 'react-native-paper';
import { auth, firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import { colors, spacing, typography } from '@/styles/theme';
import { OrderCard, OrderCardData } from '@/components/orders/OrderCard';

type RepairOrder = {
  id: string;
  customerId: string;
  providerId?: string | null;
  providerName?: string;
  customerName?: string;
  description?: string;
  vehicleInfo?: string;
  locationDetails?: { address?: string };
  categories?: string[];
  items?: { name: string; price: number; quantity: number }[];
  totalPrice?: number;
  status?: string;
  orderType?: string;
  createdAt?: any;
  claimedAt?: any;
};

type FilterType = 'all' | 'active' | 'completed' | 'cancelled';

export default function CustomerQuotesScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('No current user for orders fetch');
      setLoading(false);
      return;
    }
    
    console.log('Fetching orders for user:', auth.currentUser.uid);
    
    // Fetch all repair orders for this customer (both standard and custom quotes)
    const q = query(
      collection(firestore, 'repair-orders'),
      where('customerId', '==', auth.currentUser.uid)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      console.log('Orders snapshot received:', snap.docs.length, 'documents');
      const rows: RepairOrder[] = snap.docs.map(d => {
        const data = d.data() as any;
        console.log('Order:', d.id, 'status:', data.status, 'type:', data.orderType);
        return { id: d.id, ...data };
      });
      // Sort by createdAt descending
      rows.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return bTime - aTime;
      });
      setOrders(rows);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching orders:', err);
      Alert.alert('Error', 'Failed to load your orders. Please try again.');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter orders based on selected filter (excluding pending - they're in View My Quotes)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const status = (order.status || '').toLowerCase();
      // Always exclude pending orders from this screen
      if (status === 'pending' || status === 'pendingapproval') {
        return false;
      }
      switch (filter) {
        case 'active':
          return status === 'accepted' || status === 'inprogress' || status === 'scheduled' || status === 'claimed';
        case 'completed':
          return status === 'completed';
        case 'cancelled':
          return status === 'cancelled' || status === 'declined' || status === 'declinedbycustomer' || status === 'cancelledbymechanic';
        default:
          return true;
      }
    });
  }, [orders, filter]);

  // Filter out pending orders (they should be in View My Quotes section)
  // Only show non-pending orders in My Requests section
  const nonPendingOrders = filteredOrders.filter(o => {
    const status = (o.status || '').toLowerCase();
    return status !== 'pending' && status !== 'pendingapproval';
  });

  const acceptOrder = async (orderId: string) => {
        try {
      await updateDoc(doc(firestore, 'repair-orders', orderId), {
        status: 'Accepted',
      });
      Alert.alert('Success', 'Quote accepted!');
    } catch (e: any) {
      console.error('Failed to accept order:', e);
      Alert.alert('Error', 'Could not accept the quote. Please try again.');
    }
  };

  const declineOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(firestore, 'repair-orders', orderId), {
        status: 'Declined',
      });
      Alert.alert('Quote Declined', 'You have declined this quote.');
    } catch (e: any) {
      console.error('Failed to decline order:', e);
      Alert.alert('Error', 'Could not decline the quote. Please try again.');
    }
  };


  // Check if chat is available for this order (when claimed or accepted)
  const canChat = (order: RepairOrder) => {
    const status = (order.status || '').toLowerCase();
    return (status === 'claimed' || status === 'accepted' || status === 'inprogress') && order.providerId;
  };

  const handleOpenChat = (orderId: string) => {
    navigation.navigate('PreAcceptanceChat', { orderId });
  };

  const getFilterCount = (f: FilterType) => {
    return orders.filter(order => {
      const status = (order.status || '').toLowerCase();
      // Exclude pending from all counts
      if (status === 'pending' || status === 'pendingapproval') {
        return false;
      }
      switch (f) {
        case 'active':
          return status === 'accepted' || status === 'inprogress' || status === 'scheduled' || status === 'claimed';
        case 'completed':
          return status === 'completed';
        case 'cancelled':
          return status === 'cancelled' || status === 'declined' || status === 'declinedbycustomer' || status === 'cancelledbymechanic';
        default:
          return true;
      }
    }).length;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>My Orders</Text>
        </View>

        {/* Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {(['all', 'active', 'completed', 'cancelled'] as FilterType[]).map((f) => (
            <Pressable 
              key={f} 
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]} 
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({getFilterCount(f)})
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Empty State */}
        {nonPendingOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? "You haven't placed any orders yet" 
                : `No ${filter} orders`}
            </Text>
          </View>
        )}

        {/* My Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>My Requests</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Repair orders you've submitted</Text>
          
          {nonPendingOrders.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.empty}>No repair requests yet.</Text>
              </Card.Content>
            </Card>
          ) : (
            nonPendingOrders.map(order => {
              const orderCardData: OrderCardData = {
                id: order.id,
                vehicleInfo: order.vehicleInfo,
                description: order.description,
                serviceType: order.categories?.[0] || undefined,
                locationDetails: order.locationDetails,
                status: order.status,
                providerName: order.providerName,
                orderType: order.orderType,
                totalPrice: order.totalPrice,
                items: order.items,
              };

              return (
                <OrderCard
                  key={order.id}
                  order={orderCardData}
                  onPress={() => handleOpenChat(order.id)}
                  onMessagePress={() => handleOpenChat(order.id)}
                  showMessageButton={canChat(order)}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    marginTop: 12,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: { 
    color: colors.textPrimary, 
    fontFamily: 'Inter_700Bold', 
    fontSize: 22,
  },
  
  // Filter styles
  filterScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.textTertiary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
  sectionSubtitle: {
    color: colors.textTertiary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 12,
  },
  
  emptyCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  empty: { 
    color: colors.textTertiary, 
    fontFamily: 'Inter_500Medium',
  },
  
});


