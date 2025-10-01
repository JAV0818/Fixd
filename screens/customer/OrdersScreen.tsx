import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import ServiceOrderList from '@/components/orders/ServiceOrderList';
import { RepairOrder } from '@/types/orders';
import { globalStyles, colors } from '@/styles/theme';

// Types for filter options
type FilterType = 'All' | 'Active' | 'PendingApproval' | 'Scheduled' | 'Completed' | 'Cancelled';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  // Pagination derived values
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredOrders.length / pageSize)), [filteredOrders, pageSize]);
  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages]);

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
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <ServiceOrderList
        title="Your Orders"
        initialOrders={pagedOrders}
        isLoading={loading}
        error={error}
        emptyStateMessage={activeFilter === 'All' ? "You haven't placed any orders yet" : `No ${activeFilter.toLowerCase()} orders found`}
        // Pass filter props to the list component
        filterOptions={filterOptions}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        getFilterCount={getFilterCount}
        pagination={{ currentPage, totalPages, onPrev: () => setCurrentPage(p => Math.max(1, p - 1)), onNext: () => setCurrentPage(p => Math.min(totalPages, p + 1)) }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
