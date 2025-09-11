import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import ServiceOrderList from '@/components/orders/ServiceOrderList';
import { RepairOrder } from '@/types/orders';

// Types for filter options
type FilterType = 'All' | 'Active' | 'PendingApproval' | 'Scheduled' | 'Completed' | 'Cancelled';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filterOptions: FilterType[] = ['All', 'Active', 'PendingApproval', 'Scheduled', 'Completed', 'Cancelled'];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    // NOTE: We use the camelCase collection name to match current rules
    const ordersRef = collection(firestore, 'repairOrders');
    const q = query(
      ordersRef,
      where('customerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as RepairOrder));
      setOrders(fetchedOrders);
      setLoading(false);
    }, (err) => {
      console.error('Failed to load orders:', err);
      setError('Failed to load your orders.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'All') return orders;

    return orders.filter(order => {
      switch (activeFilter) {
        case 'Active':
          return order.status === 'InProgress' || order.status === 'Accepted' || order.status === 'Scheduled';
        case 'PendingApproval':
          return order.status === 'PendingApproval';
        case 'Scheduled':
          return order.status === 'Scheduled' || order.status === 'Accepted';
        case 'Completed':
          return order.status === 'Completed';
        case 'Cancelled':
          return order.status === 'Cancelled' || order.status === 'DeclinedByCustomer';
        default:
          return false;
      }
    });
  }, [orders, activeFilter]);

  const getFilterCount = (filter: FilterType): number => {
    if (filter === 'All') return orders.length;
    return orders.filter(order => {
      switch (filter) {
        case 'Active':
          return order.status === 'InProgress' || order.status === 'Accepted' || order.status === 'Scheduled';
        case 'PendingApproval':
          return order.status === 'PendingApproval';
        case 'Scheduled':
          return ['Scheduled', 'Accepted'].includes(order.status as string);
        case 'Completed':
          return order.status === 'Completed';
        case 'Cancelled':
          return ['Cancelled', 'DeclinedByCustomer'].includes(order.status as string);
        default:
          return false;
      }
    }).length;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F0FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ServiceOrderList
        title="Your Orders"
        initialOrders={filteredOrders}
        isLoading={loading}
        error={error}
        emptyStateMessage={activeFilter === 'All' ? "You haven't placed any orders yet" : `No ${activeFilter.toLowerCase()} orders found`}
        // Pass filter props to the list component
        filterOptions={filterOptions}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        getFilterCount={getFilterCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0F1E',
  },
});
