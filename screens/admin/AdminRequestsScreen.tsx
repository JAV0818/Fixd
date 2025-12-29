import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '@/lib/firebase';
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where, getDoc, writeBatch, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { componentStyles, colors } from '@/styles/theme';
import { Plus } from 'lucide-react-native';
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'inProgress' | 'completed'>('all');
  const [visibleCount, setVisibleCount] = useState<number>(15);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});

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
    });
    return () => unsub();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Open Repair Orders</Text>
          <Pressable style={styles.fab} onPress={handleCreateCustomCharge}>
            <Plus size={24} color="#FFFFFF" />
          </Pressable>
        </View>
        {/* Filters - horizontal scrollable row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          <Pressable style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]} onPress={() => setFilter('all')}>
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'pending' && styles.filterBtnActive]} onPress={() => setFilter('pending')}>
            <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>Pending</Text>
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
        </ScrollView>
        <View style={{ height: 12 }} />

        {(() => {
          const filtered = orders.filter(order => {
            if (filter === 'pending') return (order.status || '').toLowerCase() === 'pending';
            if (filter === 'accepted') return (order.status || '').toLowerCase() === 'accepted';
            if (filter === 'inProgress') return (order.status || '').toLowerCase() === 'inprogress' || (order.status || '').toLowerCase() === 'in progress';
            if (filter === 'completed') return (order.status || '').toLowerCase() === 'completed';
            return true;
          });
          const visible = filtered.slice(0, visibleCount);
          return (
            <>
              {visible.map(order => (
                <View key={order.id} style={styles.card}>
                  {/* Default display: Customer Name, Vehicle, Location, Category */}
                  <Text style={styles.cardTitle}>{customerNames[order.customerId] || 'Loading...'}</Text>
                  <Text style={styles.cardSubtitle}>{order.vehicleInfo || 'No vehicle info'}</Text>
                  {order.locationDetails?.address ? (
                    <Text style={styles.cardHint}>📍 {order.locationDetails.address}</Text>
                  ) : null}
                  {order.categories?.length ? (
                    <Text style={styles.cardCategory}>{order.categories.join(', ')}</Text>
                  ) : null}

                  <View style={styles.row}>
                    {(order.status || '').toLowerCase() === 'pending' && (
                      <Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={() => acceptOrder(order.id)}>
                        <Text style={styles.acceptBtnText}>Accept Order</Text>
                      </Pressable>
                    )}
                    <Pressable style={[styles.actionBtn, styles.detailsBtn]} onPress={() => toggleExpand(order.id)}>
                      <Text style={styles.detailsBtnText}>{expanded[order.id] ? 'Hide Details' : 'View Details'}</Text>
                    </Pressable>
                  </View>

                  {expanded[order.id] && (
                    <View style={styles.quotesBox}>
                      <Text style={styles.detailLabel}>Description: <Text style={styles.detailValue}>{order.description || 'No description'}</Text></Text>
                      <Text style={styles.detailLabel}>Status: <Text style={styles.detailValue}>{(order.status || 'Unknown').toUpperCase()}</Text></Text>
                      <Text style={styles.detailLabel}>Provider: <Text style={styles.detailValue}>{order.providerName || order.providerId || 'Unassigned'}</Text></Text>
                      <Text style={styles.detailLabel}>Order Type: <Text style={styles.detailValue}>{order.orderType || 'standard'}</Text></Text>
                      <Text style={styles.detailLabel}>Media: <Text style={styles.detailValue}>{(order.mediaUrls || []).length} attachment(s)</Text></Text>
                    </View>
                  )}
                </View>
              ))}
              {filtered.length > visibleCount && (
                <Pressable style={[styles.actionBtn, styles.detailsBtn, { alignSelf: 'center', marginTop: 10 }]} onPress={() => setVisibleCount(c => c + 10)}>
                  <Text style={styles.detailsBtnText}>Load More</Text>
                </Pressable>
              )}
            </>
          );
        })()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { color: colors.textPrimary, fontFamily: 'Inter_700Bold', fontSize: 22 },
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
  
  // Filter styles - horizontal scrollable row
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
  
  // Card styles with border
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
  cardCategory: {
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginTop: 8,
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
  
  // Expanded details box
  quotesBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.surfaceAlt,
    gap: 8,
  },
  detailLabel: {
    color: colors.textTertiary,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  detailValue: {
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular',
  },
});