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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { ArrowLeft, UserSearch, DollarSign, Send, PlusCircle, Trash2 } from 'lucide-react-native';
import { auth, firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { UserProfile, CustomCharge } from '../../types/customCharges';

// Define a type for line items
interface LineItem {
  id: string; // For unique key in FlatList and for removal
  itemDescription: string;
  itemPrice: number;
}

const BUTTON_HEIGHT = 56; // Moved to module scope

type Props = NativeStackScreenProps<ProviderStackParamList, 'CreateCustomCharge'>;

const DEBOUNCE_DELAY = 500;

export default function CreateCustomChargeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const currentUser = auth.currentUser;
  const bottomSafe = insets.bottom; // Use insets.bottom directly

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);
  const [overallDescription, setOverallDescription] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [currentItemDesc, setCurrentItemDesc] = useState('');
  const [currentItemPrice, setCurrentItemPrice] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mechanicProfile, setMechanicProfile] = useState<UserProfile | null>(null);
  const [derivedMechanicName, setDerivedMechanicName] = useState<string>('Fixd Mechanic');

  useEffect(() => {
    const fetchMechanicProfile = async () => {
      console.log("[fetchMechanicProfile] Attempting to fetch profile for currentUser:", currentUser?.uid);
      if (currentUser) {
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const fetchedData = userDocSnap.data();
            const profileToSet: UserProfile = {
              id: userDocSnap.id, // Definitive ID from the snapshot
              email: fetchedData.email, // Ensure email is mapped
              firstName: fetchedData.firstName, // Ensure firstName is mapped
              lastName: fetchedData.lastName,   // Ensure lastName is mapped
              isAdmin: fetchedData.isAdmin,   // Ensure isAdmin is mapped
              phone: fetchedData.phone,     // Ensure phone is mapped
              // Explicitly do NOT map displayName unless you intend to use it from Firestore
              // displayName: fetchedData.displayName 
            };
            console.log("[fetchMechanicProfile] Mechanic document found. Profile to set:", profileToSet);
            setMechanicProfile(profileToSet);
          } else {
            console.warn("[fetchMechanicProfile] Mechanic document NOT found for UID:", currentUser.uid);
            // Fallback: use auth display name or email if Firestore doc is missing
            setMechanicProfile({
              id: currentUser.uid,
              email: currentUser.email || undefined,
              // Attempt to parse a name from auth.currentUser.displayName if structured
              firstName: currentUser.displayName?.split(' ')[0] || undefined, 
              lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || undefined,
              // No isAdmin or phone from auth, set to defaults or undefined
            } as UserProfile);
            console.log("[fetchMechanicProfile] Using fallback profile from auth details.");
          }
        } catch (error) {
          console.error("[fetchMechanicProfile] Error fetching mechanic profile:", error);
          setMechanicProfile({ 
            id: currentUser.uid, 
            email: currentUser.email || undefined,
            firstName: "Fixd", lastName: "Mechanic" // Generic fallback on error
          } as UserProfile);
        }
      } else {
        console.warn("[fetchMechanicProfile] currentUser is null.");
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
      try {
        const usersRef = collection(firestore, 'users');
        const normalizedSearchQuery = searchQuery.toLowerCase();
        const q = query(usersRef, limit(50));
        const querySnapshot = await getDocs(q);
        let potentialUsers: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          potentialUsers.push({ id: doc.id, ...doc.data() } as UserProfile);
        });
        const filteredUsers = potentialUsers.filter(user => {
          const isCustomer = user.isAdmin === false;
          const emailMatch = user.email?.toLowerCase().includes(normalizedSearchQuery);
          const phoneMatch = user.phone?.includes(normalizedSearchQuery);
          return isCustomer && (emailMatch || phoneMatch);
        });
        setSearchResults(filteredUsers.slice(0, 15));
      } catch (error) {
        console.error("Error searching users:", error);
        Alert.alert("Search Error", "Could not fetch users.");
      } finally {
        setIsSearching(false);
      }
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
      Alert.alert("Invalid Item", "Please enter a valid description and price for the item.");
      return;
    }
    setLineItems(prevItems => [
      ...prevItems,
      { id: Date.now().toString(), itemDescription: currentItemDesc.trim(), itemPrice: numericItemPrice }
    ]);
    setCurrentItemDesc('');
    setCurrentItemPrice('');
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleSendChargeRequest = async () => {
    console.log("[handleSendChargeRequest] Clicked. Validating inputs...");
    if (!selectedCustomer) {
      Alert.alert("No Customer Selected", "Please search and select a customer.");
      console.log("[handleSendChargeRequest] Validation failed: No selected customer.");
      return;
    }
    if (lineItems.length === 0) {
      Alert.alert("No Items", "Please add at least one service item.");
      console.log("[handleSendChargeRequest] Validation failed: No line items.");
      return;
    }
    if (!overallDescription.trim()) {
      Alert.alert("Missing Summary", "Please enter an overall summary for the charge.");
      console.log("[handleSendChargeRequest] Validation failed: No overall description.");
      return;
    }
    if (totalPrice <= 0) {
      Alert.alert("Invalid Total Price", "Total price must be greater than 0.");
      console.log("[handleSendChargeRequest] Validation failed: Total price is not positive.");
      return;
    }
    if (!currentUser) {
      Alert.alert("Error", "Current user not found. Please re-login.");
      console.log("[handleSendChargeRequest] Error: Current user not found.");
      return;
    }

    // Construct mechanicName from mechanicProfile fields
    let determinedMechanicName = 'Fixd Mechanic'; // Default fallback
    if (mechanicProfile) {
      if (mechanicProfile.firstName || mechanicProfile.lastName) {
        determinedMechanicName = `${mechanicProfile.firstName || ''} ${mechanicProfile.lastName || ''}`.trim();
      } else if (mechanicProfile.email) {
        determinedMechanicName = mechanicProfile.email;
      }
    }
    // If, after all checks, name is still the generic default AND we couldn't even get an email as part of profile
    if (determinedMechanicName === 'Fixd Mechanic' && (!mechanicProfile || !mechanicProfile.email)) {
        Alert.alert("Error", "Mechanic details are incomplete. Please ensure your profile is set up.");
        console.log("[handleSendChargeRequest] Error: Mechanic name could not be determined meaningfully.");
        return;
    }
    console.log("[handleSendChargeRequest] Validations passed. Using mechanic name:", determinedMechanicName);

    const customerName = selectedCustomer.firstName || selectedCustomer.lastName 
      ? `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim()
      : selectedCustomer.email || 'Valued Customer';

    const customChargeData: Omit<CustomCharge, 'id'> = {
      mechanicId: currentUser.uid,
      mechanicName: determinedMechanicName, // USE THE CORRECTLY DERIVED MECHANIC NAME
      customerId: selectedCustomer.id,
      customerName: customerName,
      description: overallDescription.trim(),
      price: totalPrice,
      status: "PendingApproval",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    console.log("[handleSendChargeRequest] Custom charge data prepared:", JSON.stringify(customChargeData, null, 2));

    setIsSubmitting(true);
    console.log("[handleSendChargeRequest] setIsSubmitting(true)");
    try {
      console.log("[handleSendChargeRequest] Attempting to add document to Firestore customCharges collection...");
      const docRef = await addDoc(collection(firestore, 'customCharges'), customChargeData);
      console.log("[handleSendChargeRequest] Document successfully written with ID:", docRef.id);
      Alert.alert("Success", "Custom charge request sent to the customer!");
      
      setSelectedCustomer(null);
      setOverallDescription('');
      setLineItems([]); 
      console.log("[handleSendChargeRequest] Form cleared, navigating back.");
      navigation.goBack();
    } catch (error) {
      console.error("[handleSendChargeRequest] Error sending custom charge to Firestore:", error);
      let errorMessage = "Could not send the charge request.";
      if (error instanceof Error && error.message) {
        errorMessage += ` Server said: ${error.message}`;
      }
      Alert.alert("Submission Error", errorMessage);
    } finally {
      setIsSubmitting(false);
      console.log("[handleSendChargeRequest] setIsSubmitting(false)");
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
          <Text style={styles.headerTitle}>Create Custom Charge</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!selectedCustomer ? (
            <View style={styles.searchSectionContainer}>
              <Text style={styles.label}>1. Find Customer</Text>
              <View style={styles.inputContainer}>
                <UserSearch size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input} // Uses flex:1, height:48
                  placeholder="Search by email or phone..."
                  placeholderTextColor="#888"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
              </View>
              {isSearching && <ActivityIndicator style={styles.loader} color="#00F0FF" />}
              {searchResults.length > 0 && (
                <FlatList
                  data={searchResults}
                  renderItem={renderCustomerItem}
                  keyExtractor={(item) => item.id}
                  style={styles.resultsList}
                  nestedScrollEnabled 
                />
              )}
              {searchQuery.length > 1 && !isSearching && searchResults.length === 0 && (
                 <Text style={styles.noResultsText}>No customers found matching "{searchQuery}".</Text>
              )}
            </View>
          ) : (
            <View style={styles.selectedCustomerContainer}>
              <Text style={styles.label}>Customer:</Text>
              <View style={styles.selectedCustomerInfo}>
                <Text style={styles.selectedCustomerName}>
                  {selectedCustomer.firstName || ''} {selectedCustomer.lastName || ''}
                </Text>
                <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                  <Text style={styles.changeCustomerText}>Change</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.selectedCustomerDetails}>
                {selectedCustomer.email || 'No email'} | {selectedCustomer.phone || 'No phone'}
              </Text>
            </View>
          )}

          {selectedCustomer && (
            <View style={styles.chargeDetailsSection}> 
              <Text style={styles.label}>2. Overall Summary</Text>
              <View style={styles.textAreaContainer}> 
                <TextInput
                  style={[styles.inputBase, styles.descriptionInput]}
                  placeholder="Overall summary of the charge..."
                  placeholderTextColor="#888"
                  value={overallDescription}
                  onChangeText={setOverallDescription}
                  multiline
                />
              </View>

              <Text style={styles.label}>3. Service Items</Text>
              <View style={styles.lineItemInputRow}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8, marginBottom: 0 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Service item description"
                    placeholderTextColor="#888"
                    value={currentItemDesc}
                    onChangeText={setCurrentItemDesc}
                  />
                </View>
                <View style={[styles.inputContainer, { width: 100, marginRight: 8, marginBottom: 0 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Price"
                    placeholderTextColor="#888"
                    value={currentItemPrice}
                    onChangeText={setCurrentItemPrice}
                    keyboardType="numeric"
                  />
                </View>
                <TouchableOpacity style={styles.addItemButton} onPress={handleAddLineItem}>
                  <PlusCircle size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {lineItems.length > 0 && (
                <FlatList
                  data={lineItems}
                  renderItem={renderLineItem}
                  keyExtractor={(item) => item.id}
                  style={styles.lineItemsList}
                  scrollEnabled={false}
                />
              )}
              {lineItems.length === 0 && !currentItemDesc && !currentItemPrice && (
                 <Text style={styles.noItemsText}>No service items added yet.</Text>
              )}

              <View style={styles.totalPriceContainer}>
                <Text style={styles.totalPriceLabel}>Total:</Text>
                <Text style={styles.totalPriceAmount}>${totalPrice.toFixed(2)}</Text>
              </View>
            </View>
          )}

          {selectedCustomer && (
            <View style={styles.sendButtonContainerScrollable}> 
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (isSubmitting || lineItems.length === 0 || !overallDescription.trim()) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendChargeRequest}
                disabled={isSubmitting || lineItems.length === 0 || !overallDescription.trim()}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={20} color="#FFFFFF" style={{marginRight: 8}}/>
                    <Text style={styles.sendButtonText}>Send Charge Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#121827',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  scrollableContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  searchSectionContainer: { marginBottom: 10 },
  label: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#E0E0E0',
    marginTop: 20,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2333',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
    height: 48,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 8 },
  inputBase: {
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    width: '100%', 
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  textAreaContainer: {
    backgroundColor: '#1C2333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2A3555',
    marginBottom: 16,
    minHeight: 100,
  },
  descriptionInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  resultsList: { maxHeight: 200, backgroundColor: '#1C2333', borderRadius: 8 },
  customerItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#2A3555' },
  customerName: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 15 },
  customerEmail: { color: '#AEAEAE', fontFamily: 'Inter_400Regular', fontSize: 13 },
  noResultsText: { color: '#AEAEAE', textAlign: 'center', marginVertical: 16, fontFamily: 'Inter_400Regular' },
  selectedCustomerContainer: { marginTop: 20, padding: 16, backgroundColor: '#1C2333', borderRadius: 8, borderColor: '#00F0FF', borderWidth: 1, marginBottom: 20 },
  selectedCustomerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedCustomerName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  selectedCustomerDetails: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#AEAEAE', marginTop: 4 },
  changeCustomerText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#00F0FF' },
  chargeDetailsSection: {},
  lineItemInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addItemButton: {
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineItemsList: { marginTop: 10, marginBottom: 10 },
  lineItemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#1C2333', borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: '#2A3555' },
  lineItemTextContainer: { flex: 1 },
  lineItemDescription: { color: '#E0E0E0', fontFamily: 'Inter_400Regular', fontSize: 14 },
  lineItemPrice: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14, marginTop: 2 },
  removeButton: { padding: 6 },
  noItemsText: { color: '#AEAEAE', textAlign: 'center', marginVertical: 10, fontFamily: 'Inter_400Regular' },
  totalPriceContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#2A3555' },
  totalPriceLabel: { fontSize: 16, fontFamily: 'Inter_500Medium', color: '#E0E0E0', marginRight: 8 },
  totalPriceAmount: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  sendButtonContainerScrollable: {
    marginTop: 20,
    paddingBottom: 20,
  },
  sendButton: {
    backgroundColor: '#007BFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: BUTTON_HEIGHT,
    borderRadius: 8,
  },
  sendButtonDisabled: { backgroundColor: '#555' },
  loader: { marginVertical: 10 },
  sendButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
}); 