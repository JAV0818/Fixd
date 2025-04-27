import { View, Text, ScrollView, StyleSheet, Image, Pressable, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Search, Bell, Star, Wrench, Clock, MapPin, Zap, Car, Navigation, ShoppingCart, PlusCircle } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import NotificationPanel from '../../components/NotificationPanel';
// import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator'; // We need Root here to navigate outside tabs
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import the hook
import { useCart } from '@/contexts/CartContext'; // Import cart context
// Import the individual card components
import EmergencyServiceCard, { EmergencyServiceProps } from '@/components/services/EmergencyServiceCard';
import ServiceCard, { ServiceItemProps } from '@/components/services/ServiceCard'; // Assuming ServiceCard uses ServiceItemProps
import { auth, firestore } from '@/lib/firebase'; // Import Firebase
import { collection, query, where, onSnapshot } from 'firebase/firestore'; // Import Firestore query functions

// Define Service Category structure locally now
interface ServiceCategory {
  title: string;
  services: ServiceItemProps[];
}

// Data for emergency services
const emergencyServicesData: EmergencyServiceProps[] = [
  {
    id: 'battery-jump-start',
    title: 'Battery Jump Start',
    image: require('../../img_assets/battery jump.jpeg'),
    price: 'From $50',
    eta: '20-30 min',
  },
  {
    id: 'flat-tire-change',
    title: 'Flat Tire Change',
    image: require('../../img_assets/flat tire change.jpeg'),
    price: 'From $45',
    eta: '15-25 min',
  },
  {
    id: 'fuel-delivery',
    title: 'Fuel Delivery',
    image: require('../../img_assets/fuel delievery.png'),
    price: 'From $40',
    eta: '25-35 min',
  },
];

// Data for service categories
const serviceCategoriesData: ServiceCategory[] = [
  {
    title: 'Maintenance Services',
    services: [
      {
        id: 'oil-change',
        name: 'Oil Change Service',
        description: 'Complete oil & filter change with fluid check',
        image: require('../../img_assets/Oil.png'),
        price: 'From $40',
      },
      {
        id: 'diagnostics',
        name: 'Diagnostics',
        description: 'Full vehicle health diagnostics check',
        image: require('../../img_assets/diagnostics.png'),
        price: 'From $70',
      },
      {
        id: 'brake-inspection',
        name: 'Brake Repairs',
        description: 'Complete brake system inspection',
        image: require('../../img_assets/Brake.png'),
        price: 'From $50',
      },
      {
        id: 'test-free-service', 
        name: 'Free System Checkup',
        description: 'Complimentary basic system check.',
        image: require('../../img_assets/diagnostics.png'), // Re-use image
        price: '$0', // Display price as $0
      },
    ],
  },
];

// Define Vehicle type
interface Vehicle {
  id: string; // Firestore document ID
  make: string;
  model: string;
  year: number;
  // Add other fields like vin, licensePlate, color etc. as needed
}

