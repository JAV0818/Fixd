import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ScrollView, TextInput } from 'react-native';
import { ArrowLeft, ChevronRight, CreditCard, Truck, MapPin, CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, CartItem } from '@/contexts/CartContext';

type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;

// Checkout steps
enum CheckoutStep {
  SHIPPING = 0,
  PAYMENT = 1,
  REVIEW = 2,
  CONFIRMATION = 3,
}

export default function CheckoutScreen() {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { state: cartState, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.SHIPPING);
  
  // Form state
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: '',
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'creditCard' | 'paypal' | null>(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    nameOnCard: '',
    expiryDate: '',
    cvv: '',
  });

  const handleNext = () => {
    if (currentStep < CheckoutStep.CONFIRMATION) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > CheckoutStep.SHIPPING) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePlaceOrder = () => {
    // In a real app, this would handle order submission to backend
    setCurrentStep(CheckoutStep.CONFIRMATION);
    // Clear the cart after successful order
    clearCart();
  };

  const handleContinueShopping = () => {
    navigation.navigate('CustomerApp');
  };

  const renderCartSummary = () => {
    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        
        <FlatList
          data={cartState.items}
          renderItem={({ item }) => (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemName}>{item.serviceName}</Text>
              <Text style={styles.summaryItemPrice}>${item.totalPrice.toFixed(2)}</Text>
            </View>
          )}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          ListFooterComponent={
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>${cartState.totalPrice.toFixed(2)}</Text>
            </View>
          }
        />
      </View>
    );
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicatorContainer}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.stepRow}>
            <View
              style={[
                styles.stepCircle,
                currentStep >= index ? styles.activeStep : styles.inactiveStep,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  currentStep >= index ? styles.activeStepText : styles.inactiveStepText,
                ]}
              >
                {index + 1}
              </Text>
            </View>
            {index < 2 && <View style={styles.stepLine} />}
          </View>
        ))}
      </View>
    );
  };

  const renderShippingStep = () => {
    return (
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.stepHeader}>
          <Truck size={20} color="#7A89FF" />
          <Text style={styles.stepTitle}>Shipping Information</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#6E7191"
            value={shippingDetails.fullName}
            onChangeText={(text) => setShippingDetails({...shippingDetails, fullName: text})}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your street address"
            placeholderTextColor="#6E7191"
            value={shippingDetails.address}
            onChangeText={(text) => setShippingDetails({...shippingDetails, address: text})}
          />
        </View>
        
        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor="#6E7191"
              value={shippingDetails.city}
              onChangeText={(text) => setShippingDetails({...shippingDetails, city: text})}
            />
          </View>
          
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>State</Text>
            <TextInput
              style={styles.input}
              placeholder="State"
              placeholderTextColor="#6E7191"
              value={shippingDetails.state}
              onChangeText={(text) => setShippingDetails({...shippingDetails, state: text})}
            />
          </View>
        </View>
        
        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>ZIP Code</Text>
            <TextInput
              style={styles.input}
              placeholder="ZIP Code"
              placeholderTextColor="#6E7191"
              keyboardType="numeric"
              value={shippingDetails.zipCode}
              onChangeText={(text) => setShippingDetails({...shippingDetails, zipCode: text})}
            />
          </View>
          
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#6E7191"
              keyboardType="phone-pad"
              value={shippingDetails.phoneNumber}
              onChangeText={(text) => setShippingDetails({...shippingDetails, phoneNumber: text})}
            />
          </View>
        </View>
        
        {renderCartSummary()}
      </ScrollView>
    );
  };

  const renderPaymentStep = () => {
    return (
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.stepHeader}>
          <CreditCard size={20} color="#7A89FF" />
          <Text style={styles.stepTitle}>Payment Method</Text>
        </View>
        
        <Pressable
          style={[
            styles.paymentOption,
            paymentMethod === 'creditCard' && styles.paymentOptionSelected,
          ]}
          onPress={() => setPaymentMethod('creditCard')}
        >
          <View style={styles.paymentOptionIcon}>
            <CreditCard size={20} color="#FFF" />
          </View>
          <Text style={styles.paymentOptionText}>Credit Card</Text>
          {paymentMethod === 'creditCard' && (
            <View style={styles.paymentOptionCheck}>
              <CheckCircle size={20} color="#00F0FF" />
            </View>
          )}
        </Pressable>
        
        <Pressable
          style={[
            styles.paymentOption,
            paymentMethod === 'paypal' && styles.paymentOptionSelected,
          ]}
          onPress={() => setPaymentMethod('paypal')}
        >
          <View style={styles.paymentOptionIcon}>
            <Text style={styles.paypalIcon}>P</Text>
          </View>
          <Text style={styles.paymentOptionText}>PayPal</Text>
          {paymentMethod === 'paypal' && (
            <View style={styles.paymentOptionCheck}>
              <CheckCircle size={20} color="#00F0FF" />
            </View>
          )}
        </Pressable>
        
        {paymentMethod === 'creditCard' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="XXXX XXXX XXXX XXXX"
                placeholderTextColor="#6E7191"
                keyboardType="numeric"
                value={cardDetails.cardNumber}
                onChangeText={(text) => setCardDetails({...cardDetails, cardNumber: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name on Card</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter name as it appears on card"
                placeholderTextColor="#6E7191"
                value={cardDetails.nameOnCard}
                onChangeText={(text) => setCardDetails({...cardDetails, nameOnCard: text})}
              />
            </View>
            
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor="#6E7191"
                  value={cardDetails.expiryDate}
                  onChangeText={(text) => setCardDetails({...cardDetails, expiryDate: text})}
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="XXX"
                  placeholderTextColor="#6E7191"
                  keyboardType="numeric"
                  secureTextEntry
                  value={cardDetails.cvv}
                  onChangeText={(text) => setCardDetails({...cardDetails, cvv: text})}
                />
              </View>
            </View>
          </>
        )}
        
        {renderCartSummary()}
      </ScrollView>
    );
  };

  const renderReviewStep = () => {
    return (
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.stepHeader}>
          <CheckCircle size={20} color="#7A89FF" />
          <Text style={styles.stepTitle}>Review Order</Text>
        </View>
        
        <View style={styles.reviewSection}>
          <View style={styles.reviewSectionHeader}>
            <Truck size={16} color="#7A89FF" />
            <Text style={styles.reviewSectionTitle}>Shipping Information</Text>
          </View>
          
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewName}>{shippingDetails.fullName}</Text>
            <Text style={styles.reviewDetail}>{shippingDetails.address}</Text>
            <Text style={styles.reviewDetail}>
              {shippingDetails.city}, {shippingDetails.state} {shippingDetails.zipCode}
            </Text>
            <Text style={styles.reviewDetail}>{shippingDetails.phoneNumber}</Text>
          </View>
        </View>
        
        <View style={styles.reviewSection}>
          <View style={styles.reviewSectionHeader}>
            <CreditCard size={16} color="#7A89FF" />
            <Text style={styles.reviewSectionTitle}>Payment Method</Text>
          </View>
          
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewDetail}>
              {paymentMethod === 'creditCard' 
                ? `Credit Card (ending in ${cardDetails.cardNumber.slice(-4) || 'XXXX'})` 
                : 'PayPal'}
            </Text>
          </View>
        </View>
        
        {renderCartSummary()}
      </ScrollView>
    );
  };

  const renderConfirmationStep = () => {
    return (
      <View style={styles.confirmationContainer}>
        <View style={styles.confirmationIcon}>
          <CheckCircle size={64} color="#00F0FF" />
        </View>
        
        <Text style={styles.confirmationTitle}>Order Confirmed!</Text>
        <Text style={styles.confirmationText}>
          Your order has been placed successfully. You will receive a confirmation email shortly.
        </Text>
        
        <View style={styles.confirmationDetails}>
          <Text style={styles.confirmationOrderId}>Order #: {Math.floor(Math.random() * 1000000)}</Text>
          <Text style={styles.confirmationDate}>
            Date: {new Date().toLocaleDateString()}
          </Text>
        </View>
        
        <Pressable
          style={styles.continueShoppingButton}
          onPress={handleContinueShopping}
        >
          <Text style={styles.continueShoppingButtonText}>Continue Shopping</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {currentStep === CheckoutStep.CONFIRMATION ? 'Order Confirmation' : 'Checkout'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step Indicator (not shown in confirmation) */}
      {currentStep !== CheckoutStep.CONFIRMATION && renderStepIndicator()}

      {/* Step Content */}
      {currentStep === CheckoutStep.SHIPPING && renderShippingStep()}
      {currentStep === CheckoutStep.PAYMENT && renderPaymentStep()}
      {currentStep === CheckoutStep.REVIEW && renderReviewStep()}
      {currentStep === CheckoutStep.CONFIRMATION && renderConfirmationStep()}

      {/* Footer buttons */}
      {currentStep !== CheckoutStep.CONFIRMATION && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {currentStep === CheckoutStep.REVIEW ? (
            <Pressable style={styles.placeOrderButton} onPress={handlePlaceOrder}>
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Continue</Text>
              <ChevronRight size={20} color="#030515" />
            </Pressable>
          )}
        </View>
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
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: '#0A0F1E',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: '#00F0FF',
  },
  inactiveStep: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  stepNumber: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  activeStepText: {
    color: '#030515',
  },
  inactiveStepText: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A3555',
    marginHorizontal: 8,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#121827',
    borderWidth: 1,
    borderColor: '#2A3555',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121827',
    borderWidth: 1,
    borderColor: '#2A3555',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  paymentOptionSelected: {
    borderColor: '#00F0FF',
  },
  paymentOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A3555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paypalIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  paymentOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  paymentOptionCheck: {
    marginLeft: 8,
  },
  summaryContainer: {
    backgroundColor: '#121827',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItemName: {
    color: '#D0DFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  summaryItemPrice: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    color: '#7A89FF',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  totalPrice: {
    color: '#00F0FF',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
    backgroundColor: '#0A0F1E',
  },
  nextButton: {
    backgroundColor: '#00F0FF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#030515',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginRight: 8,
  },
  placeOrderButton: {
    backgroundColor: '#00F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  placeOrderButtonText: {
    color: '#030515',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  reviewSection: {
    backgroundColor: '#121827',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  reviewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 8,
  },
  reviewInfo: {
    marginLeft: 24,
  },
  reviewName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  reviewDetail: {
    color: '#D0DFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  confirmationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmationIcon: {
    marginBottom: 24,
  },
  confirmationTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
  },
  confirmationText: {
    color: '#D0DFFF',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmationDetails: {
    backgroundColor: '#121827',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  confirmationOrderId: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  confirmationDate: {
    color: '#D0DFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  continueShoppingButton: {
    backgroundColor: '#00F0FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  continueShoppingButtonText: {
    color: '#030515',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
}); 