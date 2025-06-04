import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, TextInput, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, PenTool as Tool, Clock, Settings, ChevronRight, LogOut, Star, CheckCircle, Users, DollarSign, Activity, Info, Briefcase, Award, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { logout } from '@/lib/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/navigation/ProviderTabNavigator';
import { auth, firestore, storage } from '@/lib/firebase';
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LinearGradient } from 'expo-linear-gradient';

// Helper function to safely convert Firestore Timestamps or other date formats
const toDateSafe = (timestamp: any): Date => {
  if (!timestamp) return new Date(); // Or throw an error, or return a specific default
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate(); // Firestore Timestamp
  }
  if (timestamp.seconds && typeof timestamp.nanoseconds === 'number') {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000); // Firestore Timestamp (alternative structure)
  }
  if (timestamp instanceof Date) {
    return timestamp; // Already a Date object
  }
  // Attempt to parse if it's a string or number
  const parsedDate = new Date(timestamp);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  return new Date(); // Fallback for unrecognized formats
};

interface ProviderProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePictureUrl?: string;
  yearsOfExperience?: number;
  numberOfJobsCompleted?: number;
  averageRating?: number;
  createdAt?: Timestamp;
  numberOfAcceptedJobs?: number;
  onTimeArrivals?: number;
  totalTrackedArrivals?: number;
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

// Performance icons mapping (can be extended)
const performanceIcons = {
  weeklyEarnings: DollarSign,
  numberOfServices: Tool,
  clientRatingIndex: Users, // Or Star?
  totalHours: Clock,
};

