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
import { X, Trash2, MapPin, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, firestore, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useRequestsContext, MediaItem } from '@/contexts/RequestsContext';

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

  const handleAddMedia = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickFromLibrary = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload images.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true, // Get base64 data for reliable upload
    });

    if (!result.canceled && result.assets) {
      // Store both URI (for display) and base64 (for upload)
      const newMedia: MediaItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        base64: asset.base64 || '',
        mimeType: asset.mimeType || 'image/jpeg',
      }));
      setMedia([...media, ...newMedia]);
    }
  };

  const takePhoto = async () => {
    // Request camera permission first
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow camera access to take photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true, // Get base64 data for reliable upload
    });

    if (!result.canceled && result.assets) {
      const newMedia: MediaItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        base64: asset.base64 || '',
        mimeType: asset.mimeType || 'image/jpeg',
      }));
      setMedia([...media, ...newMedia]);
    }
  };

  const removeMedia = (uri: string) => {
    setMedia(media.filter((m: MediaItem) => m.uri !== uri));
  };

  const uploadMediaAndGetUrls = async (mediaItems: MediaItem[], orderId: string) => {
    const urls: string[] = [];
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      const contentType = item.mimeType || 'image/jpeg';
      const extension = contentType.split('/')[1] || 'jpg';
      const fileName = `${orderId}-${i}.${extension}`;
      const path = `repairOrders/${auth.currentUser!.uid}/${fileName}`;
      const storageRef = ref(storage, path);
      
      // Upload using base64 string (more reliable in React Native)
      await uploadString(storageRef, item.base64, 'base64', { contentType });
      const downloadUrl = await getDownloadURL(storageRef);
      urls.push(downloadUrl);
    }
    return urls;
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
      const orderRef = await addDoc(collection(firestore, 'repair-orders'), {
        customerId: auth.currentUser.uid,
        categories: selectedCategories,
        vehicleInfo: vehicle,
        description: serviceDescription,
        locationDetails: { address: location },
        mediaUrls: [], // populated after upload
        status: 'Pending',
        orderType: 'standard',
        providerId: null,
        items: [],
        createdAt: serverTimestamp(),
      });

      if (media.length > 0) {
        const mediaUrls = await uploadMediaAndGetUrls(media, orderRef.id);
        await updateDoc(orderRef, { mediaUrls });
      }

      Alert.alert('Success', 'Your repair order has been submitted!');
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
        <Text style={styles.cardTitle}>Services Description<Text style={styles.requiredStar}> *</Text></Text>
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
          <Text style={styles.categoryTitle}>Category<Text style={styles.requiredStar}> *</Text></Text>
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
        <Text style={styles.cardTitle}>Vehicle<Text style={styles.requiredStar}> *</Text></Text>
        <View style={styles.vehicleRow}>
          <View style={styles.vehicleIcon}>
            <Text style={styles.vehicleIconText}>🚗</Text>
          </View>
          <TextInput
            style={[styles.vehicleInput]}
            placeholder="Enter vehicle (e.g., Toyota Corolla LEA - 7180)"
            placeholderTextColor="#A0A3BD"
            value={vehicle}
            onChangeText={setVehicle}
          />
          {vehicle.length > 0 && (
            <Pressable style={styles.clearButton} onPress={() => setVehicle('')}>
              <X size={18} color="#4E4B66" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Location */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vehicle Location<Text style={styles.requiredStar}> *</Text></Text>
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
          <Pressable style={styles.addButtonSmall} onPress={handleAddMedia}>
            <Plus size={20} color="#4E4B66" />
          </Pressable>
        </View>
        {media.length > 0 && (
          <View style={styles.mediaList}>
            {media.map((item: MediaItem, index: number) => (
              <View key={index} style={styles.mediaItem}>
                <View style={styles.mediaThumbnail}>
                  <Text style={styles.mediaText}>📷</Text>
                </View>
                <View style={styles.mediaInfo}>
                  <Text style={styles.mediaName}>image-{index + 1}.jpg</Text>
                  <Text style={styles.mediaSize}>Ready to upload</Text>
                </View>
                <Pressable onPress={() => removeMedia(item.uri)}>
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
  requiredStar: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 4,
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
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7FC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9DBE9',
    paddingHorizontal: 12,
    height: 52,
  },
  vehicleIcon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIconText: {
    fontSize: 18,
  },
  vehicleText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#14142B',
  },
  vehicleInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#4E4B66',
    paddingVertical: 0,
    marginLeft: 8,
  },
  clearButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
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

