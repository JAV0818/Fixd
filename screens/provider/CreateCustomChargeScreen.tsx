import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { ArrowLeft, UserSearch, Send, PlusCircle, Trash2 } from 'lucide-react-native';
import { auth, firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, doc, getDoc, Timestamp } from 'firebase/firestore';
import { UserProfile, CustomCharge } from '../../types/customCharges';
import { LocationDetails, OrderItem } from '../../types/orders';
import { colors } from '@/styles/theme';

interface LineItem {
  id: string;
  itemDescription: string;
  itemPrice: number;
}

const BUTTON_HEIGHT = 56;

type Props = NativeStackScreenProps<ProviderStackParamList, 'CreateCustomCharge'>;

const DEBOUNCE_DELAY = 500;

export default function CreateCustomChargeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const currentUser = auth.currentUser;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [currentItemDesc, setCurrentItemDesc] = useState('');
  const [currentItemPrice, setCurrentItemPrice] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [serviceTime, setServiceTime] = useState('');

  const [isSearching, setIsSearching] = useState(false);
  const [mechanicProfile, setMechanicProfile] = useState<UserProfile | null>(null);
  const [locationDetails, setLocationDetails] = useState<Partial<LocationDetails>>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: '',
    additionalNotes: '',
  });

  useEffect(() => {
    const fetchMechanicProfile = async () => {
      if (currentUser) {
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setMechanicProfile({ id: userDocSnap.id, ...userDocSnap.data() } as UserProfile);
        }
      }
    };
    fetchMechanicProfile();
  }, [currentUser]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      setIsSearching(true);
      const usersRef = collection(firestore, 'users');
      const normalizedSearchQuery = searchQuery.toLowerCase();
      // Query for customers (role === 'customer')
      const q = query(usersRef, where('role', '==', 'customer'), limit(15));
      const querySnapshot = await getDocs(q);
      const potentialUsers = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as UserProfile));
      const filteredUsers = potentialUsers.filter(user => 
        user.email?.toLowerCase().includes(normalizedSearchQuery) || 
        user.phone?.includes(normalizedSearchQuery) ||
        `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(normalizedSearchQuery)
      );
      setSearchResults(filteredUsers);
      setIsSearching(false);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const newTotal = lineItems.reduce((sum, item) => sum + item.itemPrice, 0);
    setTotalPrice(newTotal);
  }, [lineItems]);

  const handleSelectCustomer = (customer: UserProfile) => {
    setSelectedCustomer(customer);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddLineItem = () => {
    const numericItemPrice = parseFloat(currentItemPrice);
    if (!currentItemDesc.trim() || isNaN(numericItemPrice) || numericItemPrice <= 0) {
      Alert.alert("Invalid Item", "Please enter a valid description and price.");
      return;
    }
    setLineItems(prev => [...prev, { id: Date.now().toString(), itemDescription: currentItemDesc.trim(), itemPrice: numericItemPrice }]);
    setCurrentItemDesc('');
    setCurrentItemPrice('');
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCreateCustomCharge = async () => {
    if (!selectedCustomer || !currentUser) {
      Alert.alert("Error", "A customer and provider must be selected.");
      return;
    }
    if (lineItems.length === 0) {
      Alert.alert("No Items", "Please add at least one service item.");
      return;
    }
    if (!vehicleMake.trim() || !vehicleModel.trim() || !vehicleYear.trim()) {
      Alert.alert("Missing Vehicle Info", "Please provide vehicle make, model, and year.");
      return;
    }
    if (!locationDetails.address?.trim() || !locationDetails.city?.trim() || !locationDetails.state?.trim() || !locationDetails.zipCode?.trim()) {
      Alert.alert("Missing Location", "Please provide a complete service address.");
      return;
    }

    setIsSubmitting(true);

    const providerName = (mechanicProfile?.firstName && mechanicProfile?.lastName)
      ? `${mechanicProfile.firstName} ${mechanicProfile.lastName}`
      : mechanicProfile?.email || 'Fixd Mechanic';

    const customerName = (selectedCustomer.firstName && selectedCustomer.lastName)
      ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
      : selectedCustomer.email || 'Valued Customer';

    const orderItems: OrderItem[] = lineItems.map(item => ({
      id: item.id,
      name: item.itemDescription,
      price: item.itemPrice,
      quantity: 1,
    }));

    const vehicleInfo = `${vehicleYear} ${vehicleMake} ${vehicleModel} - ${licensePlate || 'N/A'}`;

    // Build repair order data for 'repair-orders' collection
    const repairOrderData: Record<string, any> = {
      customerId: selectedCustomer.id,
      customerName: customerName,
      providerId: currentUser.uid, // Required for rules: provider creates custom_quote
      providerName: providerName,
      items: orderItems,
      totalPrice: totalPrice,
      locationDetails: locationDetails as LocationDetails,
      vehicleInfo: vehicleInfo,
      status: 'PendingApproval',
      orderType: 'custom_quote', // Required for rules
      createdAt: serverTimestamp(),
      categories: ['Custom Quote'],
      mediaUrls: [],
      description: `Custom quote from ${providerName}`,
    };

    // Conditionally add the scheduledAt field if date and time are provided
    if (serviceDate.trim() && serviceTime.trim()) {
      try {
        const parsedDate = new Date(`${serviceDate.trim()}T${serviceTime.trim()}`);
        if (!isNaN(parsedDate.getTime())) {
          repairOrderData.scheduledAt = Timestamp.fromDate(parsedDate);
        } else {
          console.warn("Invalid date/time format provided:", serviceDate, serviceTime);
        }
      } catch (e) {
        console.error("Error parsing date/time for schedule:", e);
      }
    }

    try {
      await addDoc(collection(firestore, 'repair-orders'), repairOrderData);
      Alert.alert("Success", "Custom quote created successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error creating custom quote:", error);
      Alert.alert("Error", "Could not create the custom quote. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? (insets.top + 10) : 0} 
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Repair Order</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {!selectedCustomer ? (
            <View style={styles.searchSectionContainer}>
              <Text style={styles.label}>1. Find Customer</Text>
              <View style={styles.inputContainer}>
                <UserSearch size={20} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Search by email or phone..."
                  placeholderTextColor={colors.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
              </View>
              {isSearching && <ActivityIndicator style={styles.loader} color={colors.primary} />}
              <View style={styles.resultsList}>
                {searchResults.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.customerItem} onPress={() => handleSelectCustomer(item)}>
                    <Text style={styles.customerName}>{item.firstName || ''} {item.lastName || ''} ({item.email || 'No email'})</Text>
                    <Text style={styles.customerEmail}>{item.phone || 'No phone'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              <View style={styles.selectedCustomerContainer}>
                <Text style={styles.label}>Customer:</Text>
                <View style={styles.selectedCustomerInfo}>
                  <Text style={styles.selectedCustomerName}>{`${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`}</Text>
                  <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                    <Text style={styles.changeCustomerText}>Change</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.selectedCustomerDetails}>{selectedCustomer.email || 'No email'} | {selectedCustomer.phone || 'No phone'}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Service Location</Text>
                <TextInput style={styles.inputMUI} placeholder="Street Address*" placeholderTextColor={colors.textLight} value={locationDetails.address} onChangeText={val => setLocationDetails(p => ({...p, address: val}))} />
                <TextInput style={styles.inputMUI} placeholder="City*" placeholderTextColor={colors.textLight} value={locationDetails.city} onChangeText={val => setLocationDetails(p => ({...p, city: val}))} />
                <View style={styles.row}>
                  <TextInput style={[styles.inputMUI, {flex: 1, marginRight: 8}]} placeholder="State*" placeholderTextColor={colors.textLight} value={locationDetails.state} onChangeText={val => setLocationDetails(p => ({...p, state: val}))} />
                  <TextInput style={[styles.inputMUI, {flex: 1}]} placeholder="Zip Code*" placeholderTextColor={colors.textLight} value={locationDetails.zipCode} onChangeText={val => setLocationDetails(p => ({...p, zipCode: val}))} keyboardType="numeric" />
                </View>
                <TextInput style={styles.inputMUI} placeholder="Contact Phone (Optional)" placeholderTextColor={colors.textLight} value={locationDetails.phoneNumber} onChangeText={val => setLocationDetails(p => ({...p, phoneNumber: val}))} keyboardType="phone-pad" />
                <TextInput style={styles.textArea} placeholder="Additional Notes (e.g., Apt #, gate code)" placeholderTextColor={colors.textLight} value={locationDetails.additionalNotes} onChangeText={val => setLocationDetails(p => ({...p, additionalNotes: val}))} multiline />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Vehicle Information</Text>
                <TextInput style={styles.inputMUI} placeholder="Make*" placeholderTextColor={colors.textLight} value={vehicleMake} onChangeText={setVehicleMake} />
                <TextInput style={styles.inputMUI} placeholder="Model*" placeholderTextColor={colors.textLight} value={vehicleModel} onChangeText={setVehicleModel} />
                <View style={styles.row}>
                  <TextInput style={[styles.inputMUI, {flex: 1, marginRight: 8}]} placeholder="Year*" placeholderTextColor={colors.textLight} value={vehicleYear} onChangeText={setVehicleYear} keyboardType="numeric" maxLength={4} />
                  <TextInput style={[styles.inputMUI, {flex: 1}]} placeholder="License Plate (Optional)" placeholderTextColor={colors.textLight} value={licensePlate} onChangeText={setLicensePlate} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Schedule (Optional)</Text>
                <View style={styles.row}>
                  <TextInput style={[styles.inputMUI, {flex: 1, marginRight: 8}]} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={colors.textLight} value={serviceDate} onChangeText={setServiceDate} />
                  <TextInput style={[styles.inputMUI, {flex: 1}]} placeholder="Time (HH:MM)" placeholderTextColor={colors.textLight} value={serviceTime} onChangeText={setServiceTime} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Service Items</Text>
                <View style={styles.lineItemInputRow}>
                  <View style={[styles.inputContainer, {flex: 1, marginRight: 8, marginBottom: 0}]}>
                    <TextInput style={styles.input} placeholder="Service item description" placeholderTextColor={colors.textLight} value={currentItemDesc} onChangeText={setCurrentItemDesc} />
                  </View>
                  <View style={[styles.inputContainer, {width: 100, marginRight: 8, marginBottom: 0}]}>
                    <TextInput style={styles.input} placeholder="Price" placeholderTextColor={colors.textLight} value={currentItemPrice} onChangeText={setCurrentItemPrice} keyboardType="numeric" />
                  </View>
                  <TouchableOpacity style={styles.addItemButton} onPress={handleAddLineItem}>
                    <PlusCircle size={24} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.lineItemsList}>
                  {lineItems.map((item) => (
                    <View key={item.id} style={styles.lineItemContainer}>
                      <View style={styles.lineItemTextContainer}>
                        <Text style={styles.lineItemDescription}>{item.itemDescription}</Text>
                        <Text style={styles.lineItemPrice}>${item.itemPrice.toFixed(2)}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveLineItem(item.id)} style={styles.removeButton}>
                        <Trash2 size={20} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                
                <View style={styles.totalPriceContainer}>
                  <Text style={styles.totalPriceLabel}>Total:</Text>
                  <Text style={styles.totalPriceAmount}>${totalPrice.toFixed(2)}</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.sendButton, (isSubmitting || lineItems.length === 0) && styles.sendButtonDisabled]}
                onPress={handleCreateCustomCharge}
                disabled={isSubmitting || lineItems.length === 0}
              >
                {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <><Send size={20} color="#FFFFFF" style={{marginRight: 8}}/><Text style={styles.sendButtonText}>Create Custom Quote</Text></>}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardAvoidingContainer: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: colors.background, 
  },
  backButton: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  scrollableContent: { flex: 1, paddingHorizontal: 20 },
  scrollContentContainer: { flexGrow: 1, paddingBottom: 100, paddingTop: 16 },
  searchSectionContainer: { marginBottom: 10 },
  section: { marginBottom: 20 },
  label: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.textPrimary, marginBottom: 12 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.surfaceAlt, 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    borderWidth: 1, 
    borderColor: colors.primary, 
    height: 52, 
    marginBottom: 12, 
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: '100%', color: colors.textPrimary, fontFamily: 'Inter_400Regular', fontSize: 15 },
  inputMUI: { 
    height: 52, 
    color: colors.textPrimary, 
    fontFamily: 'Inter_400Regular', 
    fontSize: 15, 
    backgroundColor: colors.surfaceAlt, 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    borderWidth: 1, 
    borderColor: colors.primary, 
    marginBottom: 12,
  },
  textArea: { 
    minHeight: 100, 
    textAlignVertical: 'top', 
    paddingVertical: 12, 
    backgroundColor: colors.surfaceAlt, 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    borderWidth: 1, 
    borderColor: colors.primary, 
    color: colors.textPrimary, 
    fontFamily: 'Inter_400Regular', 
    fontSize: 15,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  resultsList: { maxHeight: 200 },
  customerItem: { 
    paddingVertical: 14, 
    paddingHorizontal: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  customerName: { color: colors.textPrimary, fontFamily: 'Inter_500Medium', fontSize: 15 },
  customerEmail: { color: colors.textTertiary, fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2 },
  selectedCustomerContainer: { 
    padding: 16, 
    backgroundColor: colors.surface, 
    borderRadius: 16, 
    borderColor: colors.primary, 
    borderWidth: 1.5, 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCustomerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedCustomerName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  selectedCustomerDetails: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textTertiary, marginTop: 4 },
  changeCustomerText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.primary },
  lineItemInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  addItemButton: { 
    width: 52, 
    height: 52, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.primaryLight, 
    borderColor: colors.primary, 
    borderWidth: 1.5, 
    borderRadius: 12, 
  },
  lineItemsList: { marginBottom: 10 },
  lineItemContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 14, 
    backgroundColor: colors.surfaceAlt, 
    borderRadius: 12, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lineItemTextContainer: { flex: 1 },
  lineItemDescription: { color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 14 },
  lineItemPrice: { color: colors.textPrimary, fontFamily: 'Inter_600SemiBold', fontSize: 15, marginTop: 2 },
  removeButton: { padding: 8 },
  totalPriceContainer: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    marginTop: 16, 
    paddingVertical: 12, 
    borderTopWidth: 1, 
    borderTopColor: colors.border,
  },
  totalPriceLabel: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginRight: 8 },
  totalPriceAmount: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  sendButton: { 
    backgroundColor: colors.primary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: BUTTON_HEIGHT, 
    borderRadius: 14, 
    marginTop: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: { 
    backgroundColor: colors.textLight, 
    shadowOpacity: 0,
  },
  sendButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  loader: { marginVertical: 10 },
});