export default function ProviderProfileScreen() {
  const stackNavigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [profileData, setProfileData] = useState<ProviderProfileData | null>(null);
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

  const defaultProfileImageUrl = 'https://via.placeholder.com/150/2A3555/00F0FF?text=FixD';

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoadingProfile(true);
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data() as ProviderProfileData;
            setProfileData(data);
            const currentBio = data.bio || 'Tap to add a bio.';
            setBio(currentBio);
            setOriginalBio(currentBio);
            setProfileImage(data.profilePictureUrl || defaultProfileImageUrl);
            setYearsInput((data.yearsOfExperience || 0).toString());

          } else {
            console.error("No such user document!");
            setProfileData(null);
            setBio('Could not load profile.');
            setOriginalBio('Could not load profile.');
            setProfileImage(defaultProfileImageUrl);
            setYearsInput('0');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setProfileData(null);
          setBio('Error loading profile.');
          setOriginalBio('Error loading profile.');
          setProfileImage(defaultProfileImageUrl);
          setYearsInput('0');
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleImagePick = async () => {
    setUploadingImage(true);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "Permission to access camera roll is required!");
      setUploadingImage(false);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) {
      setUploadingImage(false);
      return;
    }

    const imageUri = result.assets[0].uri;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in.");
      setUploadingImage(false);
      return;
    }

    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profileImages/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        profilePictureUrl: downloadURL
      });

      setProfileImage(downloadURL);
      setProfileData(prev => prev ? { ...prev, profilePictureUrl: downloadURL } : null);
      Alert.alert("Success", "Profile image updated.");

    } catch (error) {
      console.error("Error uploading image: ", error);
      Alert.alert("Upload Error", "Failed to upload profile image.");
      setProfileImage(profileData?.profilePictureUrl || defaultProfileImageUrl);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSaveBio = async () => {
    if (bio === originalBio) {
      setIsEditingBio(false);
      return;
    }
    setSavingBio(true);
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in.");
      setSavingBio(false);
      return;
    }
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userDocRef, { bio: bio });
      setOriginalBio(bio);
      setProfileData(prev => prev ? { ...prev, bio: bio } : null);
      setIsEditingBio(false);
    } catch (error) {
      console.error("Error updating bio:", error);
      Alert.alert("Error", "Could not update bio.");
    } finally {
      setSavingBio(false);
    }
  };

  const handleSaveYears = async () => {
    const currentYearsStr = (profileData?.yearsOfExperience || 0).toString();
    if (yearsInput === currentYearsStr) {
      setIsEditingYears(false);
      return;
    }
    
    const yearsValue = parseInt(yearsInput, 10);
    if (isNaN(yearsValue) || yearsValue < 0) {
      Alert.alert("Invalid Input", "Please enter a valid number (0 or more).");
      return;
    }

    setSavingYears(true);
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in.");
      setSavingYears(false);
      return;
    }
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userDocRef, {
        yearsOfExperience: yearsValue
      });
      setProfileData(prev => prev ? { ...prev, yearsOfExperience: yearsValue } : null);
      setIsEditingYears(false);
    } catch (error) {
      console.error("Error updating years:", error);
      Alert.alert("Error", "Could not update years of experience.");
    } finally {
      setSavingYears(false);
    }
  };

  const firstName = profileData?.firstName || '';
  const lastName = profileData?.lastName || '';
  const displayName = `${firstName} ${lastName}`.trim() || 'MECHANIC NAME';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const membershipDate = profileData?.createdAt ? `Member since ${toDateSafe(profileData.createdAt).getFullYear()}` : 'Member since N/A';
  const avgRating = profileData?.averageRating ? profileData.averageRating.toFixed(1) : 'N/A';
  const jobsCompleted = profileData?.numberOfJobsCompleted?.toString() ?? '0';
  const experienceYears = profileData?.yearsOfExperience?.toString() ?? '0';

  const renderProfileAvatar = () => {
    if (uploadingImage) {
      return (
        <View style={[styles.profileImage, styles.placeholderAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#00F0FF" />
        </View>
      );
    }
    if (profileImage && profileImage !== defaultProfileImageUrl) {
      return <Image source={{ uri: profileImage }} style={styles.profileImage} />;
    }
    if (initials) {
      return (
        <LinearGradient
          colors={['#00C2FF', '#0080FF']}
          style={styles.profileImage}
        >
          <Text style={styles.profileInitials}>{initials}</Text>
        </LinearGradient>
      );
    }
    return (
      <View style={[styles.profileImage, styles.placeholderAvatar]}>
        <User size={60} color="#7A89FF" />
      </View>
    );
  };

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F0FF" />
      </SafeAreaView>
    );
  }
  
  if (!profileData) {
     return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Could not load profile data.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={handleImagePick} style={styles.profileImageContainer}>
            {renderProfileAvatar()}
            <View style={styles.cameraIconContainer}>
              <Camera size={18} color="#0A0F1E" />
            </View>
          </Pressable>
          <Text style={styles.name}>{displayName.toUpperCase()}</Text>
          <Text style={styles.membershipLevel}>{membershipDate}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statValueRow}>
                <Star size={16} color="#00F0FF" />
                <Text style={styles.statValue}>{avgRating}</Text>
              </View>
              <Text style={styles.statLabel}>OVERALL RATING</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statValueRow}>
                <Briefcase size={16} color="#00F0FF" />
                <Text style={styles.statValue}>{jobsCompleted}</Text>
              </View>
              <Text style={styles.statLabel}>JOBS COMPLETED</Text>
            </View>
          </View>
          
          <View style={[styles.statsContainer, { marginTop: 10 }]}>
            <View style={styles.statItem}>
              <View style={styles.statValueRow}>
                <Award size={16} color="#00F0FF" />
                <Text style={styles.statValue}>{experienceYears}</Text>
              </View>
              <Text style={styles.statLabel}>YEARS EXP</Text>
            </View>
          </View>
        </View>

        <View style={styles.bioSection}>
          <View style={styles.bioHeader}>
            <Text style={styles.sectionTitle}>ABOUT ME</Text>
            {!isEditingBio ? (
              <Pressable onPress={() => setIsEditingBio(true)} style={styles.editButton}>
                <Tool size={16} color="#7A89FF" />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            ) : (
              <Pressable onPress={handleSaveBio} style={styles.editButton} disabled={savingBio}>
                {savingBio ? <ActivityIndicator size="small" color="#00F0FF"/> : <CheckCircle size={18} color="#00F0FF" />}
                <Text style={[styles.editButtonText, {color: '#00F0FF'}]}>{savingBio ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            )}
          </View>
          {isEditingBio ? (
            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Tell us about your expertise..."
              placeholderTextColor="#6E7191"
              maxLength={250}
            />
          ) : (
            <Text style={styles.bioText}>{bio || 'Tap to add a bio.'}</Text>
          )}
        </View>
        
        <View style={styles.experienceSection}>
           <View style={styles.bioHeader}>
            <Text style={styles.sectionTitle}>YEARS OF EXPERIENCE</Text>
            {!isEditingYears ? (
              <Pressable onPress={() => setIsEditingYears(true)} style={styles.editButton}>
                <Tool size={16} color="#7A89FF" />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            ) : (
              <Pressable onPress={handleSaveYears} style={styles.editButton} disabled={savingYears}>
                {savingYears ? <ActivityIndicator size="small" color="#00F0FF"/> : <CheckCircle size={18} color="#00F0FF" />}
                <Text style={[styles.editButtonText, {color: '#00F0FF'}]}>{savingYears ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            )}
          </View>
          {isEditingYears ? (
             <TextInput
              style={styles.yearsInput}
              value={yearsInput}
              onChangeText={setYearsInput}
              keyboardType="number-pad"
              placeholder="e.g., 5"
              placeholderTextColor="#6E7191"
            />
          ) : (
            <Text style={styles.bioText}>{experienceYears} Years</Text>
          )}
        </View>

        <View style={styles.menuSection}>
          <Pressable 
            style={styles.menuItem}
            onPress={() => stackNavigation.navigate('PerformanceDetails')}
          >
            <Award size={20} color="#00F0FF" />
            <Text style={styles.menuText}>Performance Details</Text>
            <ChevronRight size={20} color="#7A89FF" />
          </Pressable>
          <Pressable 
            style={styles.menuItem} 
            onPress={() => stackNavigation.navigate('AccountSettings')}
          >
            <Settings size={20} color="#00F0FF" />
            <Text style={styles.menuText}>Account Settings</Text>
            <ChevronRight size={20} color="#7A89FF" />
          </Pressable>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0F1E',
    alignItems: 'center',
    justifyContent: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A2138',
  },
  profileInitials: {
    fontSize: 42,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  placeholderAvatar: { 
    // Intentionally empty, base styles are in profileImage
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00F0FF',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0A0F1E',
  },
  name: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 4,
    letterSpacing: 1.5,
  },
  membershipLevel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    textAlign: 'center',
    marginLeft: 4,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2A3555',
    marginVertical: 4,
  },
  bioSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  experienceSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(122, 137, 255, 0.15)',
  },
  editButtonText: {
    color: '#7A89FF',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginLeft: 6,
  },
  bioInput: {
    backgroundColor: '#121827',
    borderWidth: 1,
    borderColor: '#2A3555',
    borderRadius: 8,
    padding: 12,
    color: '#E0EFFF',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bioText: {
    color: '#D0DFFF',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  yearsInput: {
    backgroundColor: '#121827',
    borderWidth: 1,
    borderColor: '#2A3555',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#E0EFFF',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    width: 100,
  },
  menuSection: {
    padding: 16,
    gap: 8,
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
  errorText: {
    color: '#FF3D71',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    padding: 20,
  },
}); 