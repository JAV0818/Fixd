import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Car, ScanLine, Save } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { auth, firestore } from '@/lib/firebase'; // Import Firebase config
import { collection, addDoc } from 'firebase/firestore'; // Import Firestore functions

type Props = NativeStackScreenProps<RootStackParamList, 'AddVehicle'>;

export default function AddVehicleScreen({ navigation }: Props) {
  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [plateState, setPlateState] = useState(''); // e.g., 'CA'
  const [vehicleDetails, setVehicleDetails] = useState<any>(null); // Store fetched details
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const handleLookup = async () => {
    setLookingUp(true);
    setLookupError('');
    setVehicleDetails(null);
    console.log(`Looking up VIN: ${vin} or Plate: ${licensePlate} (${plateState})`);
    // TODO: Implement API call to VIN/Plate lookup service
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    // --- MOCK RESPONSE --- 
    if (vin === 'TESTVIN123' || licensePlate === 'TESTPLATE') {
      setVehicleDetails({ make: 'Honda', model: 'Civic', year: 2020, color: 'Blue' });
    } else {
       setLookupError('Could not find vehicle details. Please check input.');
    }
    // --- END MOCK --- 
    setLookingUp(false);
  };

  const handleSave = async () => {
    if (!vehicleDetails) {
      Alert.alert("No Details", "Please look up vehicle details before saving.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not Logged In", "You must be logged in to save a vehicle.");
      return;
    }

    setSaving(true);
    console.log("Saving vehicle:", vehicleDetails);

    try {
      // Reference to the user's 'vehicles' subcollection
      const vehiclesCollectionRef = collection(firestore, 'users', user.uid, 'vehicles');

      // Add the vehicle data as a new document
      // We'll use the details fetched from the (mock) lookup
      const vehicleDataToSave = {
        make: vehicleDetails.make,
        model: vehicleDetails.model,
        year: vehicleDetails.year,
        color: vehicleDetails.color || null, // Handle optional color
        addedAt: new Date(), // Add a timestamp
        // Include VIN or Plate info if desired
        vin: vin || null, 
        licensePlate: licensePlate || null,
        plateState: plateState || null,
      };

      await addDoc(vehiclesCollectionRef, vehicleDataToSave);

      Alert.alert("Success", "Vehicle added successfully!");
      navigation.goBack(); // Go back after successful save

    } catch (error) {
      console.error("Error saving vehicle:", error);
      Alert.alert("Error", "Could not save vehicle. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ADD VEHICLE</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Enter VIN</Text>
        <View style={styles.inputContainer}>
          <ScanLine size={20} color="#00F0FF" />
          <TextInput
            style={styles.input}
            placeholder="Vehicle Identification Number (VIN)"
            placeholderTextColor="#7A89FF"
            value={vin}
            onChangeText={setVin}
            autoCapitalize="characters"
            maxLength={17}
          />
        </View>

        <Text style={styles.orText}>OR</Text>

        <Text style={styles.sectionTitle}>Enter License Plate</Text>
        <View style={styles.plateRow}>
          <View style={[styles.inputContainer, { flex: 2 }]}>
             <Car size={20} color="#00F0FF" />
             <TextInput
               style={styles.input}
               placeholder="License Plate Number"
               placeholderTextColor="#7A89FF"
               value={licensePlate}
               onChangeText={setLicensePlate}
               autoCapitalize="characters"
             />
           </View>
           <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
             <TextInput
               style={styles.input}
               placeholder="State"
               placeholderTextColor="#7A89FF"
               value={plateState}
               onChangeText={setPlateState}
               maxLength={2}
               autoCapitalize="characters"
             />
           </View>
        </View>

        <Pressable 
          style={[styles.lookupButton, lookingUp && styles.disabledButton]} 
          onPress={handleLookup}
          disabled={lookingUp || (!vin && (!licensePlate || !plateState))}
        >
          {lookingUp ? (
            <ActivityIndicator color="#0A0F1E"/>
          ) : (
            <Text style={styles.lookupButtonText}>LOOKUP VEHICLE</Text>
          )}
        </Pressable>

        {lookupError ? (
          <Text style={styles.errorText}>{lookupError}</Text>
        ) : null}

        {vehicleDetails && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Vehicle Found:</Text>
            <Text style={styles.detailsText}>{`${vehicleDetails.year} ${vehicleDetails.make} ${vehicleDetails.model}`}</Text>
            <Text style={styles.detailsText}>{`Color: ${vehicleDetails.color || 'N/A'}`}</Text>
            {/* Display other relevant details */} 

            <Pressable 
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#0A0F1E"/>
              ) : (
                <>
                  <Save size={18} color="#0A0F1E" />
                  <Text style={styles.saveButtonText}>SAVE VEHICLE</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// Add extensive styling for the new screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
    height: 50, // Ensure consistent height
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginLeft: 12,
  },
  orText: {
    textAlign: 'center',
    color: '#7A89FF',
    fontFamily: 'Inter_600SemiBold',
    marginVertical: 16,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lookupButton: {
    backgroundColor: '#00F0FF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  lookupButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0A0F1E',
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    color: '#FF3D71',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Inter_500Medium',
  },
  detailsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(26, 33, 56, 1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  detailsTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00F0FF',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0A0F1E',
    letterSpacing: 1,
    marginLeft: 8,
  },
}); 