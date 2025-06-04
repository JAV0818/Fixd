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
  Dimensions,
  TextInput
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator'; // Adjust path if needed
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Camera, XCircle, Image as ImageIcon, CameraIcon } from 'lucide-react-native';
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
  inputType?: 'rating' | 'text'; // Added: defaults to 'rating'
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
      { key: 'brakePadsGeneral', label: 'Brake Pads Condition (General)', category: 'Tires & Brakes', inputType: 'text' },
      { key: 'tireTreadGeneral', label: 'Tire Tread Depth (General)', category: 'Tires & Brakes', inputType: 'text' },
      { key: 'tireWearPatternGeneral', label: 'Tire Wear Pattern (General)', category: 'Tires & Brakes', inputType: 'text' },
      { key: 'tirePressureGeneral', label: 'Tire Pressure (General - Check all)', category: 'Tires & Brakes', inputType: 'text' },
    ],
  },
  {
    title: 'MAINTENANCE ITEMS',
    items: [
        { key: 'cabinAirFilterDue', label: 'Cabin Air Filter Change Due?', category: 'Maintenance', inputType: 'text' },
        { key: 'sparkPlugsDue', label: 'Spark Plugs Change Due (Based on mileage/time)?', category: 'Maintenance', inputType: 'text' },
    ],
  }
];


type RatingValue = 'green' | 'yellow' | 'red' | undefined;
type Ratings = Record<string, RatingValue>;
type TextInputs = Record<string, string>; // Added for text inputs
type ImageAsset = ImagePicker.ImagePickerAsset;

type Props = NativeStackScreenProps<ProviderStackParamList, 'InspectionChecklist'>;

