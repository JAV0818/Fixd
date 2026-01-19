import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { auth, firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { OrderCard, OrderCardData } from '@/components/orders/OrderCard';
import { colors, spacing, typography } from '@/styles/theme';
import { useNavigation } from '@react-navigation/native';

type PendingOrder = {
  id: string;
  customerId: string;
  providerId?: string | null;
  providerName?: string;
  description?: string;
  vehicleInfo?: string;
  categories?: string[];
  items?: { name: string; price: number; quantity: number }[];
  totalPrice?: number;
  status?: string;
  orderType?: string;
  createdAt?: any;
  expiresAt?: Timestamp;
  locationDetails?: { address?: string };
};

export default function CustomerQuotesView() {
  const navigation = useNavigation<any>();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Fetch pending orders (both standard and custom quotes) for this customer
    const q = query(
      collection(firestore, 'repair-orders'),
      where('customerId', '==', auth.currentUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = new Date();
        const orders: PendingOrder[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((order) => {
            const status = (order.status || '').toLowerCase();
            // Only show pending orders
            if (status !== 'pending' && status !== 'pendingapproval') {
              return false;
            }
            // Check expiration for custom quotes
            if (order.orderType === 'custom_quote' && order.expiresAt) {
              const expiresAt = order.expiresAt.toDate();
              if (expiresAt < now) {
                return false; // Expired
              }
            }
            return true;
          });
        
        // Sort by createdAt descending
        orders.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return bTime - aTime;
        });
        
        setPendingOrders(orders);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching pending orders:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const acceptOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(firestore, 'repair-orders', orderId), {
        status: 'Accepted',
      });
      Alert.alert('Quote Accepted', 'You have accepted this quote.');
    } catch (e: any) {
      console.error('Failed to accept order:', e);
      Alert.alert('Error', 'Could not accept the quote. Please try again.');
    }
  };

  const declineOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(firestore, 'repair-orders', orderId), {
        status: 'DeclinedByCustomer',
      });
      Alert.alert('Quote Declined', 'You have declined this quote.');
    } catch (e: any) {
      console.error('Failed to decline order:', e);
      Alert.alert('Error', 'Could not decline the quote. Please try again.');
    }
  };

  // Check if chat is available for this order (when claimed or accepted)
  const canChat = (order: PendingOrder) => {
    const status = (order.status || '').toLowerCase();
    return (status === 'claimed' || status === 'accepted' || status === 'inprogress') && order.providerId;
  };

  const handleOpenChat = (orderId: string) => {
    navigation.navigate('PreAcceptanceChat', { orderId });
  };

  // Separate custom quotes (from mechanics) from standard orders (customer's own)
  const customQuotes = pendingOrders.filter(o => o.orderType === 'custom_quote');
  const standardOrders = pendingOrders.filter(o => o.orderType === 'standard' || !o.orderType);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#5B57F5" size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Custom Quotes Section - Show accept/decline buttons */}
      {customQuotes.length > 0 && (
        <>
          {customQuotes.map((order) => {
            const orderCardData: OrderCardData = {
              id: order.id,
              vehicleInfo: order.vehicleInfo,
              description: order.description,
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
                onPress={() => {}}
                showMessageButton={false}
                showAcceptDecline={true}
                onAccept={() => acceptOrder(order.id)}
                onDecline={() => declineOrder(order.id)}
              />
            );
          })}
          
        </>
      )}

      {/* Standard Orders Section - Only show details and message button */}
      {standardOrders.length > 0 && (
        <>
          {standardOrders.map((order) => {
            const orderCardData: OrderCardData = {
              id: order.id,
              vehicleInfo: order.vehicleInfo,
              description: order.description,
              serviceType: order.categories?.[0] || undefined,
              locationDetails: order.locationDetails,
              status: order.status,
              providerName: order.providerName,
              orderType: order.orderType,
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
          })}
        </>
      )}

      {/* Empty State */}
      {pendingOrders.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Pending Quotes</Text>
          <Text style={styles.emptyText}>
            Pending quotes from mechanics will appear here.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl * 2,
  },
  emptyContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

