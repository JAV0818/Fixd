import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, TextInput, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, PenTool as Tool, Clock, Settings, ChevronRight, LogOut, Star, CheckCircle, Users, DollarSign, Activity, Info } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { logout } from '@/lib/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '@/navigation/ProviderNavigator';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { NavigationProp } from '@react-navigation/native';
import { auth, firestore, storage } from '@/lib/firebase'; // Import auth, firestore, and storage
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // Import firestore functions
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import storage functions

// Define an interface for the user profile data
interface ProviderProfile {
  firstName?: string;
  lastName?: string;
  level?: number;
  rating?: number;
  jobsCompleted?: number;
  yearsExperience?: number;
  bio?: string;
  profileImageUrl?: string;
}

// Performance metrics data
const performanceMetrics = [
  {
    title: 'WEEKLY EARNINGS',
    value: '$1,250',
    change: '+15%',
    icon: DollarSign,
    color: '#00F0FF',
  },
  {
    title: 'SERVICES',
    value: '24',
    change: '+8%',
    icon: Tool,
    color: '#7A89FF',
  },
  {
    title: 'CLIENT INDEX',
    value: '18',
    change: '+12%',
    icon: Users,
    color: '#FF3D71',
  },
  {
    title: 'TOTAL HOURS',
    value: '156',
    change: '+5%',
    icon: Clock,
    color: '#00F0FF',
  },
];

