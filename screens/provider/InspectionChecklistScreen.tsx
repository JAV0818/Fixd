import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator'; // Adjust path if needed
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Camera, XCircle, Image as ImageIcon } from 'lucide-react-native';
import { auth, firestore, storage } from '@/lib/firebase'; // Assuming storage is exported from firebase config
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

// Define the structure for an inspection item
interface InspectionItem {
  key: string;
  label: string;
  category: string; // To group items
}

// Define categories and their items
const inspectionCategories: { title: string; items: InspectionItem[] }[] = [
  {
    title: 'INTERIOR & FUNCTIONAL CHECKS',
    items: [
      { key: 'horn', label: 'Horn', category: 'Interior' },
      { key: 'lights', label: 'Lights (Headlights, Taillights, Brake, etc.)', category: 'Interior' },
      { key: 'turnSignals', label: 'Turn Signals & Emergency Flashers', category: 'Interior' },
      { key: 'instrumentsGauges', label: 'Instruments & Gauges', category: 'Interior' },
      { key: 'wiperOperation', label: 'Wiper Operation', category: 'Interior' },
      { key: 'wiperBlades', label: 'Wiper Blades', category: 'Interior' },
      { key: 'washers', label: 'Washers', category: 'Interior' },
      { key: 'seatBeltOperation', label: 'Seat Belt Operation', category: 'Interior' },
      { key: 'hvacOperation', label: 'HVAC Operation (Heat & AC)', category: 'Interior' },
      { key: 'brakePedalOperation', label: 'Brake Pedal Operation & Feel', category: 'Interior' },
      { key: 'parkingBrakeOperation', label: 'Parking Brake Operation', category: 'Interior' },
      { key: 'clutchOperation', label: 'Clutch Operation (if applicable)', category: 'Interior' },
      { key: 'glassPowerWindowOperation', label: 'Glass / Power Window Operation', category: 'Interior' },
      { key: 'mirrorOperation', label: 'Mirror Operation - Side / Auto-Dimming', category: 'Interior' },
      { key: 'doorLatchesPowerLock', label: 'Door Latches / Power Lock Operation', category: 'Interior' },
      { key: 'fuelCap', label: 'Fuel Cap', category: 'Interior' },
    ],
  },
  {
    title: 'UNDER HOOD CHECKS',
    items: [
      { key: 'steeringPumpHoses', label: 'Steering / Pump / Hoses', category: 'Under Hood' },
      { key: 'psFluidLevelCondition', label: 'P/S Fluid Level / Condition', category: 'Under Hood' },
      { key: 'hvacLeaksHoses', label: 'HVAC Leaks / Hoses (Under Hood)', category: 'Under Hood' },
      { key: 'batteryTerminalsCables', label: 'Battery Terminals / Cables / Hold Down', category: 'Under Hood' },
      { key: 'driveBelts', label: 'Drive Belts (Cracking, Fraying, Tension)', category: 'Under Hood' },
      { key: 'engineOilLevelCondition', label: 'Engine Oil Level / Condition', category: 'Under Hood' },
      { key: 'fluidLevels', label: 'ATF / Diff. Fluid / MT Gear Oil Level / Condition', category: 'Under Hood' },
      { key: 'brakeFluidLevelCondition', label: 'Brake Fluid Level / Condition', category: 'Under Hood' },
      { key: 'masterCylinderLeaks', label: 'Master Cylinder / Leaks / Fluid Condition', category: 'Under Hood' },
      { key: 'pcvSystem', label: 'PCV System', category: 'Under Hood' },
      { key: 'airFilter', label: 'Air Filter', category: 'Under Hood' },
      { key: 'radiatorCoolantLeaksHoses', label: 'Radiator / Coolant Leaks / Hoses / Level', category: 'Under Hood' },
    ],
  },
  {
    title: 'DIAGNOSTIC CHECKS',
    items: [
        { key: 'engineManagementCodes', label: 'Engine Management Codes (Check Engine Light)', category: 'Diagnostics' },
        { key: 'transmissionManagementCodes', label: 'Transmission Management Codes', category: 'Diagnostics' },
        { key: 'absSystemCodes', label: 'ABS System Codes', category: 'Diagnostics' },
        { key: 'batteryTestResults', label: 'Battery Test (Voltage, CCA if tested)', category: 'Diagnostics' },
    ],
  },
  {
    title: 'UNDER VEHICLE CHECKS (LIFT OR JACK STANDS REQUIRED)',
    items: [
      { key: 'oilFilterCondition', label: 'Oil Filter (Leaks, Condition)', category: 'Under Vehicle' },
      { key: 'steeringSystemLinkage', label: 'Steering System - Linkage / Mounts / Boots', category: 'Under Vehicle' },
      { key: 'frontSuspensionStrut', label: 'Front Suspension / Strut / Shocks (Leaks, Damage)', category: 'Under Vehicle' },
      { key: 'rearSuspensionStrut', label: 'Rear Suspension / Strut / Shocks (Leaks, Damage)', category: 'Under Vehicle' },
      { key: 'transmissionInspection', label: 'Inspection of Transmission / Shift Linkage (Leaks, Condition)', category: 'Under Vehicle' },
      { key: 'engineMounts', label: 'Engine Mounts (Condition)', category: 'Under Vehicle' },
      { key: 'axlesBoots', label: 'Axles & Boots (CV Joints, U-Joints)', category: 'Under Vehicle' },
      { key: 'fluidLeaksEngine', label: 'Fluid Leaks - Engine Area', category: 'Under Vehicle' },
      { key: 'fluidLeaksTransmission', label: 'Fluid Leaks - Transmission Area', category: 'Under Vehicle' },
      { key: 'fluidLeaksDifferential', label: 'Fluid Leaks - Front & Rear Differential', category: 'Under Vehicle' },
      { key: 'rearDiffFluidLevel', label: 'Rear Diff. Fluid Level (if applicable/accessible)', category: 'Under Vehicle' },
      { key: 'exhaustPipesMuffler', label: 'Exhaust System (Front Pipe, Center Pipe, Muffler - Leaks, Damage, Mounts)', category: 'Under Vehicle' },
    ],
  },
  {
    title: 'TIRES & BRAKES',
    items: [
      { key: 'brakePadsGeneral', label: 'Brake Pads Condition (General)', category: 'Tires & Brakes' },
      { key: 'tireTreadGeneral', label: 'Tire Tread Depth (General)', category: 'Tires & Brakes' },
      { key: 'tireWearPatternGeneral', label: 'Tire Wear Pattern (General)', category: 'Tires & Brakes' },
      { key: 'tirePressureGeneral', label: 'Tire Pressure (General - Check all)', category: 'Tires & Brakes' },
    ],
  },
  {
    title: 'MAINTENANCE ITEMS',
    items: [
        { key: 'cabinAirFilterDue', label: 'Cabin Air Filter Change Due?', category: 'Maintenance' },
        { key: 'sparkPlugsDue', label: 'Spark Plugs Change Due (Based on mileage/time)?', category: 'Maintenance' },
    ],
  }
];


