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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, Camera, XCircle, Image as ImageIcon, CameraIcon, ChevronDown, ChevronUp } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { auth, firestore, storage } from '@/lib/firebase'; // Assuming storage is exported from firebase config
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius, typography } from '@/styles/theme';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';

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
      title: 'UNDER VEHICLE CHECKS',
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

type Props = NativeStackScreenProps<RootStackParamList, 'InspectionChecklist'>;

export default function InspectionChecklistScreen({ navigation, route }: Props) {
  const { orderId, readOnly = false } = route.params;
  const insets = useSafeAreaInsets();
  const [ratings, setRatings] = useState<Ratings>({});
  const [textInputs, setTextInputs] = useState<TextInputs>({}); // Added
  const [selectedImages, setSelectedImages] = useState<ImageAsset[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [overallSummaryNotes, setOverallSummaryNotes] = useState(""); // Added for overall notes
  
  // State to track which sections are expanded (default: all collapsed)
  // Initialize with all category titles from inspectionCategories
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    inspectionCategories.forEach(category => {
      initial[category.title] = false;
    });
    initial['Overall Summary Notes'] = false;
    initial['Photos'] = false;
    return initial;
  });

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const reportRef = doc(firestore, 'repair-orders', orderId, 'inspectionReport', 'initial');
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

    const reportRef = doc(firestore, 'repair-orders', orderId, 'inspectionReport', 'initial');
    
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
    const getButtonColor = (color: string) => {
      switch (color) {
        case 'green': return colors.success;
        case 'yellow': return colors.warning;
        case 'red': return colors.danger;
        default: return colors.border;
      }
    };
    return (
      <View style={styles.ratingButtonsContainer}>
        {(['green', 'yellow', 'red'] as const).map((color) => (
          <Pressable
            key={color}
            style={[
              styles.circleButton,
              { backgroundColor: getButtonColor(color) },
              currentRating === color && styles.selectedCircle,
            ]}
            onPress={() => !readOnly && handleRatingChange(itemKey, color)}
            disabled={readOnly}
          />
        ))}
      </View>
    );
  };

  // Added: Render TextInput for specific items
  const renderTextInput = (item: InspectionItem) => {
    return (
      <View style={styles.textInputContainer}>
        <ThemedTextInput
          placeholder="Enter details..."
          value={textInputs[item.key] || ''}
          onChangeText={(text) => !readOnly && handleTextInputChange(item.key, text)}
          multiline
          style={styles.textInput}
          editable={!readOnly}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {paddingTop: insets.top, justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Inspection Form...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingTop: spacing.md }]}>
        <BackButton />
        <Text style={styles.headerTitle}>Vehicle Inspection Report</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {inspectionCategories.map((category) => {
          const isExpanded = expandedSections[category.title];
          return (
            <View key={category.title} style={styles.categoryContainer}>
              <Pressable 
                style={styles.categoryHeader}
                onPress={() => toggleSection(category.title)}
              >
                <Text style={styles.categoryTitle}>{category.title}</Text>
                {isExpanded ? (
                  <ChevronUp size={20} color={colors.primary} />
                ) : (
                  <ChevronDown size={20} color={colors.textTertiary} />
                )}
              </Pressable>
              {isExpanded && (
                <>
                  {category.items.map((item) => (
                    <View key={item.key} style={styles.itemRow}>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                      {item.inputType === 'text' ? renderTextInput(item) : renderRatingButtons(item.key)}
                    </View>
                  ))}
                </>
              )}
            </View>
          );
        })}

        <View style={styles.categoryContainer}>
            <Pressable 
              style={styles.categoryHeader}
              onPress={() => toggleSection('Overall Summary Notes')}
            >
              <Text style={styles.categoryTitle}>Overall Summary Notes</Text>
              {expandedSections['Overall Summary Notes'] ? (
                <ChevronUp size={20} color={colors.primary} />
              ) : (
                <ChevronDown size={20} color={colors.textTertiary} />
              )}
            </Pressable>
            {expandedSections['Overall Summary Notes'] && (
              <View style={styles.notesInputContainer}>
                  <ThemedTextInput
                      placeholder="Enter overall summary notes for the inspection..."
                      value={overallSummaryNotes}
                      onChangeText={(text) => !readOnly && setOverallSummaryNotes(text)}
                      multiline
                      numberOfLines={4}
                      style={styles.notesInput}
                      editable={!readOnly}
                  />
              </View>
            )}
        </View>

        <View style={styles.categoryContainer}>
            <Pressable 
              style={styles.categoryHeader}
              onPress={() => toggleSection('Photos')}
            >
              <Text style={styles.categoryTitle}>Photos</Text>
              {expandedSections['Photos'] ? (
                <ChevronUp size={20} color={colors.primary} />
              ) : (
                <ChevronDown size={20} color={colors.textTertiary} />
              )}
            </Pressable>
          
          {expandedSections['Photos'] && (
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
                  {(item.type === 'new' || item.type === 'uploaded') && !readOnly && (
                    <TouchableOpacity 
                        style={styles.removeImageButton} 
                        onPress={() => item.type === 'new' ? removeSelectedImage(item.uri) : removeUploadedImage(item.uri)}
                    >
                        <XCircle size={22} color={colors.danger} style={styles.removeImageIcon} />
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
              contentContainerStyle={styles.thumbnailListContent}
            />
            {/* Only show photo action buttons if not in read-only mode */}
            {!readOnly && (
              <View style={styles.photoActionButtonsContainer}>
                  <ThemedButton
                    variant="outlined"
                    onPress={pickImageFromLibrary}
                    icon="image-outline"
                    style={styles.photoActionButton}
                  >
                    Add From Library
                  </ThemedButton>
                  <ThemedButton
                    variant="outlined"
                    onPress={takePhotoWithCamera}
                    icon="camera-outline"
                    style={styles.photoActionButton}
                  >
                    Take Photo
                  </ThemedButton>
              </View>
            )}
            </View>
          )}
        </View>

        {/* Only show save button if not in read-only mode */}
        {!readOnly && (
          <ThemedButton
            variant="primary"
            onPress={handleSaveInspection}
            disabled={saving}
            loading={saving}
            icon="check"
            style={styles.saveButton}
          >
            Save Inspection
          </ThemedButton>
        )}
        
        {/* Show read-only message if viewing completed order */}
        {readOnly && (
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyText}>
              This inspection report is read-only. The order has been completed.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 18,
    color: colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  categoryContainer: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryTitle: {
    ...typography.title,
    fontSize: 14,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLabel: {
    flex: 0.6,
    ...typography.body,
    color: colors.textPrimary,
    marginRight: spacing.md,
  },
  ratingButtonsContainer: {
    flex: 0.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  circleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: spacing.xs,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCircle: {
    borderColor: colors.primary,
    borderWidth: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  imageUploadContent: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  photoActionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  photoActionButton: {
    flex: 1,
  },
  thumbnailList: {
    marginBottom: spacing.md,
  },
  thumbnailListContent: {
    paddingVertical: spacing.sm,
  },
  thumbnailContainer: {
    marginRight: spacing.md,
    position: 'relative',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: 80,
    height: 80,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  removeImageIcon: {
    // XCircle already has color prop, direct styling here not usually needed unless for layout
  },
  emptyImageContainer: {
    width: Dimensions.get('window').width - (spacing.lg * 6), // Account for container padding + card padding
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
  },
  noImagesText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  saveButton: {
    marginTop: spacing.xl,
    marginHorizontal: 0,
  },
  loadingText: {
    ...typography.body,
    color: colors.primary,
    marginTop: spacing.md,
  },
  textInputContainer: {
    flex: 0.4,
    paddingLeft: spacing.xs,
  },
  textInput: {
    minHeight: 40,
  },
  notesInputContainer: {
    padding: spacing.lg,
  },
  notesInput: {
    minHeight: 100,
  },
  disabledButton: {
    opacity: 0.5,
  },
  readOnlyContainer: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readOnlyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  completedMessageContainer: {
    padding: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  completedMessageText: {
    ...typography.caption,
    color: colors.warning,
    textAlign: 'center',
  },
}); 