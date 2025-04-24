import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Clock, Wrench, User, PhoneCall, Car, MessageCircle, CheckCircle } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

type OrderDetailScreenRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;
type OrderDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderDetail'>;

// This would be fetched from the backend in a real app
const MOCK_ORDER_DETAILS = {
  id: '1',
  service: 'Battery Jump Start',
  date: '2023-05-15',
  time: '14:30',
  status: 'in-progress',
  location: '123 Main St, Anytown, CA 92101',
  estimatedArrival: '15 mins',
  description: 'Vehicle won\'t start. Battery appears to be dead. No other visible issues.',
  vehicle: {
    make: 'Toyota',
    model: 'Camry',
    year: '2019',
    color: 'Silver',
    licensePlate: 'ABC-1234',
  },
  assignedMechanic: {
    name: 'Michael Rodriguez',
    rating: 4.8,
    phone: '(555) 123-4567',
    experience: '8 years',
    photo: null, // Would be an image URL
  },
  paymentAmount: 75.99,
  additionalNotes: 'Please bring jumper cables and battery testing equipment.',
};

// Mechanic avatar placeholder component
const MechanicAvatar = () => (
  <View style={styles.avatarPlaceholder}>
    <User size={32} color="#FFFFFF" />
  </View>
);

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<OrderDetailScreenNavigationProp>();
  const route = useRoute<OrderDetailScreenRouteProp>();
  const { orderId } = route.params;
  
  const [orderDetails, setOrderDetails] = useState<typeof MOCK_ORDER_DETAILS | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch order details
    const fetchOrderDetails = async () => {
      try {
        // This would be an actual API call in a real app
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        setOrderDetails(MOCK_ORDER_DETAILS);
      } catch (error) {
        console.error('Error fetching order details:', error);
        // Handle error state
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleChatPress = () => {
    navigation.navigate('MechanicChat', { orderId, mechanicName: orderDetails?.assignedMechanic.name });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#00F0FF" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!orderDetails) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Failed to load order details.</Text>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isActive = orderDetails.status === 'in-progress';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status Banner */}
        <View style={[styles.statusBanner, isActive ? styles.activeStatusBanner : styles.completedStatusBanner]}>
          <View style={styles.statusIconContainer}>
            {isActive ? (
              <Clock size={24} color="#FFFFFF" />
            ) : (
              <CheckCircle size={24} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>{isActive ? 'In Progress' : 'Completed'}</Text>
            <Text style={styles.statusDescription}>
              {isActive 
                ? `Estimated arrival in ${orderDetails.estimatedArrival}`
                : 'Service has been completed'}
            </Text>
          </View>
        </View>

        {/* Service Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          
          <View style={styles.infoRow}>
            <Wrench size={18} color="#7A89FF" />
            <Text style={styles.infoLabel}>Service:</Text>
            <Text style={styles.infoValue}>{orderDetails.service}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Clock size={18} color="#7A89FF" />
            <Text style={styles.infoLabel}>Date & Time:</Text>
            <Text style={styles.infoValue}>{orderDetails.date} at {orderDetails.time}</Text>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={18} color="#7A89FF" />
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{orderDetails.location}</Text>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description:</Text>
            <Text style={styles.descriptionText}>{orderDetails.description}</Text>
          </View>

          {orderDetails.additionalNotes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Additional Notes:</Text>
              <Text style={styles.notesText}>{orderDetails.additionalNotes}</Text>
            </View>
          )}
        </View>

        {/* Vehicle Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          
          <View style={styles.infoRow}>
            <Car size={18} color="#7A89FF" />
            <Text style={styles.infoLabel}>Vehicle:</Text>
            <Text style={styles.infoValue}>
              {orderDetails.vehicle.year} {orderDetails.vehicle.make} {orderDetails.vehicle.model}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.colorCircle, { backgroundColor: orderDetails.vehicle.color.toLowerCase() }]} />
            <Text style={styles.infoLabel}>Color:</Text>
            <Text style={styles.infoValue}>{orderDetails.vehicle.color}</Text>
          </View>

          <View style={styles.infoRow}>
            <Car size={18} color="#7A89FF" />
            <Text style={styles.infoLabel}>License Plate:</Text>
            <Text style={styles.infoValue}>{orderDetails.vehicle.licensePlate}</Text>
          </View>
        </View>

        {/* Assigned Mechanic */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Assigned Mechanic</Text>
          
          <View style={styles.mechanicContainer}>
            {orderDetails.assignedMechanic.photo ? (
              <Image 
                source={{ uri: orderDetails.assignedMechanic.photo }} 
                style={styles.mechanicPhoto} 
              />
            ) : (
              <MechanicAvatar />
            )}
            
            <View style={styles.mechanicInfo}>
              <Text style={styles.mechanicName}>{orderDetails.assignedMechanic.name}</Text>
              <Text style={styles.mechanicDetail}>Experience: {orderDetails.assignedMechanic.experience}</Text>
              <Text style={styles.mechanicDetail}>Rating: {orderDetails.assignedMechanic.rating}/5.0</Text>
            </View>
          </View>

          <View style={styles.contactButtonsContainer}>
            <Pressable style={styles.callButton}>
              <PhoneCall size={20} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>Call</Text>
            </Pressable>
            
            <Pressable style={styles.chatButton} onPress={handleChatPress}>
              <MessageCircle size={20} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>Chat</Text>
            </Pressable>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          
          <View style={styles.paymentContainer}>
            <Text style={styles.paymentLabel}>Total Amount:</Text>
            <Text style={styles.paymentAmount}>${orderDetails.paymentAmount.toFixed(2)}</Text>
          </View>
          
          <Text style={styles.paymentStatus}>
            {isActive ? 'Payment will be processed upon completion' : 'Payment processed'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030515',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030515',
    padding: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontFamily: 'Inter_400Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030515',
    padding: 20,
  },
  errorText: {
    color: '#FF3D71',
    fontSize: 16,
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0A0F1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    color: '#00F0FF',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  activeStatusBanner: {
    backgroundColor: 'rgba(122, 137, 255, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#7A89FF',
  },
  completedStatusBanner: {
    backgroundColor: 'rgba(56, 229, 77, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#38E54D',
  },
  statusIconContainer: {
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  statusDescription: {
    color: '#D0DFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  sectionContainer: {
    backgroundColor: 'rgba(10, 15, 30, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  sectionTitle: {
    color: '#00F0FF',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginLeft: 10,
    width: 100,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
  },
  descriptionLabel: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  descriptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
  },
  notesLabel: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  notesText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  colorCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  mechanicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mechanicPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2A3555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mechanicInfo: {
    flex: 1,
  },
  mechanicName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  mechanicDetail: {
    color: '#D0DFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  contactButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7A89FF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00F0FF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginLeft: 8,
  },
  paymentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentLabel: {
    color: '#7A89FF',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  paymentAmount: {
    color: '#00F0FF',
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  paymentStatus: {
    color: '#D0DFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    textAlign: 'center',
  },
}); 