export default function InspectionChecklistScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const [ratings, setRatings] = useState<Ratings>({});
  const [textInputs, setTextInputs] = useState<TextInputs>({}); // Added
  const [selectedImages, setSelectedImages] = useState<ImageAsset[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [overallSummaryNotes, setOverallSummaryNotes] = useState(""); // Added for overall notes

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const reportRef = doc(firestore, 'repairOrders', orderId, 'inspectionReport', 'initial');
        const reportSnap = await getDoc(reportRef);
        if (reportSnap.exists()) {
          const data = reportSnap.data();
          // Adapt to new data structure if present, otherwise adapt old
          if (data.sections) {
            const newRatings: Ratings = {};
            const newTextInputs: TextInputs = {};
            Object.values(data.sections).forEach((section: any) => {
              Object.entries(section).forEach(([itemKey, itemData]: [string, any]) => {
                if (itemData.rating) {
                  newRatings[itemKey] = itemData.rating;
                }
                if (itemData.value) {
                  newTextInputs[itemKey] = itemData.value;
                }
              });
            });
            setRatings(newRatings);
            setTextInputs(newTextInputs);
          } else if (data.ratings) { // Fallback for old structure
            setRatings(data.ratings || {});
          }
          setUploadedImageUrls(data.overallImageUrls || data.imageUrls || []); // Prioritize new overallImageUrls
          setOverallSummaryNotes(data.overallSummaryNotes || "");
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

  const handleTextInputChange = (itemKey: string, value: string) => {
    setTextInputs(prev => ({ ...prev, [itemKey]: value }));
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Media library access is needed to select photos.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images' as any,
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

  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Camera access is needed to take photos.");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'Images' as any,
      allowsEditing: false,
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
          // TODO: Optionally, implement deletion from Firebase Storage if the image was already saved in a *finalized* report.
          // For now, removing from UI and not re-saving the URL is sufficient for an editable report.
          console.log("Removed uploaded image URL from UI. It will not be saved unless re-added.");
        }
      }
    ]);
  };

  const handleSaveInspection = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to save.");
      return;
    }
    console.log('Current user UID attempting to save inspection:', auth.currentUser.uid);
    setSaving(true);
    
    const newImageUrls: string[] = [];
    // Upload newly selected images
    for (const imageAsset of selectedImages) {
      try {
        const response = await fetch(imageAsset.uri);
        const blob = await response.blob();
        const fileExtension = imageAsset.uri.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${auth.currentUser.uid}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const imageRef = ref(storage, `inspectionReports/${orderId}/${fileName}`);
        
        await uploadBytes(imageRef, blob);
        const downloadURL = await getDownloadURL(imageRef);
        newImageUrls.push(downloadURL);
      } catch (uploadError) {
        console.error("Error uploading an image:", uploadError);
        Alert.alert("Image Upload Failed", `Failed to upload image: ${imageAsset.fileName || 'selected image'}. Please try saving again.`);
        setSaving(false);
        return; // Stop saving if an image fails to upload
      }
    }

    const finalImageUrls = Array.from(new Set([...uploadedImageUrls, ...newImageUrls]));

    const reportRef = doc(firestore, 'repairOrders', orderId, 'inspectionReport', 'initial');
    
    const reportData: any = {
      technicianUid: auth.currentUser.uid,
      orderId: orderId,
      reportName: 'Initial Inspection',
      updatedAt: serverTimestamp(),
      sections: {},
      overallImageUrls: finalImageUrls, // Use the combined and uploaded URLs
      overallSummaryNotes: overallSummaryNotes, 
    };

    // Populate sections for Firestore
    inspectionCategories.forEach(category => {
      const sectionKey = category.title.toUpperCase().replace(/\s+/g, '_').replace(/&/g, 'AND');
      reportData.sections[sectionKey] = {};
      category.items.forEach(item => {
        reportData.sections[sectionKey][item.key] = {
          label: item.label, // Store label for easier display later
          rating: ratings[item.key] || null,
          value: textInputs[item.key] || null,
          notes: "", // Placeholder for item-specific notes
          imageUrls: [] // Placeholder for item-specific images
        };
      });
    });

    try {
      const existingReportSnap = await getDoc(reportRef);
      if (!existingReportSnap.exists()) {
        reportData.createdAt = serverTimestamp(); // Set createdAt only if it's a new report
      }

      await setDoc(reportRef, reportData, { merge: true });
      Alert.alert("Success", "Inspection report saved!");
      setSelectedImages([]); // Clear selected images after successful upload and save
      setUploadedImageUrls(finalImageUrls); // Update uploadedImageUrls to reflect the newly saved state
      navigation.navigate('RequestStart', { 
        orderId: orderId, 
        inspectionCompleted: true 
      });
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

  // Added: Render TextInput for specific items
  const renderTextInput = (item: InspectionItem) => {
    return (
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Enter details..."
          placeholderTextColor="#7A89FF"
          value={textInputs[item.key] || ''}
          onChangeText={(text) => handleTextInputChange(item.key, text)}
          multiline
        />
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
                {item.inputType === 'text' ? renderTextInput(item) : renderRatingButtons(item.key)}
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
                <Text style={styles.categoryTitle}>Overall Summary Notes</Text>
            </LinearGradient>
            <View style={styles.notesInputContainer}>
                <TextInput
                    style={styles.notesInput}
                    placeholder="Enter overall summary notes for the inspection..."
                    placeholderTextColor="#7A89FF"
                    value={overallSummaryNotes}
                    onChangeText={setOverallSummaryNotes}
                    multiline
                    numberOfLines={4}
                />
            </View>
        </View>

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
            <View style={styles.photoActionButtonsContainer}>
                <TouchableOpacity style={[styles.photoActionButton, styles.photoActionButtonSecondary]} onPress={pickImageFromLibrary}>
                    <ImageIcon size={20} color="#00F0FF" style={{marginRight: 8}} />
                    <Text style={styles.photoActionButtonText}>Add From Library</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoActionButton} onPress={takePhotoWithCamera}>
                    <CameraIcon size={20} color="#00F0FF" style={{marginRight: 8}} />
                    <Text style={styles.photoActionButtonText}>Take Photo</Text>
                </TouchableOpacity>
            </View>
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
    backgroundColor: '#0A0F1E', // Dark base for futuristic feel
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#00F0FF', // Glowey border
    // Add a subtle shadow to make it pop a bit
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5, // For Android
  },
  backButton: {
    padding: 8,
    // Add a glow effect on press (can be done via state or keep simple)
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF', // Main glow color
    letterSpacing: 1.5, // Wider spacing for futuristic look
    textShadowColor: 'rgba(0, 240, 255, 0.7)', // Text glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  categoryContainer: {
    marginBottom: 24, // Increased spacing
    backgroundColor: 'rgba(26, 33, 56, 0.85)', // Slightly more opaque
    borderRadius: 15, // Sharper edges than 12
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00F0FF', // Glowey border
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  categoryHeaderGradient: {
    paddingVertical: 14, // Increased padding
    paddingHorizontal: 16,
    // Removed gradient, will use solid color with glow for header for now, or can be re-added if preferred
    backgroundColor: 'rgba(0, 240, 255, 0.1)', // Light glow background for header
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 240, 255, 0.3)',
  },
  categoryTitle: {
    fontSize: 15, // Slightly smaller
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 1, // Futuristic spacing
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 240, 255, 0.5)', // Text glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16, // Increased padding
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 240, 255, 0.15)', // Subtle glowey separator
  },
  itemLabel: {
    flex: 0.6,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#E0EFFF', // Brighter text
    marginRight: 10,
    lineHeight: 20, // Increased line height
  },
  ratingButtonsContainer: {
    flex: 0.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  circleButton: {
    width: 32, // Slightly larger
    height: 32,
    borderRadius: 16,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: 'rgba(0, 240, 255, 0.3)', // Default glow border
    justifyContent: 'center',
    alignItems: 'center',
    // Add a base shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  selectedCircle: {
    borderColor: '#00F0FF', // Bright glow border for selected
    shadowColor: "#00F0FF", // Glow effect
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  imageUploadContent: {
    paddingVertical: 16, // No horizontal padding, use container's
  },
  photoActionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16, // Increased margin
    gap: 12,
  },
  photoActionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 240, 255, 0.15)', // More prominent glow background
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10, // Sharper edges
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  photoActionButtonSecondary: {
    // Can differentiate secondary if needed, e.g. lighter border or bg
    backgroundColor: 'rgba(122, 137, 255, 0.15)',
    borderColor: '#7A89FF',
    shadowColor: '#7A89FF',
  },
  photoActionButtonText: {
    // color will be inherited or can be set explicitly if different for primary/secondary
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    // Default to #00F0FF for primary, adjust if needed for secondary in its own style object
  },
  thumbnailList: {
    marginBottom: 16,
  },
  thumbnailContainer: {
    marginRight: 10,
    position: 'relative',
    borderWidth: 2, // Thicker border
    borderColor: '#00F0FF', // Glowey border
    borderRadius: 12, // Sharper
    overflow: 'hidden',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 6,
  },
  thumbnail: {
    width: 80,
    height: 80,
    // borderRadius: 10, // Already set by container
  },
  removeImageButton: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(10, 15, 30, 0.9)', // More opaque
    borderRadius: 12, // Match shape
    width: 24, // Slightly larger
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  removeImageIcon: {
    // XCircle already has color prop, direct styling here not usually needed unless for layout
  },
  emptyImageContainer: {
    width: Dimensions.get('window').width - 64, // Account for padding
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.05)', // Faint glow background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    paddingHorizontal: 10,
  },
  noImagesText: {
    color: '#00F0FF',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#00F0FF', // Main glow color
    paddingVertical: 18, // Larger button
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 0,
    borderWidth: 1,
    borderColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  saveButtonText: {
    color: '#0A0F1E',
    fontSize: 16,
    fontFamily: 'Inter_700Bold', // Bolder text
    letterSpacing: 1,
  },
  disabledButton: {
    backgroundColor: '#7A89FF', // Standard disabled color
    shadowOpacity: 0.2, // Reduced glow when disabled
    borderColor: '#7A89FF',
  },
  loadingText: {
    color: '#00F0FF', // Glowey loading text
    fontSize: 16,
    marginTop: 12,
    fontFamily: 'Inter_500Medium',
  },
  textInputContainer: {
    flex: 0.4,
    paddingLeft: 5,
  },
  textInput: {
    backgroundColor: 'rgba(0, 240, 255, 0.05)', // Faint glow background
    color: '#E0EFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    minHeight: 40,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)', // Subtle glow border
  },
  notesInputContainer: {
    padding: 0, // Remove padding if categoryContainer has it
  },
  notesInput: {
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    color: '#E0EFFF',
    borderRadius: 8,
    paddingHorizontal: 16, // Match category padding
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    minHeight: 100, // Increased height
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    marginTop: -1, // To cover the category container border if it has one on bottom
  },
}); 