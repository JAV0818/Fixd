import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Trash, Minus, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, CartItem } from '@/contexts/CartContext';

type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Cart'>;

export default function CartScreen() {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { state: cartState, removeItem, clearCart } = useCart();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const handleRemoveItem = (itemId: string) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          onPress: () => removeItem(itemId),
          style: "destructive"
        }
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to clear all items from your cart?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear",
          onPress: () => clearCart(),
          style: "destructive"
        }
      ]
    );
  };

  const handleCheckout = () => {
    navigation.navigate('Checkout');
  };

  const toggleItemExpand = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    console.log(`Rendering item: ${item.id}, Price: ${item.price}, Quantity: ${item.quantity}`); 
    
    try {
      return (
        <View style={styles.cartItem}> 
          {/* Placeholder for image if needed later */}
          <View style={styles.itemImagePlaceholder} /> 
          
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.name || 'Name Missing'}</Text> 
            {/* Display vehicle info */}
            {item.vehicleDisplay && (
              <Text style={styles.itemVehicle}>{item.vehicleDisplay}</Text>
            )}
            <Text style={styles.itemPrice}>Base: ${item.price !== undefined ? item.price : 'N/A'}</Text> 
          </View>
          
          <View style={styles.itemActions}>
            <Text style={styles.totalPrice}>
              Qty: {item.quantity !== undefined ? item.quantity : 'N/A'} / 
              Total: ${(item.price !== undefined && item.quantity !== undefined) ? (item.price * item.quantity).toFixed(2) : 'Error'}
            </Text> 
            <Pressable 
              style={styles.removeButton} 
              onPress={() => handleRemoveItem(item.id)}
            >
              <Trash size={18} color="#FF3D71" />
            </Pressable>
          </View>
        </View>
      );
    } catch (error) {
      console.error(`Error rendering item ${item.id}:`, error);
      return (
        <View style={styles.cartItemError}>
          <Text>Error rendering item: {item.id}</Text>
        </View>
      );
    }
  };

  // Log cart state on every render of CartScreen
  console.log("[CartScreen] State on render:", JSON.stringify(cartState, null, 2));

  // --- Show Loading Indicator --- 
  if (cartState.isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00F0FF" />
        <Text style={styles.loadingText}>Loading Cart...</Text>
      </View>
    )
  }
  // --- End Loading Indicator --- 

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <Text style={styles.headerTitle}>Your Cart</Text>
        {cartState.items.length > 0 && (
          <Pressable onPress={handleClearCart} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {/* Cart Content - Reverted temporary debugging change */}
      {cartState.items.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <Pressable 
            style={styles.shopButton}
            onPress={() => navigation.navigate('CustomerApp')}
          >
            <Text style={styles.shopButtonText}>Continue Shopping</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={cartState.items}
            renderItem={renderCartItem}
            keyExtractor={(item: CartItem) => `${item.id}-${item.vehicleId || 'no-vehicle'}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.grandTotal}>${cartState.totalPrice.toFixed(2)}</Text>
            </View>
            <Pressable style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </Pressable>
          </View>
        </>
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
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    color: '#FF3D71',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 15, 30, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  itemImagePlaceholder: { // Style for placeholder
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: 'rgba(42, 53, 85, 0.5)', // Placeholder color
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  itemVehicle: { // Style for vehicle text
    color: '#A0AFFF', // Lighter accent color
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  itemPrice: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 6,
  },
  addonsContainer: {
    marginTop: 8,
  },
  addonsTitle: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
  },
  addonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 8,
    marginVertical: 2,
    paddingRight: 5,
  },
  addonName: {
    color: '#D0DFFF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  addonPrice: {
    color: '#00F0FF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  addonCount: {
    color: '#7A89FF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  itemActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  totalPrice: {
    color: '#00F0FF',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyCartText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  shopButton: {
    backgroundColor: '#00F0FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#030515',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
    backgroundColor: '#0A0F1E',
  },
  totalContainer: {
    marginBottom: 16,
  },
  totalLabel: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  grandTotal: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  checkoutButton: {
    backgroundColor: '#00F0FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#030515',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  cartItemError: { // Style for error placeholder
    backgroundColor: '#500',
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  loadingContainer: { // Styles for loading state
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
}); 