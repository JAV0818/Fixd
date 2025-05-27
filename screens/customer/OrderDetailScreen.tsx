import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Clock, Wrench, User, PhoneCall, Car, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { firestore, auth } from '@/lib/firebase';
import { doc, getDoc, Timestamp, collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// Define a more specific Order type based on what's stored and needed
// This should align with the structure in `repairOrders` collection
export type Order = {
  id: string;
  customerId: string;
  items: Array<{
    id: string; // Service ID
    name: string;
    price: number;
    quantity: number;
    vehicleId?: string;
    vehicleDisplay?: string;
  }>;
  totalPrice: number;
  status: 'Pending' | 'Scheduled' | 'In-Progress' | 'Completed' | 'Cancelled';
  createdAt: Timestamp; // Firestore Timestamp
  locationDetails: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phoneNumber: string;
    additionalNotes?: string;
  };
  providerId?: string | null;
  providerName?: string | null; // Optional: if we denormalize mechanic name
  estimatedArrival?: string; // This might come from provider updates later
  // Add any other fields that are part of your order structure
};

// Define PreAcceptanceChatMessage structure (can be moved to a types file later)
interface PreAcceptanceChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
  sentBy: 'customer' | 'provider';
}

type OrderDetailScreenRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;
type OrderDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderDetail'>;

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
  
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [mechanicDetails, setMechanicDetails] = useState<{ name?: string; photo?: string | null; experience?: string; rating?: number, phone?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preAcceptanceMessages, setPreAcceptanceMessages] = useState<PreAcceptanceChatMessage[]>([]);
  const [loadingPreAcceptanceMessages, setLoadingPreAcceptanceMessages] = useState(false);

  useEffect(() => {
    const fetchOrderAndRelatedDetails = async () => {
      if (!orderId) {
        setError("Order ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const orderDocRef = doc(firestore, 'repairOrders', orderId);
        const orderDocSnap = await getDoc(orderDocRef);

        if (orderDocSnap.exists()) {
          const orderData = orderDocSnap.data() as Order;
          orderData.id = orderDocSnap.id; // Ensure ID is part of the object
          setOrderDetails(orderData);

          if (orderData.providerId) {
            const providerDocRef = doc(firestore, 'users', orderData.providerId);
            const providerDocSnap = await getDoc(providerDocRef);
            if (providerDocSnap.exists()) {
              const providerData = providerDocSnap.data();
              setMechanicDetails({
                name: `${providerData.firstName} ${providerData.lastName}`,
                photo: providerData.profilePictureUrl || null,
                // Assuming these fields exist on provider's user document
                experience: providerData.yearsOfExperience ? `${providerData.yearsOfExperience} years` : 'N/A',
                rating: providerData.averageRating || 0, // Default to 0 if not present
                phone: providerData.phone || 'N/A',
              });
            } else {
              console.warn("Mechanic document not found for providerId:", orderData.providerId);
              setMechanicDetails({ name: 'Assigned (Details N/A)' }); // Fallback if provider doc not found
            }
          } else {
            setMechanicDetails(null); // No provider assigned
            // If pending and no provider, fetch pre-acceptance messages
            if (orderData.status === 'Pending') {
              setLoadingPreAcceptanceMessages(true);
              const preAcceptChatRef = collection(firestore, 'repairOrders', orderId, 'preAcceptanceChats');
              const q = query(preAcceptChatRef, orderBy('createdAt', 'asc'));
              const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedMessages = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                } as PreAcceptanceChatMessage));
                setPreAcceptanceMessages(fetchedMessages);
                setLoadingPreAcceptanceMessages(false);
              }, (err) => {
                console.error("Error fetching pre-acceptance chats:", err);
                setLoadingPreAcceptanceMessages(false);
              });
              // It's important to return the unsubscribe function from the effect 
              // if this logic remains directly in this useEffect. 
              // However, onSnapshot might be better managed if this component unmounts.
              // For now, this demonstrates fetching. Consider cleanup if component can unmount while subscribed.
            }
          }
        } else {
          setError("Order not found.");
          console.error("No such document for orderId:", orderId);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError("Failed to fetch order details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndRelatedDetails();
  }, [orderId]);

  const handleChatWithProviderPress = () => {
    if (orderDetails?.providerId && mechanicDetails?.name) {
      navigation.navigate('MechanicChat', { orderId: orderDetails.id, mechanicName: mechanicDetails.name });
    } else {
      // Alert.alert("Chat Unavailable", "No mechanic has been assigned to this order yet.");
    }
  };

  const handlePreAcceptanceChatPress = () => {
    if (orderDetails) {
      // Navigate to a new or adapted chat screen for pre-acceptance messages
      // For now, let's assume a screen named 'PreAcceptanceChatScreen'
      navigation.navigate('PreAcceptanceChat', { orderId: orderDetails.id });
    }
  };
  
  const formatTimestamp = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#00F0FF" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <AlertCircle size={48} color="#FF3D71" style={{ marginBottom: 16 }}/>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.goBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (!orderDetails) {
    // This case should ideally be covered by the error state if orderId was valid but not found
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
         <AlertCircle size={48} color="#FF3D71" style={{ marginBottom: 16 }}/>
        <Text style={styles.errorText}>Order details are unavailable.</Text>
        <Pressable style={styles.goBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isActive = orderDetails.status === 'In-Progress' || orderDetails.status === 'Scheduled' || orderDetails.status === 'Pending';
  const isCompleted = orderDetails.status === 'Completed';
  
  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'Pending Assignment';
      case 'Scheduled': return 'Mechanic Assigned';
      case 'In-Progress': return 'Service In Progress';
      case 'Completed': return 'Service Completed';
      case 'Cancelled': return 'Order Cancelled';
      default: return 'Status Unknown';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButtonHeader}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <Text style={styles.headerTitle}>Order #{orderId.substring(0, 6)}...</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status Banner */}
        <View style={[
            styles.statusBanner, 
            orderDetails.status === 'Completed' ? styles.completedStatusBanner : 
            orderDetails.status === 'Cancelled' ? styles.cancelledStatusBanner : 
            styles.activeStatusBanner
        ]}>
          <View style={styles.statusIconContainer}>
            {orderDetails.status === 'Completed' ? <CheckCircle size={24} color="#FFFFFF" /> :
             orderDetails.status === 'Cancelled' ? <AlertCircle size={24} color="#FFFFFF" /> :
             <Clock size={24} color="#FFFFFF" />}
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>{getStatusLabel(orderDetails.status)}</Text>
            { (orderDetails.status === 'Pending' || orderDetails.status === 'Scheduled') && mechanicDetails?.name && (
                <Text style={styles.statusDescription}>Mechanic: {mechanicDetails.name}</Text>
            )}
            { orderDetails.status === 'In-Progress' && orderDetails.estimatedArrival && (
                <Text style={styles.statusDescription}>Estimated arrival in {orderDetails.estimatedArrival}</Text>
            )}
             { orderDetails.status === 'Pending' && !orderDetails.providerId && (
                <Text style={styles.statusDescription}>Searching for a mechanic...</Text>
            )}
          </View>
        </View>

        {/* Service Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          
          {orderDetails.items.map((item, index) => (
            <View key={index} style={styles.serviceItemContainer}>
              <View style={styles.infoRow}>
                <Wrench size={18} color="#7A89FF" />
                <Text style={styles.infoLabel}>Service:</Text>
                <Text style={styles.infoValue}>{item.name}</Text>
              </View>
              {item.vehicleDisplay && (
                <View style={styles.infoRow}>
                  <Car size={18} color="#7A89FF" />
                  <Text style={styles.infoLabel}>For Vehicle:</Text>
                  <Text style={styles.infoValue}>{item.vehicleDisplay}</Text>
                </View>
              )}
               <View style={styles.infoRow}>
                 <Text style={styles.infoLabel}>Price:</Text>
                 <Text style={styles.infoValue}>${item.price.toFixed(2)} (Qty: {item.quantity})</Text>
               </View>
            </View>
          ))}
          
          <View style={styles.infoRow}>
            <Clock size={18} color="#7A89FF" />
            <Text style={styles.infoLabel}>Requested:</Text>
            <Text style={styles.infoValue}>{formatTimestamp(orderDetails.createdAt)}</Text>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={18} color="#7A89FF" />
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>
              {orderDetails.locationDetails.address}, {orderDetails.locationDetails.city}, {orderDetails.locationDetails.state} {orderDetails.locationDetails.zipCode}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <PhoneCall size={18} color="#7A89FF" />
            <Text style={styles.infoLabel}>Contact #:</Text>
            <Text style={styles.infoValue}>{orderDetails.locationDetails.phoneNumber}</Text>
          </View>

          {orderDetails.locationDetails.additionalNotes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Additional Notes:</Text>
              <Text style={styles.notesText}>{orderDetails.locationDetails.additionalNotes}</Text>
            </View>
          )}
        </View>

        {/* Assigned Mechanic - Updated Logic */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Assigned Mechanic</Text>
          
          {orderDetails.providerId && mechanicDetails ? (
            <>
              <View style={styles.mechanicContainer}>
                {mechanicDetails.photo ? (
                  <Image 
                    source={{ uri: mechanicDetails.photo }} 
                    style={styles.mechanicPhoto} 
                  />
                ) : (
                  <MechanicAvatar />
                )}
                
                <View style={styles.mechanicInfo}>
                  <Text style={styles.mechanicName}>{mechanicDetails.name || 'N/A'}</Text>
                  <Text style={styles.mechanicDetail}>Experience: {mechanicDetails.experience || 'N/A'}</Text>
                  <Text style={styles.mechanicDetail}>Rating: {mechanicDetails.rating ? mechanicDetails.rating.toFixed(1) : 'N/A'}/5.0</Text>
                </View>
              </View>

              <View style={styles.contactButtonsContainer}>
                 {mechanicDetails.phone && mechanicDetails.phone !== 'N/A' && (
                    <Pressable style={styles.callButton} onPress={() => {/* Implement call functionality */}}>
                        <PhoneCall size={20} color="#FFFFFF" />
                        <Text style={styles.contactButtonText}>Call Mechanic</Text>
                    </Pressable>
                 )}
                <Pressable 
                    style={styles.chatButton} 
                    onPress={handleChatWithProviderPress} 
                    disabled={!orderDetails.providerId}
                >
                  <MessageCircle size={20} color="#FFFFFF" />
                  <Text style={styles.contactButtonText}>Chat with Mechanic</Text>
                </Pressable>
              </View>
            </>
          ) : (
            // Show if order is pending and no provider is assigned
            orderDetails.status === 'Pending' && !orderDetails.providerId ? (
              <View style={styles.infoRow}>
                  <MessageCircle size={18} color="#7A89FF" />
                  <Pressable onPress={handlePreAcceptanceChatPress} style={styles.inlineButton}>
                    <Text style={styles.inlineButtonText}>
                      {preAcceptanceMessages.length > 0 ? `View Messages (${preAcceptanceMessages.length})` : 'Chat with Support'}
                    </Text>
                  </Pressable>
              </View>
            ) : (
              <View style={styles.infoRow}>
                  <User size={18} color="#7A89FF" />
                  <Text style={styles.infoValue}>Searching for a mechanic...</Text>
              </View>
            )
          )}
        </View>

        {/* Payment Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          
          <View style={styles.paymentContainer}>
            <Text style={styles.paymentLabel}>Total Amount:</Text>
            <Text style={styles.paymentAmount}>${orderDetails.totalPrice.toFixed(2)}</Text>
          </View>
          
          <Text style={styles.paymentStatus}>
            {isCompleted ? 'Payment processed' : 'Payment will be processed upon service completion'}
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
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: '#00F0FF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#030515',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
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
  backButtonHeader: {
    padding: 4,
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
  cancelledStatusBanner: {
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FF3D71',
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
  serviceItemContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 53, 85, 0.5)',
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
    flexWrap: 'wrap',
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
    borderTopColor: 'rgba(42, 53, 85, 0.5)',
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
    justifyContent: 'space-around',
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
  inlineButton: {
    marginLeft: 10,
    flex: 1,
  },
  inlineButtonText: {
    color: '#00F0FF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textDecorationLine: 'underline',
  },
}); 