import React, { useState, useEffect, useCallback } from 'react';
import { OrderItem } from './OrderCard';
import ServiceOrderList from './ServiceOrderList';

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

  // Mock data - this would be fetched from an API in production
  const createOrderItems = useCallback((): OrderItem[] => {
    return [
      {
        id: '1',
        service: 'Battery Jump Start',
        date: '2023-05-15',
        time: '14:30',
        status: 'in-progress',
        location: '123 Main St, Anytown',
        estimatedArrival: '15 mins',
      },
      {
        id: '2',
        service: 'Tire Change',
        date: '2023-05-10',
        time: '09:45',
        status: 'completed',
        location: '456 Oak St, Somewhere',
        provider: 'John Mechanic',
      },
      {
        id: '3',
        service: 'Fuel Delivery',
        date: '2023-05-05',
        time: '16:20',
        status: 'completed',
        location: '789 Pine St, Anywhere',
        provider: 'Sarah Technician',
      },
    ];
  }, []);

  // Fetch order data
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate network request delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically fetch from an API:
      // const response = await fetch('/api/orders');
      // const data = await response.json();
      // setOrders(data);
      
      // For now, we're using mock data
      setOrders(createOrderItems());
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load your orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [createOrderItems]);

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
      initialOrders={orders}
      isLoading={isLoading}
      error={error}
      onRefresh={handleRefresh}
      emptyStateMessage="You don't have any orders yet. Book a service to get started!"
      loadingStateMessage="Loading your service orders..."
      errorStateMessage={error || "Something went wrong. Pull down to try again."}
      limit={limit}
    />
  );
};

export default OrdersData; 