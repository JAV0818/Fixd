// ServiceDetailScreen.tsx Placeholder 
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, Animated } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { CheckSquare, Square, ArrowLeft, ShoppingCart, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/contexts/CartContext';

// --- Types --- (Moved before MOCK_SERVICES)
type Addon = {
  id: string;
  name: string;
  price: number;
};

type Service = {
  id: string;
  title: string;
  description: string;
  image: any; // Adjust type as needed (e.g., ImageSourcePropType)
  basePrice: number;
  addons?: Addon[];
};

// Mock Data (Expanded)
const MOCK_SERVICES: { [key: string]: Service } = {
  // --- Emergency Services ---
  'battery-jump-start': {
    id: 'battery-jump-start',
    title: 'Battery Jump Start',
    description: 'Quick and reliable jump start service to get your vehicle running again.',
    image: require('../../img_assets/battery jump.jpeg'),
    basePrice: 50,
    addons: [
      { id: 'battery-test', name: 'Battery Health Test', price: 15 },
      { id: 'terminal-clean', name: 'Battery Terminal Cleaning', price: 10 },
    ],
  },
  'flat-tire-change': {
    id: 'flat-tire-change',
    title: 'Flat Tire Change',
    description: 'Professional replacement of your flat tire with your spare.',
    image: require('../../img_assets/flat tire change.jpeg'),
    basePrice: 45,
    addons: [
      { id: 'tire-disposal', name: 'Old Tire Disposal', price: 5 },
      { id: 'tire-shine', name: 'Tire Shine Application', price: 10 },
      { id: 'lug-nut-check', name: 'Lug Nut Torque Check', price: 8 },
    ],
  },
  'fuel-delivery': {
    id: 'fuel-delivery',
    title: 'Fuel Delivery',
    description: 'Ran out of gas? We deliver 2 gallons of fuel directly to your location.',
    image: require('../../img_assets/fuel delievery.png'),
    basePrice: 40, // Note: Price might often be base + cost of fuel
    addons: [
      { id: 'fuel-premium', name: 'Premium Fuel Upgrade', price: 5 }, // Example
      { id: 'fuel-system-check', name: 'Basic Fuel System Check', price: 20 },
    ],
  },
  // --- Maintenance Services ---
  'oil-change': {
    id: 'oil-change',
    title: 'Oil Change Service',
    description: 'Complete oil & filter change using quality synthetic blend oil. Includes fluid top-off.',
    image: require('../../img_assets/Oil.png'),
    basePrice: 40,
    addons: [
      { id: 'oil-full-synthetic', name: 'Full Synthetic Oil Upgrade', price: 25 },
      { id: 'oil-cabin-filter', name: 'Cabin Air Filter Replacement', price: 30 },
      { id: 'oil-tire-rotation', name: 'Tire Rotation', price: 20 },
    ],
  },
  'diagnostics': {
    id: 'diagnostics',
    title: 'Diagnostics Check',
    description: 'Full vehicle computer diagnostics scan to identify check engine lights and other issues.',
    image: require('../../img_assets/diagnostics.png'),
    basePrice: 70,
    addons: [
      { id: 'diag-report', name: 'Detailed Diagnostic Report (PDF)', price: 10 },
      { id: 'diag-live-data', name: 'Live Sensor Data Monitoring', price: 30 },
    ],
  },
  'brake-inspection': {
    id: 'brake-inspection',
    title: 'Brake Inspection',
    description: 'Comprehensive inspection of brake pads, rotors, calipers, and fluid.',
    image: require('../../img_assets/Brake.png'), // Note: HomeScreen calls this "Brake Repairs", title here is "Inspection"
    basePrice: 50,
    addons: [
      { id: 'brake-fluid-test', name: 'Brake Fluid Moisture Test', price: 15 },
      { id: 'brake-pad-measure', name: 'Brake Pad Depth Measurement', price: 10 },
    ],
  },
};

// Define the type for the route prop specific to this screen
type ServiceDetailScreenRouteProp = RouteProp<RootStackParamList, 'ServiceDetail'>;

// --- Component ---
type ServiceDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ServiceDetail'>;

export default function ServiceDetailScreen() {
  const route = useRoute<ServiceDetailScreenRouteProp>();
  const navigation = useNavigation<ServiceDetailScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { addItem, state: cartState } = useCart();
  
  const { id: serviceId } = route.params; // Get service ID from navigation params

  const [service, setService] = useState<Service | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [addedToCart, setAddedToCart] = useState(false);
  
  // New state for success animation
  const [showSuccess, setShowSuccess] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Simulate fetching service details
  useEffect(() => {
    const fetchedService = MOCK_SERVICES[serviceId];
    if (fetchedService) {
      setService(fetchedService);
      setTotalPrice(fetchedService.basePrice); // Initialize price
    } else {
      // Handle case where service ID is invalid (e.g., show error, navigate back)
      console.error("Invalid service ID:", serviceId);
      setService(null); // Clear service if ID is invalid
      setTotalPrice(0);
      // navigation.goBack(); // Optionally navigate back
    }
  }, [serviceId]);

  // Calculate total price when selections change
  useEffect(() => {
    if (!service) return;

    let currentTotal = service.basePrice;
    selectedAddons.forEach(addonId => {
      // Explicitly type 'a' as Addon
      const addon = service.addons?.find((a: Addon) => a.id === addonId);
      if (addon) {
        currentTotal += addon.price;
      }
    });
    setTotalPrice(currentTotal);
  }, [selectedAddons, service]);

  // Reset added to cart state when selections change
  useEffect(() => {
    if (addedToCart) {
      setAddedToCart(false);
    }
  }, [selectedAddons]);

  const handleSelectAddon = (addonId: string) => {
    setSelectedAddons(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(addonId)) {
        newSelected.delete(addonId);
      } else {
        newSelected.add(addonId);
      }
      return newSelected;
    });
  };

  // Animation sequence for success overlay
  const showSuccessOverlay = () => {
    setShowSuccess(true);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // After a delay, navigate back
    setTimeout(() => {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowSuccess(false);
        navigation.goBack(); // Navigate back to services screen
      });
    }, 1200); // Show for 1.2 seconds
  };

  const handleAddToCart = () => {
    if (!service) return;
    
    // Collect selected add-ons into an array format for the cart
    const selectedAddonsList = Array.from(selectedAddons).map(addonId => {
      const addon = service.addons?.find(a => a.id === addonId);
      if (!addon) return null;
      return {
        id: addon.id,
        name: addon.name,
        price: addon.price
      };
    }).filter(Boolean) as { id: string; name: string; price: number }[];

    // Add to cart using our context
    addItem({
      serviceId: service.id,
      serviceName: service.title,
      serviceImage: service.image,
      basePrice: service.basePrice,
      selectedAddons: selectedAddonsList,
      totalPrice: totalPrice,
    });

    // Give visual feedback to user
    setAddedToCart(true);
    showSuccessOverlay();
  };

  if (!service) {
    // Optional: Show a loading state or error message
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Service details not found.</Text>
         {/* Added a back button here for usability if service fails to load */}
         <Pressable onPress={() => navigation.goBack()} style={{ alignSelf: 'center', marginTop: 20, padding: 10 }}>
            <Text style={{ color: '#00F0FF'}}>Go Back</Text>
         </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header with Back Button */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                <ArrowLeft size={24} color="#00F0FF" />
            </Pressable>
            <Text style={styles.headerTitle}>{service.title}</Text>
            <Pressable onPress={() => navigation.navigate('Cart')} style={styles.cartButton}>
                <ShoppingCart size={28} color="#00F0FF" />
                {cartState.totalItems > 0 && (
                    <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cartState.totalItems}</Text>
                    </View>
                )}
            </Pressable>
        </View>

        <ScrollView style={styles.content}>
            {/* Service Image */}
            <Image source={service.image} style={styles.serviceImage} />
            
            {/* Service Description */}
            <View style={styles.section}>
                 <Text style={styles.description}>{service.description}</Text>
                 <Text style={styles.basePrice}>Base Price: ${service.basePrice.toFixed(2)}</Text>
            </View>
            
            {/* Add-ons Section */}
            {service.addons && service.addons.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Optional Add-ons</Text>
                    {/* Explicitly type 'addon' as Addon */}
                    {service.addons.map((addon: Addon) => (
                        <Pressable 
                            key={addon.id} 
                            style={styles.addonItem}
                            onPress={() => handleSelectAddon(addon.id)}
                        >
                            {selectedAddons.has(addon.id) ? (
                                <CheckSquare size={20} color="#00F0FF" />
                            ) : (
                                <Square size={20} color="#7A89FF" />
                            )}
                            <View style={styles.addonDetails}>
                                <Text style={styles.addonName}>{addon.name}</Text>
                                <Text style={styles.addonPrice}>+ ${addon.price.toFixed(2)}</Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            )}
        </ScrollView>
        
        {/* Footer: Total Price & Add to Cart Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.priceContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
            </View>
            <Pressable 
                style={[
                    styles.addToCartButton,
                    addedToCart ? styles.addedToCartButton : null
                ]} 
                onPress={handleAddToCart}
            >
                <Text style={styles.addToCartButtonText}>
                    {addedToCart ? "Added to Cart" : "Add to Cart"}
                </Text>
            </Pressable>
        </View>
        
        {/* Success Overlay */}
        {showSuccess && (
            <Animated.View 
                style={[
                    styles.successOverlay,
                    { opacity: fadeAnim }
                ]}
            >
                <View style={styles.checkmarkContainer}>
                    <Check size={60} color="#00F0FF" strokeWidth={3} />
                </View>
                <Text style={styles.successText}>Added to Cart!</Text>
            </Animated.View>
        )}
    </View>
  );
}

