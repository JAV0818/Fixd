import React, { useState, useEffect, useCallback } from 'react';
import { OrderItem, OrderStatus } from './OrderCard';
import ServiceOrderList from './ServiceOrderList';
import { auth, firestore } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

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
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch order data from Firestore
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const user = auth.currentUser;

    if (!user) {
      setError('Please log in to view your orders.');
      setIsLoading(false);
      setOrders([]);
      return;
    }

    try {
      // Query Firestore for orders belonging to the current user
      // Assuming orders are stored in 'repairOrders' collection
      const ordersRef = collection(firestore, 'repairOrders');
      const q = query(
        ordersRef, 
        where('customerId', '==', user.uid),
        orderBy('scheduledDateTime', 'desc') // Order by date descending
      );
      
      const querySnapshot = await getDocs(q);
      
      const fetchedOrders: OrderItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Map Firestore data to OrderItem type
        fetchedOrders.push({
          id: doc.id,
          serviceType: data.serviceType || 'Unknown Service',
          scheduledDateTime: data.scheduledDateTime, // Keep as Timestamp for now
          status: data.status || 'Pending', // Default status if missing
          location: data.address, // Map address to location if needed
          providerName: data.providerName,
          // Add other fields as needed from your Firestore doc
        });
      });

      setOrders(fetchedOrders);

    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load your orders. Please try again.');
      setOrders([]); // Clear orders on error
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependency array is empty as it relies on currentUser from auth context

  // Initial data load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle refresh
  const handleRefresh = async () => {
    await fetchOrders();
  };

  return (
    <ServiceOrderList
      title={title}
      showTitle={showTitle}
      initialOrders={orders} // Pass fetched orders
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