import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, updateDoc, where, getDoc, serverTimestamp } from 'firebase/firestore';
import { colors } from '@/styles/theme';
import { Plus, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
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
};

export default function AdminRequestsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState<number>(15);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    // Only fetch Pending orders for the Requests screen
    const q = query(
      collection(firestore, 'repair-orders'),
      where('status', '==', 'Pending')
    );
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

  const acceptOrder = async (orderId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Not signed in', 'Log in to accept orders.');
        return;
      }
      await updateDoc(doc(firestore, 'repair-orders', orderId), {
        providerId: user.uid,
        status: 'Accepted',
      });
      Alert.alert('Accepted', 'Order assigned to you.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not accept order');
    }
  };

  const handleCreateCustomCharge = () => {
    navigation.navigate('CreateCustomCharge');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const visible = orders.slice(0, visibleCount);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Open Requests</Text>
            <Text style={styles.subtitle}>Pending orders awaiting claim</Text>
          </View>
          <Pressable style={styles.fab} onPress={handleCreateCustomCharge}>
            <Plus size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {visible.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending requests</Text>
            <Text style={styles.emptySubtext}>New customer orders will appear here</Text>
          </View>
        ) : (
          <>
            {visible.map(order => (
              <Pressable 
                key={order.id} 
                style={styles.card}
                onPress={() => handleViewDetails(order.id)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>Pending</Text>
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

                <View style={styles.row}>
                  <Pressable 
                    style={[styles.actionBtn, styles.acceptBtn]} 
                    onPress={(e) => {
                      e.stopPropagation();
                      acceptOrder(order.id);
                    }}
                  >
                    <Text style={styles.acceptBtnText}>Accept Order</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.actionBtn, styles.detailsBtn]} 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleViewDetails(order.id);
                    }}
                  >
                    <Text style={styles.detailsBtnText}>View Details</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
            
            {orders.length > visibleCount && (
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { 
    color: colors.textPrimary, 
    fontFamily: 'Inter_700Bold', 
    fontSize: 22 
  },
  subtitle: {
    color: colors.textTertiary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginTop: 4,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingBadge: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  pendingText: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
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
  
  // Action buttons
  row: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: colors.primary,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  detailsBtn: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsBtnText: {
    color: colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
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