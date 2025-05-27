import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, PenTool as Tool, Clock, Activity, Filter, Search } from 'lucide-react-native';
import NotificationPanel from '../../components/NotificationPanel';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '@/navigation/ProviderNavigator';
import { auth, firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { RepairOrder } from '@/types/orders';

export default function RepairOrdersScreen() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'Accepted' | 'InProgress' | 'Completed' | 'Cancelled'>('all');
  const navigation = useNavigation<NativeStackNavigationProp<ProviderStackParamList>>();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ordersRef = collection(firestore, 'repairOrders');
    const q = query(
      ordersRef,
      where('providerId', '==', currentUser.uid),
      where('status', 'in', ['Accepted', 'InProgress']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const fetchedOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as RepairOrder));
        setOrders(fetchedOrders);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching assigned orders:", err);
        setError("Failed to load assigned orders.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getFilteredOrders = () => {
    if (activeFilter === 'all') return orders;
    return orders.filter(order => order.status === activeFilter);
  };

  const getStatusColor = (status: RepairOrder['status']) => {
    switch (status) {
      case 'InProgress': return '#00F0FF';
      case 'Accepted': return '#7A89FF';
      case 'Completed': return '#34C759';
      case 'Cancelled': return '#FF3D71';
      default: return '#FFFFFF';
    }
  };

  const getStatusLabel = (status: RepairOrder['status']) => {
    switch (status) {
      case 'InProgress': return 'IN PROGRESS';
      case 'Accepted': return 'ACCEPTED';
      case 'Completed': return 'COMPLETED';
      case 'Cancelled': return 'CANCELLED';
      default: return status.toUpperCase();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#00F0FF" />
          <Text style={styles.loadingText}>Loading Your Orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>REPAIR QUEUE</Text>
          <Pressable 
            style={styles.iconButton}
            onPress={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={24} color="#00F0FF" />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>
        
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Pressable 
              style={[
                styles.filterButton, 
                activeFilter === 'all' && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'all' && styles.activeFilterText
              ]}>ALL</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.filterButton, 
                activeFilter === 'InProgress' && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter('InProgress')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'InProgress' && styles.activeFilterText
              ]}>IN PROGRESS</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.filterButton, 
                activeFilter === 'Accepted' && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter('Accepted')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'Accepted' && styles.activeFilterText
              ]}>ACCEPTED</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.filterButton, 
                activeFilter === 'Completed' && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter('Completed')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'Completed' && styles.activeFilterText
              ]}>COMPLETED</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.filterButton, 
                activeFilter === 'Cancelled' && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter('Cancelled')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'Cancelled' && styles.activeFilterText
              ]}>CANCELLED</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {getFilteredOrders().map((item) => {
          const placeholderAvatar = 'https://via.placeholder.com/48?text=User';
          const displayCustomerName = item.customerId.substring(0, 8) + '...';
          const displayVehicle = item.items[0]?.vehicleDisplay || 'Vehicle not specified';
          const displayService = item.items[0]?.name || 'Service not specified';
          const displayLocation = `${item.locationDetails.address}, ${item.locationDetails.city}`;
          const displayNotes = item.locationDetails.additionalNotes || 'No additional notes provided.';

          return (
          <Pressable key={item.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.customerInfo}>
                <Image source={{ uri: placeholderAvatar }} style={styles.customerImage} />
                <View>
                  <Text style={styles.customerName}>{displayCustomerName.toUpperCase()}</Text>
                  <Text style={styles.vehicleText}>{displayVehicle}</Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(item.status)}20` }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) }
                ]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
            
            <View style={styles.serviceInfo}>
              <View style={styles.serviceIconContainer}>
                <Tool size={24} color="#00F0FF" />
              </View>
              <View style={styles.serviceDetails}>
                <Text style={styles.serviceTitle}>{displayService}</Text>
              </View>
            </View>
            
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>LOCATION & NOTES:</Text>
              <Text style={styles.notesText}>{displayLocation}</Text>
              <Text style={styles.notesText}>{displayNotes}</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <Pressable 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Requests', { screen: 'UpdateStatus', params: { orderId: item.id } })}
              >
                <Text style={styles.actionButtonText}>UPDATE STATUS</Text>
              </Pressable>
              <Pressable 
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => navigation.navigate('RequestContact', { orderId: item.id })}
              >
                <Text style={styles.secondaryButtonText}>CONTACT CUSTOMER</Text>
              </Pressable>
            </View>
          </Pressable>
          )}
        )}
      </ScrollView>

      {showNotifications && (
        <NotificationPanel
          notifications={[
            {
              id: '1',
              title: 'NEW REPAIR ORDER',
              message: 'Emily Rodriguez has requested a battery jump start',
              timestamp: '2 minutes ago',
              read: false,
            },
            {
              id: '2',
              title: 'ORDER UPDATED',
              message: 'Michael Chen changed the service time',
              timestamp: '1 hour ago',
              read: false,
            },
          ]}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={() => {}}
          onMarkAllAsRead={() => {}}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3D71',
  },
  filterContainer: {
    marginTop: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  activeFilterButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: '#00F0FF',
  },
  filterText: {
    color: '#7A89FF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  activeFilterText: {
    color: '#00F0FF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'rgba(26, 33, 56, 1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  vehicleText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  serviceInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 4,
  },
  notesContainer: {
    backgroundColor: 'rgba(42, 53, 85, 0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00F0FF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#00F0FF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  secondaryButton: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderColor: '#7A89FF',
  },
  secondaryButtonText: {
    color: '#7A89FF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#7A89FF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
  },
  errorText: {
    color: '#FF3D71',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
  },
}); 