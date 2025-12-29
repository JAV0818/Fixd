import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, FileText, Clock, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where, updateDoc, doc, or } from 'firebase/firestore';
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
};

export default function CustomerQuotesScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    // Fetch all repair orders for this customer (both standard and custom quotes)
    const q = query(
      collection(firestore, 'repair-orders'),
      where('customerId', '==', auth.currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows: RepairOrder[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      // Sort by createdAt descending
      rows.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setOrders(rows);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching orders:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  // Separate custom quotes from standard orders
  const customQuotes = orders.filter(o => o.orderType === 'custom_quote');
  const standardOrders = orders.filter(o => o.orderType !== 'custom_quote');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>My Orders & Quotes</Text>
        </View>

        {/* Custom Quotes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Custom Quotes</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Quotes created by mechanics for you</Text>
          
          {customQuotes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.empty}>No custom quotes yet.</Text>
            </View>
          ) : (
            customQuotes.map(order => (
              <View key={order.id} style={styles.card}>
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
                
                {(order.status?.toLowerCase() === 'pendingapproval' || order.status?.toLowerCase() === 'pending') && (
                  <View style={styles.buttonRow}>
                    <Pressable style={[styles.softButton, styles.softButtonDanger]} onPress={() => declineOrder(order.id)}>
                      <Text style={styles.softButtonTextDanger}>Decline</Text>
                    </Pressable>
                    <Pressable style={[styles.softButton, styles.softButtonPrimary]} onPress={() => acceptOrder(order.id)}>
                      <Text style={styles.softButtonTextPrimary}>Accept Quote</Text>
                    </Pressable>
                  </View>
                )}
              </View>
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
            <View style={styles.emptyCard}>
              <Text style={styles.empty}>No repair requests yet.</Text>
            </View>
          ) : (
            standardOrders.map(order => (
              <View key={order.id} style={styles.card}>
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
              </View>
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
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  softButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1.5,
  },
  softButtonPrimary: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  softButtonDanger: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  softButtonTextPrimary: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  softButtonTextDanger: {
    color: colors.danger,
    fontFamily: 'Inter_600SemiBold',
  },
});