// --- Styles --- (Basic styles, enhance as needed)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030515', // Consistent background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0A0F1E', // Slightly different header background
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
    // paddingTop removed - will be applied dynamically
  },
  backButton: {
    padding: 4, // Easier tap target
  },
  cartButton: {
    padding: 8,
    position: 'relative',
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
    color: 'white',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    lineHeight: 14,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
   content: {
    flex: 1,
  },
   serviceImage: {
    width: '100%',
    height: 250, // Adjust as needed
    resizeMode: 'cover',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  description: {
    color: '#D0DFFF', // Lighter text for description
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
    lineHeight: 22,
  },
  basePrice: {
     color: '#00F0FF',
     fontSize: 18,
     fontFamily: 'Inter_600SemiBold',
     textAlign: 'right',
  },
  sectionTitle: {
    color: '#00F0FF',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
    letterSpacing: 1,
  },
  addonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  addonDetails: {
    flex: 1, // Take remaining space
    marginLeft: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addonName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  addonPrice: {
    color: '#00F0FF',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
    backgroundColor: '#0A0F1E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingBottom removed - will be applied dynamically
  },
  priceContainer: {
    // Styles for price display if needed
  },
  totalLabel: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  totalPrice: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  addToCartButton: {
    backgroundColor: '#00F0FF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  addedToCartButton: {
    backgroundColor: '#00c3ce', // Slightly darker to indicate change
  },
  addToCartButtonText: {
    color: '#030515',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  loadingText: {
      color: '#FFFFFF',
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  checkmarkContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
}); 