import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, PenTool as Tool, Clock, Activity, Filter, Search } from 'lucide-react-native';
import NotificationPanel from '../../components/NotificationPanel';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

// Mock data for repair orders
const repairOrdersData = [
  {
    id: 'order1',
    customer: {
      name: 'Emily Rodriguez',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=60',
      rating: 4.8,
    },
    vehicle: '2024 Tesla Model S',
    service: 'Battery Jump Start',
    status: 'in-progress',
    startTime: '10:30 AM',
    estimatedCompletion: '11:45 AM',
    location: '123 Main St, San Francisco',
    urgency: 'high',
    notes: 'Customer needs vehicle ASAP for work',
  },
  {
    id: 'order2',
    customer: {
      name: 'Michael Chen',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60',
      rating: 4.9,
    },
    vehicle: '2023 BMW iX',
    service: 'Tire Change',
    status: 'scheduled',
    startTime: '2:00 PM',
    estimatedCompletion: '3:00 PM',
    location: '456 Oak Ave, San Francisco',
    urgency: 'medium',
    notes: 'Flat tire on front passenger side',
  },
  {
    id: 'order3',
    customer: {
      name: 'James Wilson',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60',
      rating: 4.7,
    },
    vehicle: '2022 Ford Mustang',
    service: 'Oil Change',
    status: 'waiting',
    startTime: '3:30 PM',
    estimatedCompletion: '4:15 PM',
    location: '789 Pine St, San Francisco',
    urgency: 'low',
    notes: 'Regular maintenance',
  },
];

export default function RepairOrdersScreen() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const getFilteredOrders = () => {
    if (activeFilter === 'all') return repairOrdersData;
    return repairOrdersData.filter(order => order.status === activeFilter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return '#00F0FF';
      case 'scheduled':
        return '#7A89FF';
      case 'waiting':
        return '#FFB800';
      default:
        return '#FFFFFF';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'IN PROGRESS';
      case 'scheduled':
        return 'SCHEDULED';
      case 'waiting':
        return 'WAITING';
      default:
        return status.toUpperCase();
    }
  };

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
                activeFilter === 'in-progress' && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter('in-progress')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'in-progress' && styles.activeFilterText
              ]}>IN PROGRESS</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.filterButton, 
                activeFilter === 'scheduled' && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter('scheduled')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'scheduled' && styles.activeFilterText
              ]}>SCHEDULED</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.filterButton, 
                activeFilter === 'waiting' && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter('waiting')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'waiting' && styles.activeFilterText
              ]}>WAITING</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {getFilteredOrders().map((order) => (
          <Pressable key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.customerInfo}>
                <Image source={{ uri: order.customer.image }} style={styles.customerImage} />
                <View>
                  <Text style={styles.customerName}>{order.customer.name.toUpperCase()}</Text>
                  <Text style={styles.vehicleText}>{order.vehicle}</Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(order.status)}20` }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) }
                ]}>
                  {getStatusLabel(order.status)}
                </Text>
              </View>
            </View>
            
            <View style={styles.serviceInfo}>
              <View style={styles.serviceIconContainer}>
                <Tool size={24} color="#00F0FF" />
              </View>
              <View style={styles.serviceDetails}>
                <Text style={styles.serviceTitle}>{order.service}</Text>
                <View style={styles.timeContainer}>
                  <Clock size={14} color="#7A89FF" />
                  <Text style={styles.timeText}>
                    {order.startTime} - {order.estimatedCompletion}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>NOTES:</Text>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <Pressable 
                style={styles.actionButton}
                onPress={() => navigation.navigate('UpdateStatus', { orderId: order.id })}
              >
                <Text style={styles.actionButtonText}>UPDATE STATUS</Text>
              </Pressable>
              <Pressable 
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => navigation.navigate('RequestContact', { requestId: order.id })}
              >
                <Text style={styles.secondaryButtonText}>CONTACT CUSTOMER</Text>
              </Pressable>
            </View>
          </Pressable>
        ))}
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
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#D0DFFF',
    marginLeft: 4,
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
}); 