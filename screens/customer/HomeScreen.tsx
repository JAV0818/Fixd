import { View, Text, ScrollView, StyleSheet, Image, Pressable, TextInput } from 'react-native';
import { Search, Bell, Star, Wrench, Clock, MapPin, Zap, Car, Navigation, ShoppingCart, PlusCircle } from 'lucide-react-native';
import { useState } from 'react';
import NotificationPanel from '../../components/NotificationPanel';
// import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator'; // We need Root here to navigate outside tabs
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import the hook
import { useCart } from '@/contexts/CartContext'; // Import cart context
import EmergencyServicesList from '@/components/services/EmergencyServicesList';
import ServiceCategoryList from '@/components/services/ServiceCategoryList';
import { EmergencyServiceProps } from '@/components/services/EmergencyServiceCard';
import { ServiceCategoryProps } from '@/components/services/ServiceCategoryList';

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
const serviceCategoriesData: ServiceCategoryProps[] = [
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
    ],
  },
];

export default function HomeScreen() {
  // const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets(); // Get safe area insets
  const { state: cartState } = useCart(); // Get cart state
  const [showNotifications, setShowNotifications] = useState(false);

  const handleCartPress = () => {
    navigation.navigate('Cart');
  };

  const handleServiceSelect = (serviceId: string) => {
    // Specific handling for battery jump start
    if (serviceId === 'battery-jump-start') {
      navigation.navigate('BatteryJumpStart');
    } else {
      // Generic handling for other services
      navigation.navigate('ServiceDetail', { id: serviceId });
    }
  };

  const handleAddVehicle = () => {
    // This will eventually navigate to the add vehicle form
    alert('Add vehicle functionality coming soon!');
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
        {/* Emergency Services List Component */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>EMERGENCY SERVICES</Text>
            <Wrench size={24} color="#00F0FF" />
          </View>
          <EmergencyServicesList 
            services={emergencyServicesData}
            onServiceSelect={handleServiceSelect}
            title=""
          />
        </View>

        {/* Service Categories List Component */}
        <ServiceCategoryList 
          categories={serviceCategoriesData}
          onServiceSelect={handleServiceSelect}
        />
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
}); 