export default function HomeScreen() {
  // const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets(); // Get safe area insets
  const { state: cartState, dispatch: cartDispatch } = useCart(); // Get cart state AND dispatch
  const [showNotifications, setShowNotifications] = useState(false);
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null); // State for selected vehicle

  // Fetch user vehicles (example using onSnapshot for real-time updates)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoadingVehicles(false);
      return; // Not logged in
    }

    const vehiclesRef = collection(firestore, 'users', user.uid, 'vehicles');
    const q = query(vehiclesRef); // Can add orderBy later if needed

    setLoadingVehicles(true);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedVehicles: Vehicle[] = [];
      querySnapshot.forEach((doc) => {
        fetchedVehicles.push({ id: doc.id, ...doc.data() } as Vehicle);
      });
      setUserVehicles(fetchedVehicles);
      // Automatically select the first vehicle if only one exists
      if (fetchedVehicles.length === 1) {
        setSelectedVehicleId(fetchedVehicles[0].id);
      }
      setLoadingVehicles(false);
    }, (error) => {
      console.error("Error fetching vehicles: ", error);
      setLoadingVehicles(false);
      // Handle error display if needed
    });

    // Clean up listener on unmount
    return () => unsubscribe(); 
  }, []); // Run once on mount

  const handleCartPress = () => {
    navigation.navigate('Cart');
  };

  // Reverted handleServiceSelect to navigate, not add directly to cart
  const handleServiceSelect = (serviceId: string) => {
    // Check if a vehicle selection is required
    if (userVehicles.length > 1 && !selectedVehicleId) {
      Alert.alert(
        "Select Vehicle",
        "Please select the vehicle you want to service first."
      );
      return;
    }
    
    // Determine the vehicle ID to pass (handle single vehicle case)
    const vehicleIdToPass = userVehicles.length === 1 ? userVehicles[0].id : selectedVehicleId;
    
    // Always navigate to ServiceDetail, passing serviceId and vehicleId
    // We no longer differentiate BatteryJumpStart here, let ServiceDetail handle it or create specific screens later
    navigation.navigate('ServiceDetail', { id: serviceId, vehicleId: vehicleIdToPass });
    
    // Remove direct cart dispatch logic
    /* 
    const vehicleIdToUse = userVehicles.length === 1 ? userVehicles[0].id : selectedVehicleId;

    if (!vehicleIdToUse) {
       Alert.alert("No Vehicle", "Cannot add service without a vehicle.");
       return;
    }

    // Example: Add to cart logic (replace with your actual add to cart)
    // Find the full vehicle object for display purposes
    const selectedVehicle = userVehicles.find(v => v.id === vehicleIdToUse);
    const vehicleDisplay = selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : 'Unknown Vehicle';

    // Use type guard to safely access title or name
    const serviceName = 'title' in service ? service.title : service.name;

    console.log(`Adding service '${serviceName}' for vehicle ID: ${vehicleIdToUse}`);
    cartDispatch({ 
      type: 'ADD_ITEM', 
      payload: { 
        item: { 
          id: service.id,
          name: serviceName, // Use the determined name
          price: parseFloat(service.price?.replace('From $', '') || '0'), // Extract price
          quantity: 1, 
          // ---- Include vehicle info ----
          vehicleId: vehicleIdToUse,
          vehicleDisplay: vehicleDisplay,
          // ---- Add other service specific details if needed ----
        } 
      }
    });
    Alert.alert("Added to Cart", `${serviceName} added for ${vehicleDisplay}.`);
    */
  };

  const handleAddVehicle = () => {
    navigation.navigate('AddVehicle'); // Navigate to the new screen
  };

  // Render item for vehicle list - Now Pressable and indicates selection
  const renderVehicleItem = ({ item }: { item: Vehicle }) => {
    const isSelected = item.id === selectedVehicleId;
    return (
      <Pressable 
        style={[styles.vehicleItem, isSelected && styles.selectedVehicleItem]}
        onPress={() => setSelectedVehicleId(item.id)}
      >
        <Car size={20} color={isSelected ? "#FFFFFF" : "#7A89FF"} />
        <Text style={[styles.vehicleText, isSelected && styles.selectedVehicleText]}>
          {`${item.year} ${item.make} ${item.model}`}
        </Text>
        {/* Add options like delete or edit later */}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>WELCOME BACK</Text>
            <Text style={styles.name}>JULIAN</Text>
          </View>
          <View style={styles.headerIconsContainer}>
            <Pressable 
              style={styles.iconButton}
              onPress={handleCartPress}
            >
              <ShoppingCart size={28} color="#00F0FF" />
              {cartState.totalItems > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartState.totalItems}</Text>
                </View>
              )}
            </Pressable>
            <Pressable style={styles.iconButton}>
              <MapPin size={24} color="#00F0FF" />
            </Pressable>
            <Pressable 
              style={styles.iconButton}
              onPress={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={24} color="#00F0FF" />
              <View style={styles.notificationDot} />
            </Pressable>
          </View>
        </View>
        
        {/* Address and Vehicle Section Combined */}
        <View style={styles.addressAndVehiclesContainer}>
          {/* Your Vehicles Section */}
          <View style={styles.vehiclesHeaderSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>YOUR VEHICLES</Text>
              <Car size={24} color="#00F0FF" />
            </View>
            {/* Display Vehicle List or Loading/Empty State */} 
            {loadingVehicles ? (
               <ActivityIndicator color="#00F0FF" style={{ marginVertical: 10 }}/>
            ) : userVehicles.length > 0 ? (
              <FlatList 
                data={userVehicles}
                renderItem={renderVehicleItem}
                keyExtractor={item => item.id}
                horizontal={true} // Display horizontally for now
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vehicleListContainer}
              />
            ) : (
              <Text style={styles.noVehiclesText}>No vehicles added yet.</Text>
            )}
            {/* Add Vehicle Button */} 
            <Pressable 
              style={styles.addVehicleButtonHeader}
              onPress={handleAddVehicle}
            >
              <PlusCircle size={18} color="#00F0FF" />
              <Text style={styles.addVehicleText}>ADD A VEHICLE</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>EMERGENCY SERVICES</Text>
            <Wrench size={24} color="#00F0FF" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContainer}>
            {emergencyServicesData.map((service) => (
              <EmergencyServiceCard
                key={service.id}
                service={service}
                onPress={() => handleServiceSelect(service.id)} // Pass only service ID
              />
            ))}
          </ScrollView>
        </View>

        {/* Service Categories Section */}
        {serviceCategoriesData.map((category, index) => (
          <View key={`category-${index}`} style={styles.section}> 
            <View style={styles.sectionHeader}> 
              <Text style={styles.sectionTitle}>{category.title}</Text>
            </View>
            <View style={styles.serviceCardsContainer}> 
              {category.services.map((service: ServiceItemProps) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onPress={() => handleServiceSelect(service.id)} // Pass only service ID
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {showNotifications && (
        <NotificationPanel
          notifications={[
            {
              id: '1',
              title: 'TECHNICIAN EN ROUTE',
              message: 'Aaren is 10 minutes from your location',
              timestamp: '2 minutes ago',
              read: false,
            },
            {
              id: '2',
              title: 'BOOKING CONFIRMED',
              message: 'Your service is scheduled for tomorrow at 10 AM',
              timestamp: '1 hour ago',
              read: true,
            },
          ]}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={(id: string) => console.log('Notification pressed:', id)}
          onMarkAllAsRead={() => {}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030515',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  greeting: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    letterSpacing: 2,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  headerIconsContainer: {
    flexDirection: 'row',
    gap: 8,
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
  addressAndVehiclesContainer: {
    marginTop: 10,
    backgroundColor: '#1A2138',
    borderRadius: 12,
    padding: 15,
  },
  vehiclesHeaderSection: {
    paddingTop: 0,
  },
  addVehicleButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the add button text/icon
    backgroundColor: '#2A3555',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10, 
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3D71',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    lineHeight: 14,
  },
  addVehicleText: {
    color: '#00F0FF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  horizontalScrollContainer: {
    paddingLeft: 16, // Match section padding
    paddingRight: 4, // Allow last card margin
  },
  serviceCardsContainer: {
    paddingHorizontal: 16, // Add horizontal padding for vertical cards
    gap: 16, // Add gap between vertical cards
  },
  vehicleListContainer: {
    paddingVertical: 10, 
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 53, 85, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  vehicleText: {
    color: '#D0DFFF',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginLeft: 6,
  },
  selectedVehicleItem: {
    backgroundColor: '#0080FF', // Highlight color for selected vehicle
    borderColor: '#00F0FF',
    borderWidth: 1,
  },
  selectedVehicleText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  noVehiclesText: {
    color: '#7A89FF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginVertical: 10,
  },
}); 