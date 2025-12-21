import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { X, Plus, Trash2, MapPin } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, firestore } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useRequestsContext } from '@/contexts/RequestsContext';

type Category = 'Car Towing' | 'Just Check' | 'Oil Change' | 'Brake Service' | 'Diagnostics';

export default function CustomQuoteRequestForm() {
  const {
    progress,
    setProgress,
    selectedCategories,
    setSelectedCategories,
    vehicle,
    setVehicle,
    serviceDescription,
    setServiceDescription,
    location,
    setLocation,
    media,
    setMedia,
    resetForm,
  } = useRequestsContext();
  
  const [submitting, setSubmitting] = useState(false);

  const categories: Category[] = ['Car Towing', 'Just Check', 'Oil Change', 'Brake Service', 'Diagnostics'];

  // Calculate progress based on form completion
  useEffect(() => {
    const fields = [
      serviceDescription.trim().length > 0,
      selectedCategories.length > 0,
      vehicle.trim().length > 0,
      location.trim().length > 0,
    ];
    
    const completedFields = fields.filter(Boolean).length;
    const totalFields = fields.length;
    const calculatedProgress = Math.round((completedFields / totalFields) * 100);
    
    setProgress(calculatedProgress);
  }, [serviceDescription, selectedCategories, vehicle, location, setProgress]);

  // Check if form is valid (all required fields filled)
  const isFormValid = 
    serviceDescription.trim().length > 0 &&
    selectedCategories.length > 0 &&
    vehicle.trim().length > 0 &&
    location.trim().length > 0;

  const toggleCategory = (cat: Category) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setMedia([...media, ...result.assets.map((asset) => asset.uri)]);
    }
  };

  const removeMedia = (uri: string) => {
    setMedia(media.filter((m) => m !== uri));
  };

  const handleConfirm = async () => {
    if (!auth.currentUser) {
      Alert.alert('Not signed in', 'Please sign in to submit a request.');
      return;
    }
    
    if (!isFormValid) {
      Alert.alert('Missing details', 'Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(firestore, 'quoteRequests'), {
        customerId: auth.currentUser.uid,
        categories: selectedCategories,
        vehicleInfo: vehicle,
        description: serviceDescription,
        location,
        media,
        status: 'submitted',
        createdAt: serverTimestamp(),
      });
      Alert.alert('Success', 'Your request has been submitted!');
      // Reset form after successful submission
      resetForm();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}% complete to book your service.</Text>
      </View>

      {/* Services Description */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Services Description</Text>
        <TextInput
          style={styles.descriptionInput}
          value={serviceDescription}
          onChangeText={setServiceDescription}
          multiline
          placeholder="Describe the service you need..."
          placeholderTextColor="#A0A3BD"
        />
      </View>

      {/* Category */}
      <View style={[styles.card, styles.categoryCard]}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>Category</Text>
          <Pressable style={styles.addButton} onPress={() => Alert.alert('Add Category', 'Feature coming soon')}>
            <Plus size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.categoryPills}>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.pill, selectedCategories.includes(cat) && styles.pillSelected]}
              onPress={() => toggleCategory(cat)}
            >
              <Text style={[styles.pillText, selectedCategories.includes(cat) && styles.pillTextSelected]}>
                {cat}
              </Text>
              {selectedCategories.includes(cat) && <X size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Vehicle */}
      <View style={styles.card}>
        <View style={styles.vehicleHeader}>
          <Text style={styles.cardTitle}>Vehicle</Text>
          <Pressable style={styles.addButtonSmall}>
            <Plus size={20} color="#4E4B66" />
          </Pressable>
        </View>
        {vehicle ? (
          <View style={styles.vehicleItem}>
            <View style={styles.vehicleIcon}>
              <Text style={styles.vehicleIconText}>🚗</Text>
            </View>
            <Text style={styles.vehicleText}>{vehicle}</Text>
            <Pressable onPress={() => setVehicle('')}>
              <X size={20} color="#4E4B66" />
            </Pressable>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Enter vehicle (e.g., Toyota Corolla LEA - 7180)"
            placeholderTextColor="#A0A3BD"
            value={vehicle}
            onChangeText={setVehicle}
          />
        )}
      </View>

      {/* Location */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vehicle Location</Text>
        <View style={styles.locationContainer}>
          <View style={styles.locationInputWrapper}>
            <View style={styles.locationDot} />
            <TextInput
              style={styles.locationInput}
              placeholder="Enter vehicle location"
              placeholderTextColor="#A0A3BD"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>
      </View>

      {/* Media */}
      <View style={styles.card}>
        <View style={styles.vehicleHeader}>
          <Text style={styles.cardTitle}>Media</Text>
          <Pressable style={styles.addButtonSmall} onPress={pickImage}>
            <Plus size={20} color="#4E4B66" />
          </Pressable>
        </View>
        {media.length > 0 && (
          <View style={styles.mediaList}>
            {media.map((uri, index) => (
              <View key={index} style={styles.mediaItem}>
                <View style={styles.mediaThumbnail}>
                  <Text style={styles.mediaText}>📷</Text>
                </View>
                <View style={styles.mediaInfo}>
                  <Text style={styles.mediaName}>image-{index + 1}.jpg</Text>
                  <Text style={styles.mediaSize}>20 mb</Text>
                </View>
                <Pressable onPress={() => removeMedia(uri)}>
                  <Trash2 size={20} color="#EF4444" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Confirm Button */}
      <Pressable
        style={[styles.confirmButton, (!isFormValid || submitting) && styles.confirmButtonDisabled]}
        onPress={handleConfirm}
        disabled={!isFormValid || submitting}
      >
        <Text style={styles.confirmButtonText}>
          {submitting ? 'Submitting...' : !isFormValid ? 'Complete All Fields' : 'Confirm Request'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E9F3',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 0,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#D9DBE9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5B57F5',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: '#6E7191',
    fontFamily: 'Inter_400Regular',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#14142B',
    marginBottom: 12,
  },
  descriptionInput: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#4E4B66',
    lineHeight: 22,
    minHeight: 60,
  },
  input: {
    backgroundColor: '#F7F7FC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9DBE9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#4E4B66',
  },
  categoryCard: {
    backgroundColor: '#5B57F5',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pillSelected: {
    backgroundColor: '#FFFFFF',
  },
  pillText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  pillTextSelected: {
    color: '#5B57F5',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F7FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F7FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleIconText: {
    fontSize: 20,
  },
  vehicleText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#14142B',
  },
  locationContainer: {
    paddingLeft: 8,
  },
  locationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#4E4B66',
    paddingVertical: 8,
    marginLeft: 12,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#5B57F5',
    backgroundColor: '#FFFFFF',
  },
  locationDotEnd: {
    backgroundColor: '#5B57F5',
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: '#D9DBE9',
    marginLeft: 4,
    marginVertical: 4,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#4E4B66',
    flex: 1,
  },
  mediaList: {
    gap: 12,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  mediaThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F7F7FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mediaText: {
    fontSize: 24,
  },
  mediaInfo: {
    flex: 1,
  },
  mediaName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#14142B',
    marginBottom: 2,
  },
  mediaSize: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#A0A3BD',
  },
  confirmButton: {
    backgroundColor: '#5B57F5',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    shadowColor: '#5B57F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
});

