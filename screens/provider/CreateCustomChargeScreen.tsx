import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
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
      const q = query(usersRef, where('isAdmin', '==', false), limit(15));
      const querySnapshot = await getDocs(q);
      const potentialUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      const filteredUsers = potentialUsers.filter(user => 
        user.email?.toLowerCase().includes(normalizedSearchQuery) || 
        user.phone?.includes(normalizedSearchQuery)
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

    const determinedMechanicName = (mechanicProfile?.firstName && mechanicProfile?.lastName)
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

    const vehicleDisplay = `${vehicleYear} ${vehicleMake} ${vehicleModel} - ${licensePlate || 'N/A'}`;

    const customChargeData: Omit<CustomCharge, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any; updatedAt: any } = {
      customerId: selectedCustomer.id,
      customerName: customerName,
      mechanicId: currentUser.uid,
      mechanicName: determinedMechanicName,
      items: orderItems,
      totalPrice: totalPrice,
      locationDetails: locationDetails as LocationDetails,
      status: 'PendingApproval',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      vehicleDisplay: vehicleDisplay,
    };

    // Conditionally add the scheduledAt field if date and time are provided
    if (serviceDate.trim() && serviceTime.trim()) {
      try {
        const parsedDate = new Date(`${serviceDate.trim()}T${serviceTime.trim()}`);
        if (!isNaN(parsedDate.getTime())) {
          (customChargeData as CustomCharge).scheduledAt = Timestamp.fromDate(parsedDate);
        } else {
          console.warn("Invalid date/time format provided:", serviceDate, serviceTime);
        }
      } catch (e) {
        console.error("Error parsing date/time for schedule:", e);
      }
    }

    try {
      await addDoc(collection(firestore, 'customCharges'), customChargeData);
      Alert.alert("Success", "New custom quote created successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error creating custom quote:", error);
      Alert.alert("Error", "Could not create the custom quote. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCustomerItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity style={styles.customerItem} onPress={() => handleSelectCustomer(item)}>
      <Text style={styles.customerName}>{item.firstName || ''} {item.lastName || ''} ({item.email || 'No email'})</Text>
      <Text style={styles.customerEmail}>{item.phone || 'No phone'}</Text>
    </TouchableOpacity>
  );

  const renderLineItem = ({ item }: { item: LineItem }) => (
    <View style={styles.lineItemContainer}>
      <View style={styles.lineItemTextContainer}>
        <Text style={styles.lineItemDescription}>{item.itemDescription}</Text>
        <Text style={styles.lineItemPrice}>${item.itemPrice.toFixed(2)}</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemoveLineItem(item.id)} style={styles.removeButton}>
        <Trash2 size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? (insets.top + 10) : 0} 
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Repair Order</Text>
          <View style={{ width: 24 }} />
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
                <UserSearch size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Search by email or phone..."
                  placeholderTextColor="#AEAEAE"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
              </View>
              {isSearching && <ActivityIndicator style={styles.loader} color="#00F0FF" />}
              <FlatList
                data={searchResults}
                renderItem={renderCustomerItem}
                keyExtractor={(item) => item.id}
                style={styles.resultsList}
                nestedScrollEnabled 
              />
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
                <TextInput style={styles.inputMUI} placeholder="Street Address*" placeholderTextColor="#AEAEAE" value={locationDetails.address} onChangeText={val => setLocationDetails(p => ({...p, address: val}))} />
                <TextInput style={styles.inputMUI} placeholder="City*" placeholderTextColor="#AEAEAE" value={locationDetails.city} onChangeText={val => setLocationDetails(p => ({...p, city: val}))} />
                <View style={styles.row}>
                  <TextInput style={[styles.inputMUI, {flex: 1, marginRight: 8}]} placeholder="State*" placeholderTextColor="#AEAEAE" value={locationDetails.state} onChangeText={val => setLocationDetails(p => ({...p, state: val}))} />
                  <TextInput style={[styles.inputMUI, {flex: 1}]} placeholder="Zip Code*" placeholderTextColor="#AEAEAE" value={locationDetails.zipCode} onChangeText={val => setLocationDetails(p => ({...p, zipCode: val}))} keyboardType="numeric" />
                </View>
                <TextInput style={styles.inputMUI} placeholder="Contact Phone (Optional)" placeholderTextColor="#AEAEAE" value={locationDetails.phoneNumber} onChangeText={val => setLocationDetails(p => ({...p, phoneNumber: val}))} keyboardType="phone-pad" />
                <TextInput style={styles.textArea} placeholder="Additional Notes (e.g., Apt #, gate code)" placeholderTextColor="#AEAEAE" value={locationDetails.additionalNotes} onChangeText={val => setLocationDetails(p => ({...p, additionalNotes: val}))} multiline />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Vehicle Information</Text>
                <TextInput style={styles.inputMUI} placeholder="Make*" placeholderTextColor="#AEAEAE" value={vehicleMake} onChangeText={setVehicleMake} />
                <TextInput style={styles.inputMUI} placeholder="Model*" placeholderTextColor="#AEAEAE" value={vehicleModel} onChangeText={setVehicleModel} />
                <View style={styles.row}>
                  <TextInput style={[styles.inputMUI, {flex: 1, marginRight: 8}]} placeholder="Year*" placeholderTextColor="#AEAEAE" value={vehicleYear} onChangeText={setVehicleYear} keyboardType="numeric" maxLength={4} />
                  <TextInput style={[styles.inputMUI, {flex: 1}]} placeholder="License Plate (Optional)" placeholderTextColor="#AEAEAE" value={licensePlate} onChangeText={setLicensePlate} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Schedule (Optional)</Text>
                <View style={styles.row}>
                  <TextInput style={[styles.inputMUI, {flex: 1, marginRight: 8}]} placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#AEAEAE" value={serviceDate} onChangeText={setServiceDate} />
                  <TextInput style={[styles.inputMUI, {flex: 1}]} placeholder="Time (HH:MM)" placeholderTextColor="#AEAEAE" value={serviceTime} onChangeText={setServiceTime} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Service Items</Text>
                <View style={styles.lineItemInputRow}>
                  <View style={[styles.inputContainer, {flex: 1, marginRight: 8, marginBottom: 0}]}>
                    <TextInput style={styles.input} placeholder="Service item description" placeholderTextColor="#AEAEAE" value={currentItemDesc} onChangeText={setCurrentItemDesc} />
                  </View>
                  <View style={[styles.inputContainer, {width: 100, marginRight: 8, marginBottom: 0}]}>
                    <TextInput style={styles.input} placeholder="Price" placeholderTextColor="#AEAEAE" value={currentItemPrice} onChangeText={setCurrentItemPrice} keyboardType="numeric" />
                  </View>
                  <TouchableOpacity style={styles.addItemButton} onPress={handleAddLineItem}>
                    <PlusCircle size={24} color="#00F0FF" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={lineItems}
                  renderItem={renderLineItem}
                  keyExtractor={(item) => item.id}
                  style={styles.lineItemsList}
                  scrollEnabled={false}
                />
                
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
  safeArea: { flex: 1, backgroundColor: '#0A0F1E' },
  keyboardAvoidingContainer: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#121827', borderBottomWidth: 1, borderBottomColor: '#2A3555' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  scrollableContent: { flex: 1, paddingHorizontal: 20 },
  scrollContentContainer: { flexGrow: 1, paddingBottom: 100 },
  searchSectionContainer: { marginBottom: 10 },
  section: { marginBottom: 20 },
  label: { fontSize: 16, fontFamily: 'Inter_500Medium', color: '#E0E0E0', marginBottom: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(42, 53, 85, 0.5)', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#7A89FF', height: 48, marginBottom: 12, },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: '100%', color: '#FFFFFF', fontFamily: 'Inter_400Regular', fontSize: 15 },
  inputMUI: { height: 48, color: '#FFFFFF', fontFamily: 'Inter_400Regular', fontSize: 15, backgroundColor: 'rgba(42, 53, 85, 0.5)', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#7A89FF', marginBottom: 12 },
  textArea: { minHeight: 100, textAlignVertical: 'top', paddingVertical: 10, backgroundColor: 'rgba(42, 53, 85, 0.5)', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#7A89FF', color: '#FFFFFF', fontFamily: 'Inter_400Regular', fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  resultsList: { maxHeight: 200 },
  customerItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#2A3555' },
  customerName: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 15 },
  customerEmail: { color: '#AEAEAE', fontFamily: 'Inter_400Regular', fontSize: 13 },
  selectedCustomerContainer: { padding: 16, backgroundColor: '#1C2333', borderRadius: 8, borderColor: '#00F0FF', borderWidth: 1, marginBottom: 20 },
  selectedCustomerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedCustomerName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  selectedCustomerDetails: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#AEAEAE', marginTop: 4 },
  changeCustomerText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#00F0FF' },
  lineItemInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  addItemButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 240, 255, 0.1)', borderColor: '#00F0FF', borderWidth: 1, borderRadius: 8, },
  lineItemsList: { marginBottom: 10 },
  lineItemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#1C2333', borderRadius: 6, marginBottom: 6 },
  lineItemTextContainer: { flex: 1 },
  lineItemDescription: { color: '#E0E0E0', fontFamily: 'Inter_400Regular', fontSize: 14 },
  lineItemPrice: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14 },
  removeButton: { padding: 6 },
  totalPriceContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#2A3555' },
  totalPriceLabel: { fontSize: 16, fontFamily: 'Inter_500Medium', color: '#E0E0E0', marginRight: 8 },
  totalPriceAmount: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  sendButton: { backgroundColor: '#00F0FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: BUTTON_HEIGHT, borderRadius: 8, marginTop: 20 },
  sendButtonDisabled: { backgroundColor: 'rgba(0, 240, 255, 0.3)' },
  sendButtonText: { color: '#0A0F1E', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  loader: { marginVertical: 10 },
});