export default function ProviderProfileScreen() {
  const stackNavigation = useNavigation<NativeStackNavigationProp<ProviderStackParamList>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [profileData, setProfileData] = useState<ProviderProfile>({});
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [originalBio, setOriginalBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingYears, setIsEditingYears] = useState(false);
  const [yearsInput, setYearsInput] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingBio, setSavingBio] = useState(false);
  const [savingYears, setSavingYears] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoadingProfile(true);
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data() as ProviderProfile;
            setProfileData(data);
            setBio(data.bio || 'No bio set yet.');
            setOriginalBio(data.bio || 'No bio set yet.');
            setProfileImage(data.profileImageUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60'); // Default image
            setYearsInput((data.yearsExperience || 0).toString()); // Initialize yearsInput
          } else {
            console.error("No such user document!");
            setBio('Could not load profile.');
            setOriginalBio('Could not load profile.');
            setProfileImage('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60'); // Default image
            setYearsInput('0');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setBio('Error loading profile.');
          setOriginalBio('Error loading profile.');
          setProfileImage('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60'); // Default image
          setYearsInput('0');
        }
      }
      setLoadingProfile(false);
    };

    fetchProfileData();
  }, []);

  const handleImagePick = async () => {
    setUploadingImage(true);
    // Ask for permission (might be needed on standalone builds)
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "Permission to access camera roll is required!");
      setUploadingImage(false);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7, // Lower quality slightly for faster uploads
    });

    if (result.canceled) {
      setUploadingImage(false);
      return;
    }

    const imageUri = result.assets[0].uri;
    setProfileImage(imageUri); // Show local image immediately

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to upload images.");
      setUploadingImage(false);
      return;
    }

    try {
      // Convert URI to Blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Create a storage reference
      const storageRef = ref(storage, `profileImages/${user.uid}.jpg`);

      // Upload the file
      await uploadBytes(storageRef, blob);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        profileImageUrl: downloadURL
      });

      // Update state with the final URL (optional, as fetchProfileData might re-run)
      setProfileImage(downloadURL); 
      Alert.alert("Success", "Profile image updated.");

    } catch (error) {
      console.error("Error uploading image: ", error);
      Alert.alert("Upload Error", "Failed to upload profile image.");
      // Optionally revert local state if upload fails
      // setProfileImage(profileData.profileImageUrl || 'DEFAULT_URL');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // AppNavigator handles redirection based on auth state
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSaveBio = async () => {
    if (bio === originalBio) {
      setIsEditingBio(false); // No changes, just close edit mode
      return;
    }

    setSavingBio(true);
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to save changes.");
      setSavingBio(false);
      return;
    }

    const userDocRef = doc(firestore, 'users', user.uid);

    try {
      await updateDoc(userDocRef, {
        bio: bio // Update the bio field
      });
      setOriginalBio(bio); // Update original bio after successful save
      setIsEditingBio(false);
      Alert.alert("Success", "Bio updated successfully.");
    } catch (error) {
      console.error("Error updating bio:", error);
      Alert.alert("Error", "Could not update bio. Please try again.");
    } finally {
      setSavingBio(false);
    }
  };

  const handleSaveYears = async () => {
    const currentYears = (profileData.yearsExperience || 0).toString();
    if (yearsInput === currentYears) {
      setIsEditingYears(false);
      return;
    }
    
    const yearsValue = parseInt(yearsInput, 10);
    if (isNaN(yearsValue) || yearsValue < 0) {
      Alert.alert("Invalid Input", "Please enter a valid number for years of experience.");
      return;
    }

    setSavingYears(true);
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to save changes.");
      setSavingYears(false);
      return;
    }

    const userDocRef = doc(firestore, 'users', user.uid);

    try {
      await updateDoc(userDocRef, {
        yearsExperience: yearsValue
      });
      setProfileData(prevData => ({ ...prevData, yearsExperience: yearsValue })); // Update local state
      setIsEditingYears(false);
      Alert.alert("Success", "Years of experience updated.");
    } catch (error) {
      console.error("Error updating years:", error);
      Alert.alert("Error", "Could not update years of experience.");
    } finally {
      setSavingYears(false);
    }
  };

  const handleViewPerformance = () => {
    stackNavigation.navigate('PerformanceDetails');
  };

  // Show loading indicator while fetching profile
  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F0FF" />
      </SafeAreaView>
    );
  }

  // Format display name
  const displayName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'PROVIDER NAME';
  const level = profileData.level || 'X';
  const rating = profileData.rating?.toFixed(1) || 'N/A';
  const jobs = profileData.jobsCompleted || 0;
  const ratingValue = profileData.rating || 0;
  const displayYears = profileData.yearsExperience || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {uploadingImage && (
              <View style={styles.imageOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
            {profileImage && <Image source={{ uri: profileImage }} style={styles.profileImage} />}
            <Pressable 
              style={[styles.editImageButton, uploadingImage && styles.buttonDisabled]}
              onPress={handleImagePick}
              disabled={uploadingImage}
            >
              <Camera size={20} color="#00F0FF" />
            </Pressable>
          </View>
          <Text style={styles.name}>{displayName.toUpperCase()}</Text>
          <Text style={styles.membershipLevel}>{`QUANTUM TECHNICIAN - LEVEL ${level}`}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{jobs}</Text>
              <Text style={styles.statLabel}>JOBS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rating}</Text>
              <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      fill={star <= Math.floor(ratingValue) || (star === Math.ceil(ratingValue) && (ratingValue % 1) >= 0.5) ? "#FFB800" : "none"}
                      color="#FFB800"
                      style={{ marginRight: 2 }}
                    />
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.statDivider} />
            <Pressable 
              style={styles.statItem}
              onPress={() => { 
                  if (!isEditingYears) {
                    setYearsInput((profileData.yearsExperience || 0).toString()); // Reset input on edit start
                    setIsEditingYears(true); 
                  }
              }}
              disabled={isEditingYears || savingYears}
            >
              {isEditingYears ? (
                <View style={styles.editStatContainer}>
                  <TextInput
                    style={styles.statInput}
                    value={yearsInput}
                    onChangeText={setYearsInput}
                    keyboardType="numeric"
                    autoFocus
                    maxLength={2} // Limit years input
                    editable={!savingYears}
                  />
                  <Pressable 
                    style={[styles.saveStatButton, savingYears && styles.buttonDisabled]}
                    onPress={handleSaveYears}
                    disabled={savingYears}
                  >
                    {savingYears ? (
                      <ActivityIndicator size="small" color="#00F0FF"/>
                    ) : (
                      <CheckCircle size={18} color="#00F0FF" />
                    )}
                  </Pressable>
                </View>
              ) : (
                <>
                  <Text style={styles.statValue}>{displayYears}</Text>
                  <Text style={styles.statLabel}>YEARS</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>BIO</Text>
          {isEditingBio ? (
            <View>
              <TextInput
                style={styles.bioInput}
                value={bio}
                onChangeText={setBio}
                multiline
                autoFocus
                editable={!savingBio} // Disable input while saving
              />
              <Pressable 
                style={[styles.saveBioButton, savingBio && styles.buttonDisabled]} 
                onPress={handleSaveBio} 
                disabled={savingBio}
              >
                {savingBio ? (
                  <ActivityIndicator size="small" color="#0A0F1E" />
                ) : (
                  <CheckCircle size={16} color="#0A0F1E" />
                )}
                <Text style={styles.saveBioButtonText}>SAVE BIO</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setIsEditingBio(true)} disabled={savingBio}>
              <Text style={styles.bioText}>{bio}</Text>
              <Text style={styles.editBioPrompt}>Tap to edit</Text>
            </Pressable>
          )}
        </View>

        {/* Performance Metrics Section */}
        <View style={styles.metricsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>PERFORMANCE METRICS</Text>
            <Pressable onPress={handleViewPerformance} style={styles.detailsContainer}>
              <Text style={styles.detailsText}>Details</Text>
              <ChevronRight size={16} color="#00F0FF" />
            </Pressable>
          </View>
          <View style={styles.metricsContainer}>
            <View style={styles.metricsGrid}>
              {performanceMetrics.map((metric, index) => (
                <View key={index} style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <metric.icon size={20} color={metric.color} />
                    <Text style={styles.metricTitle}>{metric.title}</Text>
                  </View>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={[
                    styles.metricChange,
                    { color: metric.change.includes('+') ? '#00F0FF' : '#FF3D71' }
                  ]}>
                    {metric.change} this cycle
                  </Text>
                  <View style={[styles.metricLine, { backgroundColor: metric.color }]} />
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => stackNavigation.navigate('AccountSettings')}
          >
            <Settings size={20} color="#7A89FF" />
            <Text style={styles.menuText}>Account Settings</Text>
            <ChevronRight size={20} color="#7A89FF" />
          </TouchableOpacity>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FF3D71" />
          <Text style={styles.logoutText}>LOGOUT</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#00F0FF',
  },
  editImageButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00F0FF',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 4,
    letterSpacing: 2,
  },
  membershipLevel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    letterSpacing: 2,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    letterSpacing: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginRight: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2A3555',
  },
  bioSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 12,
    letterSpacing: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  detailsText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginRight: 4,
  },
  bioText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  editBioPrompt: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  bioInput: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    lineHeight: 20,
    height: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  saveBioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00F0FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-end',
    gap: 6,
  },
  saveBioButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#0A0F1E',
    letterSpacing: 1,
  },
  // Performance metrics styles
  metricsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricsContainer: {
    backgroundColor: 'rgba(10, 15, 30, 0.8)',
    borderRadius: 12,
    marginTop: 16,
    paddingBottom: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    zIndex: 1,
    borderWidth: 0,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 0,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'rgba(26, 33, 56, 1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  metricTitle: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    letterSpacing: 0.5,
    flexShrink: 1,
    lineHeight: 12,
    maxWidth: '90%',
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  metricLine: {
    height: 2,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  menuSection: {
    padding: 16,
    gap: 8,
    marginTop: 8, // Add margin before this section
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#00F0FF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3D71',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FF3D71',
    letterSpacing: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0F1E',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60, // Match image border radius
    zIndex: 1, // Ensure overlay is on top
  },
  editStatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', // Ensure it takes full width within the stat item
  },
  statInput: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#00F0FF',
    paddingBottom: 0,
    marginRight: 8,
    minWidth: 30, // Give some base width
    textAlign: 'center',
  },
  saveStatButton: {
    padding: 4, 
  },
}); 