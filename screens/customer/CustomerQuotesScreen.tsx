import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, FileText, Clock, CheckCircle, Filter, Package, Wrench, MessageCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import { colors } from '@/styles/theme';

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

type FilterType = 'all' | 'pending' | 'active' | 'completed' | 'cancelled';

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

  // Filter orders based on selected filter
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const status = (order.status || '').toLowerCase();
      switch (filter) {
        case 'pending':
          return status === 'pending' || status === 'pendingapproval' || status === 'claimed';
        case 'active':
          return status === 'accepted' || status === 'inprogress' || status === 'scheduled';
        case 'completed':
          return status === 'completed';
        case 'cancelled':
          return status === 'cancelled' || status === 'declined';
        default:
          return true;
      }
    });
  }, [orders, filter]);

  // Separate custom quotes from standard orders
  const customQuotes = filteredOrders.filter(o => o.orderType === 'custom_quote');
  const standardOrders = filteredOrders.filter(o => o.orderType !== 'custom_quote');

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

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'pendingapproval':
        return colors.warning;
      case 'claimed':
        return colors.warning;
      case 'accepted':
      case 'inprogress':
        return colors.success;
      case 'completed':
        return colors.primary;
      case 'declined':
      case 'cancelled':
        return colors.danger;
      default:
        return colors.textTertiary;
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
      switch (f) {
        case 'pending':
          return status === 'pending' || status === 'pendingapproval' || status === 'claimed';
        case 'active':
          return status === 'accepted' || status === 'inprogress' || status === 'scheduled';
        case 'completed':
          return status === 'completed';
        case 'cancelled':
          return status === 'cancelled' || status === 'declined';
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
          {(['all', 'pending', 'active', 'completed', 'cancelled'] as FilterType[]).map((f) => (
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
        {filteredOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Package size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? "You haven't placed any orders yet" 
                : `No ${filter} orders`}
            </Text>
          </View>
        )}

        {/* Custom Quotes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Custom Quotes</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Quotes created by mechanics for you</Text>
          
          {customQuotes.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.empty}>No custom quotes yet.</Text>
              </Card.Content>
            </Card>
          ) : (
            customQuotes.map(order => (
              <Card key={order.id} style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{order.vehicleInfo || 'Vehicle Service'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {order.status?.toUpperCase() || 'PENDING'}
                      </Text>
                    </View>
                  </View>

                {order.providerName && (
                  <Text style={styles.cardSubtext}>From: {order.providerName}</Text>
                )}
                
                {order.description && (
                  <Text style={styles.cardDescription}>{order.description}</Text>
                )}
                
                {order.items && order.items.length > 0 && (
                  <View style={styles.itemsList}>
                    {order.items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>${item.price?.toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {order.totalPrice != null && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalPrice}>${order.totalPrice.toFixed(2)}</Text>
                  </View>
                )}
                
                {/* Accept/Decline buttons for pending quotes */}
                {(order.status?.toLowerCase() === 'pendingapproval' || order.status?.toLowerCase() === 'pending') && (
                  <View style={styles.buttonRow}>
                    <ThemedButton
                      variant="danger"
                      onPress={() => declineOrder(order.id)}
                      style={styles.buttonFlex}
                    >
                      Decline
                    </ThemedButton>
                    <ThemedButton
                      variant="primary"
                      onPress={() => acceptOrder(order.id)}
                      style={styles.buttonFlex}
                    >
                      Accept Quote
                    </ThemedButton>
                  </View>
                )}
                
                {/* Chat button for claimed/accepted orders */}
                {canChat(order) && (
                  <View style={styles.buttonRow}>
                    <ThemedButton
                      variant="outlined"
                      onPress={() => handleOpenChat(order.id)}
                      icon="message"
                      style={styles.buttonFlex}
                    >
                      {order.status?.toLowerCase() === 'claimed' 
                        ? 'Chat with Mechanic' 
                        : 'Message Mechanic'}
                    </ThemedButton>
                  </View>
                )}
                
                {/* Show provider info for claimed orders */}
                {order.status?.toLowerCase() === 'claimed' && order.providerName && (
                  <Text style={styles.claimedNote}>
                    🔧 {order.providerName} is reviewing your request
                  </Text>
                )}
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        {/* Standard Orders Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>My Requests</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Repair orders you've submitted</Text>
          
          {standardOrders.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.empty}>No repair requests yet.</Text>
              </Card.Content>
            </Card>
          ) : (
            standardOrders.map(order => (
              <Card key={order.id} style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{order.vehicleInfo || 'Vehicle Service'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {order.status?.toUpperCase() || 'PENDING'}
                      </Text>
                    </View>
                  </View>
                  
                  {order.categories && order.categories.length > 0 && (
                    <Text style={styles.cardSubtext}>{order.categories.join(', ')}</Text>
                  )}
                  
                  {order.description && (
                    <Text style={styles.cardDescription} numberOfLines={2}>{order.description}</Text>
                  )}
                  
                  {order.locationDetails?.address && (
                    <Text style={styles.cardLocation}>📍 {order.locationDetails.address}</Text>
                  )}
                  
                  {/* Chat button for claimed/accepted orders */}
                  {canChat(order) && (
                    <View style={styles.buttonRow}>
                      <ThemedButton
                        variant="outlined"
                        onPress={() => handleOpenChat(order.id)}
                        icon="message"
                        style={styles.buttonFlex}
                      >
                        {order.status?.toLowerCase() === 'claimed' 
                          ? 'Chat with Mechanic' 
                          : 'Message Mechanic'}
                      </ThemedButton>
                    </View>
                  )}
                  
                  {/* Show provider info for claimed orders */}
                  {order.status?.toLowerCase() === 'claimed' && order.providerName && (
                    <Text style={styles.claimedNote}>
                      🔧 {order.providerName} is reviewing your request
                    </Text>
                  )}
                </Card.Content>
              </Card>
            ))
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: { 
    color: colors.textPrimary, 
    fontFamily: 'Inter_600SemiBold', 
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  cardSubtext: {
    color: colors.textTertiary,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginBottom: 6,
  },
  cardDescription: { 
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 8,
  },
  cardLocation: {
    color: colors.textTertiary,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 4,
  },
  
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  
  itemsList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  itemPrice: {
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  totalPrice: {
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
  },
  buttonFlex: {
    flex: 1,
  },
  claimedNote: {
    color: colors.warning,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});


