import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from './OrderCard';
import ServiceOrderList from './ServiceOrderList';
import { auth, firestore } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, onSnapshot } from 'firebase/firestore';

// Types for the component props
interface OrdersDataProps {
  title?: string;
  showTitle?: boolean;
  limit?: number;
}

// Component that encapsulates order data logic and rendering
const OrdersData: React.FC<OrdersDataProps> = ({
  title = 'Your Orders',
  showTitle = true,
  limit,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch order data from Firestore using onSnapshot
  useEffect(() => {
    setIsLoading(true);
    setError('');
    const user = auth.currentUser;

    if (!user) {
      setError('Please log in to view your orders.');
      setIsLoading(false);
      setOrders([]);
      return;
    }

    // Query Firestore for orders belonging to the current user
    const ordersRef = collection(firestore, 'repairOrders');
    const q = query(
      ordersRef,
      where('customerId', '==', user.uid),
      orderBy('createdAt', 'desc') // Order by createdAt descending
    );

    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders: Order[] = []; // Use the Order type
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Map Firestore data to Order type
        fetchedOrders.push({
          id: doc.id,
          items: data.items || [], // Default to empty array if missing
          totalPrice: data.totalPrice || 0,
          status: data.status || 'Pending', // Default status if missing
          createdAt: data.createdAt, // Keep as Firestore Timestamp
          customerId: data.customerId, // Make sure this exists in Firestore doc
          shippingDetails: data.shippingDetails || {}, // Default to empty object
          providerId: data.providerId || null,
        });
      });

      setOrders(fetchedOrders);
      setIsLoading(false);
      setError(''); // Clear error on successful fetch

    }, (err) => { // Handle errors from onSnapshot
      console.error('Error fetching orders with snapshot:', err);
      setError('Failed to load your orders. Please try again.');
      setOrders([]); // Clear orders on error
      setIsLoading(false);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();

  }, []); // Re-run only if auth state changes (implicitly via currentUser)

  // Handle refresh
  const handleRefresh = async () => {
    // Implement refresh logic
  };

  return (
    <ServiceOrderList
      title={title}
      showTitle={showTitle}
      initialOrders={orders} // Pass fetched orders (now type Order[])
      isLoading={isLoading}
      error={error}
      onRefresh={handleRefresh}
      emptyStateMessage="You don't have any orders yet. Book a service to get started!"
      loadingStateMessage="Loading your service orders..."
      errorStateMessage={error || "Something went wrong. Pull down to try again."}
      // limit={limit} // limit might not be relevant with grouping
    />
  );
};

export default OrdersData; 