type RatingValue = 'green' | 'yellow' | 'red' | undefined;
type Ratings = Record<string, RatingValue>;
type ImageAsset = ImagePicker.ImagePickerAsset;

type Props = NativeStackScreenProps<ProviderStackParamList, 'InspectionChecklist'>;

export default function InspectionChecklistScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const [ratings, setRatings] = useState<Ratings>({});
  const [selectedImages, setSelectedImages] = useState<ImageAsset[]>([]);
  const [imageUploadProgress, setImageUploadProgress] = useState<Record<string, number>>({});
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const reportRef = doc(firestore, 'repairOrders', orderId, 'inspectionReport', 'initial');
        const reportSnap = await getDoc(reportRef);
        if (reportSnap.exists()) {
          const data = reportSnap.data();
          setRatings(data.ratings || {});
          setUploadedImageUrls(data.imageUrls || []);
        }
      } catch (error) {
        console.error("Error fetching existing inspection report:", error);
        Alert.alert("Error", "Could not load existing report. Proceeding with new form.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [orderId]);

  const handleRatingChange = (itemKey: string, value: RatingValue) => {
    setRatings(prev => ({ ...prev, [itemKey]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Camera roll access is needed to upload photos.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets) {
      setSelectedImages(prev => {
        const newAssets = result.assets.filter(asset => !prev.some(existing => existing.uri === asset.uri));
        return [...prev, ...newAssets];
      });
    }
  };
  
  const removeSelectedImage = (assetUri: string) => {
    setSelectedImages(prev => prev.filter(img => img.uri !== assetUri));
  };

  const removeUploadedImage = (imageUrl: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to remove this uploaded image? This action cannot be undone from here.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setUploadedImageUrls(prev => prev.filter(url => url !== imageUrl));
          console.log("Removed image from UI. Deletion from storage and DB needs to be implemented if image was already saved.");
        }
      }
    ]);
  };

  const uploadImageAndGetURL = async (imageAsset: ImageAsset): Promise<string | null> => {
    if (!auth.currentUser) return null;
    setImageUploadProgress(prev => ({ ...prev, [imageAsset.uri]: 0 }));
    try {
      const response = await fetch(imageAsset.uri);
      const blob = await response.blob();
      const imageName = `${Date.now()}-${imageAsset.fileName || 'image.jpg'}`;
      const storagePath = `inspection_reports/${orderId}/initial/${imageName}`;
      const imageRef = ref(storage, storagePath);
      await uploadBytes(imageRef, blob);
      setImageUploadProgress(prev => ({ ...prev, [imageAsset.uri]: 100 }));
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (e) {
      console.error("Error uploading image: ", imageAsset.fileName, e);
      Alert.alert("Upload Error", `Failed to upload ${imageAsset.fileName || 'image'}`);
      setImageUploadProgress(prev => ({ ...prev, [imageAsset.uri]: -1 }));
      return null;
    }
  };

  const handleSaveInspection = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to save.");
      return;
    }
    setSaving(true);
    const newImageUrls: string[] = [];
    for (const imageAsset of selectedImages) {
        const alreadyUploaded = uploadedImageUrls.some(url => url.includes(imageAsset.fileName || imageAsset.uri.split('/').pop() || 'unique_fallback_string'));
        if (alreadyUploaded) continue;
        const downloadURL = await uploadImageAndGetURL(imageAsset);
        if (downloadURL) {
            newImageUrls.push(downloadURL);
        }
    }
    const finalImageUrls = Array.from(new Set([...uploadedImageUrls, ...newImageUrls]));
    try {
      const reportRef = doc(firestore, 'repairOrders', orderId, 'inspectionReport', 'initial');
      await setDoc(reportRef, {
        technicianUid: auth.currentUser.uid,
        orderId: orderId,
        ratings,
        imageUrls: finalImageUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      Alert.alert("Success", "Inspection report saved!");
      setUploadedImageUrls(finalImageUrls);
      setSelectedImages([]);
    } catch (error) {
      console.error("Error saving inspection report:", error);
      Alert.alert("Error", "Could not save inspection report. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  
  const renderRatingButtons = (itemKey: string) => {
    const currentRating = ratings[itemKey];
    return (
      <View style={styles.ratingButtonsContainer}>
        {(['green', 'yellow', 'red'] as const).map((color) => (
          <Pressable
            key={color}
            style={[
              styles.circleButton,
              { backgroundColor: color },
              currentRating === color && styles.selectedCircle,
            ]}
            onPress={() => handleRatingChange(itemKey, color)}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {paddingTop: insets.top, justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#00F0FF" />
        <Text style={styles.loadingText}>Loading Inspection Form...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Inspection Report</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {inspectionCategories.map((category) => (
          <View key={category.title} style={styles.categoryContainer}>
            <LinearGradient
                colors={['#1A2238', '#121827']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.categoryHeaderGradient}
            >
                <Text style={styles.categoryTitle}>{category.title}</Text>
            </LinearGradient>
            {category.items.map((item) => (
              <View key={item.key} style={styles.itemRow}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                {renderRatingButtons(item.key)}
              </View>
            ))}
          </View>
        ))}

        <View style={styles.categoryContainer}>
            <LinearGradient
                colors={['#1A2238', '#121827']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.categoryHeaderGradient}
            >
                <Text style={styles.categoryTitle}>Photos</Text>
            </LinearGradient>
          
          <View style={styles.imageUploadContent}>
            <FlatList
              horizontal
              data={[
                ...uploadedImageUrls.map(url => ({ uri: url, type: 'uploaded' as const, id: url })),
                ...selectedImages.map(img => ({ uri: img.uri, type: 'new' as const, id: img.uri, asset: img }))
              ]}
              renderItem={({ item }) => (
                <View style={styles.thumbnailContainer}>
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                  {(item.type === 'new' || item.type === 'uploaded') && (
                    <TouchableOpacity 
                        style={styles.removeImageButton} 
                        onPress={() => item.type === 'new' ? removeSelectedImage(item.uri) : removeUploadedImage(item.uri)}
                    >
                        <XCircle size={22} color="#FFFFFF" style={styles.removeImageIcon} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View style={styles.emptyImageContainer}>
                    <Text style={styles.noImagesText}>No images added yet.</Text>
                </View>
              }
              style={styles.thumbnailList}
              contentContainerStyle={{ paddingVertical: 10 }}
            />
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                <ImageIcon size={20} color="#00F0FF" style={{marginRight: 8}} />
                <Text style={styles.addPhotoButtonText}>Add Photos</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.disabledButton]} 
          onPress={handleSaveInspection}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <CheckCircle size={20} color="#FFFFFF" style={{marginRight: 8}}/>
              <Text style={styles.saveButtonText}>Save Inspection</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingVertical: 10,
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
    letterSpacing: 0.5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  categoryContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(26, 33, 56, 0.7)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  categoryHeaderGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 53, 85, 0.5)',
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#D0DFFF',
    marginRight: 10,
    lineHeight: 18,
  },
  ratingButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    borderColor: '#FFFFFF',
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 8,
  },
  imageUploadContent: {
    padding: 16,
  },
  addPhotoButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00F0FF',
    marginTop: 10,
  },
  addPhotoButtonText: {
    color: '#00F0FF',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  thumbnailList: {
    marginBottom: 10,
  },
  thumbnailContainer: {
    marginRight: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#00F0FF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(10, 15, 30, 0.85)', // Made slightly more opaque
    borderRadius: 11, // Half of the icon size (22)
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageIcon: {
    // No specific style needed if Lucide icon color is set directly
  },
  emptyImageContainer: {
    width: Dimensions.get('window').width - 64,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 53, 85, 0.3)',
    borderRadius: 8,
  },
  noImagesText: {
    color: '#7A89FF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#00F0FF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 0,
  },
  saveButtonText: {
    color: '#0A0F1E',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  disabledButton: {
    backgroundColor: '#7A89FF',
  },
  loadingText: {
    color: '#7A89FF',
    fontSize: 16,
    marginTop: 10,
    fontFamily: 'Inter_500Medium',
  }
}); 