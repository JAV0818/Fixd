import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, Animated } from 'react-native';
// Removed useRoute import
import { RootStackParamList } from '@/navigation/AppNavigator'; // Keep Root stack for navigation typing
import { CheckSquare, Square, ArrowLeft, ShoppingCart, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/contexts/CartContext'; // Import the cart hook

// --- Types --- (Keep these, they are useful)
type Addon = {
  id: string;
  name: string;
  price: number;
};

type Service = {
  id: string;
  title: string;
  description: string;
  image: any; 
  basePrice: number;
  addons?: Addon[];
};

// Specific Service Data for this screen
const BATTERY_JUMP_START_SERVICE: Service = {
  id: 'battery-jump-start',
  title: 'Battery Jump Start',
  description: 'Quick and reliable jump start service to get your vehicle running again.',
  image: require('../../img_assets/battery jump.jpeg'),
  basePrice: 50,
  addons: [
    { id: 'battery-test', name: 'Battery Health Test', price: 15 },
    { id: 'terminal-clean', name: 'Battery Terminal Cleaning', price: 10 },
  ],
};

// --- Component ---
// Define navigation prop type relative to RootStack
type BatteryJumpStartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BatteryJumpStart'>; // Use new screen name

export default function BatteryJumpStartScreen() { // Renamed function
  // Removed useRoute hook
  const navigation = useNavigation<BatteryJumpStartScreenNavigationProp>();
  const insets = useSafeAreaInsets(); 
  const { addItem, state: cartState } = useCart(); // Get cart context
  
  // Use the hardcoded service data directly
  const [service] = useState<Service>(BATTERY_JUMP_START_SERVICE); 
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [totalPrice, setTotalPrice] = useState<number>(service.basePrice); // Initialize price directly
  const [addedToCart, setAddedToCart] = useState(false); // Track if item added to cart
  
  // New state for success animation
  const [showSuccess, setShowSuccess] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Removed useEffect fetching data based on serviceId

  // Calculate total price when selections change (Keep this logic)
  useEffect(() => {
    if (!service) return; // Should not happen here, but good practice

    let currentTotal = service.basePrice;
    selectedAddons.forEach(addonId => {
      const addon = service.addons?.find((a: Addon) => a.id === addonId);
      if (addon) {
        currentTotal += addon.price;
      }
    });
    setTotalPrice(currentTotal);
  }, [selectedAddons, service]); // Dependency is now just selections and the static service

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

  // No loading state needed as data is hardcoded
  // Removed the !service check block

  return (
    <View style={styles.container}>
        {/* Header with Back Button - Apply top inset padding */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                <ArrowLeft size={24} color="#00F0FF" />
            </Pressable>
            <Text style={styles.headerTitle}>{service.title}</Text>
            {/* Add cart icon with count indicator */}
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
        
        {/* Footer: Total Price & Add to Cart Button - Apply bottom inset padding */}
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

// --- Styles --- (Copied from ServiceDetailScreen)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030515', 
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
  backButton: {
    padding: 4, 
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
    height: 250, 
    resizeMode: 'cover',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  description: {
    color: '#D0DFFF', 
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
    flex: 1, 
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
    padding: 16, // Base padding, bottom added dynamically
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
    backgroundColor: '#0A0F1E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
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