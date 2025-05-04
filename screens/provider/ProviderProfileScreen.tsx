import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, TextInput, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, PenTool as Tool, Clock, Settings, ChevronRight, LogOut, Star, CheckCircle, Users, DollarSign, Activity, Info, Briefcase, Award } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { logout } from '@/lib/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '@/navigation/ProviderNavigator';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { NavigationProp } from '@react-navigation/native';
import { auth, firestore, storage } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserProfile } from '@/lib/profile';

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
  const stackNavigation = useNavigation<NativeStackNavigationProp<ProviderStackParamList>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
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

  const defaultProfileImageUrl = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60'; // Define default image URL

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoadingProfile(true);
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setProfileData(data);
            const currentBio = data.bio || 'No bio set yet.';
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
    setProfileImage(imageUri);

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
      Alert.alert("Success", "Bio updated successfully.");
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
      Alert.alert("Success", "Years of experience updated.");
    } catch (error) {
      console.error("Error updating years:", error);
      Alert.alert("Error", "Could not update years of experience.");
    } finally {
      setSavingYears(false);
    }
  };

  const handleViewPerformance = () => {
    Alert.alert("Navigate", "Navigate to Performance Details Screen (Not implemented yet)");
  };

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#00F0FF" style={{ marginTop: 50 }}/>
      </SafeAreaView>
    );
  }
  
  if (!profileData) {
     return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Pressable onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={24} color="#FF3D71" />
            </Pressable>
        </View>
        <View style={styles.centeredMessage}>
          <Text style={styles.errorText}>Could not load profile data.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={24} color="#FF3D71" />
          </Pressable>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profileImage || defaultProfileImageUrl }}
              style={styles.profileImage}
            />
            <Pressable style={styles.cameraButton} onPress={handleImagePick} disabled={uploadingImage}>
              {uploadingImage ? <ActivityIndicator size="small" color="#0A0F1E" /> : <Camera size={16} color="#0A0F1E" />}
            </Pressable>
          </View>
          <Text style={styles.nameText}>{`${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'Provider Name'}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Briefcase size={16} color="#7A89FF" />
              <Text style={styles.statText}>{profileData.numberOfJobsCompleted ?? 0} Jobs</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statItem}>
              <Star size={16} color="#FFC107" />
              <Text style={styles.statText}>
                 {profileData.averageRating?.toFixed(1) ?? 'N/A'} ({profileData.reviewCount ?? 0} reviews)
              </Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statItem}>
              <Award size={16} color="#00F0FF" />
              <Text style={styles.statText}>{profileData.yearsOfExperience ?? 0} Yrs Exp</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>About Me</Text>
            {!isEditingBio && (
              <TouchableOpacity onPress={() => setIsEditingBio(true)} style={styles.editButton}>
                <Tool size={18} color="#7A89FF" />
              </TouchableOpacity>
            )}
          </View>
          {isEditingBio ? (
            <View>
              <TextInput
                style={styles.bioInput}
                multiline
                value={bio}
                onChangeText={setBio}
                placeholder="Tell clients about yourself..."
                placeholderTextColor="#555E78"
                maxLength={500}
              />
              <View style={styles.bioActions}>
                <TouchableOpacity onPress={() => { setBio(originalBio); setIsEditingBio(false); }} style={[styles.bioButton, styles.cancelBioButton]}>
                  <Text style={styles.cancelBioButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveBio} disabled={savingBio} style={[styles.bioButton, styles.saveBioButton]}>
                  {savingBio ? <ActivityIndicator size="small" color="#0A0F1E"/> : <Text style={styles.saveBioButtonText}>Save Bio</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.bioText}>{bio}</Text>
          )}
        </View>
        
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Years of Experience</Text>
                 {!isEditingYears && (
                    <TouchableOpacity onPress={() => setIsEditingYears(true)} style={styles.editButton}>
                        <Tool size={18} color="#7A89FF" />
                    </TouchableOpacity>
                 )}
            </View>
            {isEditingYears ? (
                <View>
                    <TextInput
                        style={styles.yearsInput}
                        value={yearsInput}
                        onChangeText={setYearsInput}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#555E78"
                        maxLength={2}
                    />
                    <View style={styles.bioActions}>
                        <TouchableOpacity onPress={() => { setYearsInput((profileData.yearsOfExperience || 0).toString()); setIsEditingYears(false); }} style={[styles.bioButton, styles.cancelBioButton]}>
                        <Text style={styles.cancelBioButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSaveYears} disabled={savingYears} style={[styles.bioButton, styles.saveBioButton]}>
                        {savingYears ? <ActivityIndicator size="small" color="#0A0F1E"/> : <Text style={styles.saveBioButtonText}>Save Years</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <Text style={styles.bioText}>{profileData.yearsOfExperience ?? 0} years</Text>
            )}
        </View>

        <View style={styles.sectionCard}>
          <Pressable style={styles.sectionHeader} onPress={handleViewPerformance}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <ChevronRight size={18} color="#7A89FF" />
          </Pressable>
          <View style={styles.performanceGrid}>
            {profileData.performance ? (
              Object.entries(profileData.performance).map(([key, value]) => {
                const IconComponent = performanceIcons[key as keyof typeof performanceIcons] || Info;
                const displayValue = typeof value === 'number' 
                  ? (key === 'weeklyEarnings' ? `$${value.toFixed(2)}` : value.toString()) 
                  : 'N/A';
                const displayTitle = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .toUpperCase();
                    
                return (
                  <View key={key} style={styles.performanceItem}>
                    <IconComponent size={24} color="#00F0FF" />
                    <Text style={styles.performanceValue}>{displayValue}</Text>
                    <Text style={styles.performanceLabel}>{displayTitle}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noDataText}>No performance data available.</Text>
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Pressable style={styles.settingsItem} onPress={() => Alert.alert("Navigation", "Go to Account Settings")}>
            <Settings size={20} color="#7A89FF" />
            <Text style={styles.settingsText}>Account Settings</Text>
            <ChevronRight size={18} color="#7A89FF" />
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  centeredMessage: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  errorText: {
      color: '#FF3D71',
      fontSize: 16,
      textAlign: 'center',
      fontFamily: 'Inter_500Medium',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  logoutButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
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
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00F0FF',
    borderRadius: 15,
    padding: 8,
    borderWidth: 2,
    borderColor: '#0A0F1E',
  },
  nameText: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statText: {
    marginLeft: 6,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#E0EFFF',
  },
  statSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#2A3555',
  },
  sectionCard: {
    backgroundColor: '#121827',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 83, 85, 0.5)',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
  },
  editButton: {
      padding: 4,
  },
  bioText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#E0EFFF',
    lineHeight: 21,
  },
  bioInput: {
    backgroundColor: 'rgba(10, 15, 30, 0.8)',
    color: '#E0EFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    borderColor: '#2A3555',
    borderWidth: 1,
    marginBottom: 12,
  },
   yearsInput: {
        backgroundColor: 'rgba(10, 15, 30, 0.8)',
        color: '#E0EFFF',
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        borderRadius: 8,
        padding: 12,
        borderColor: '#2A3555',
        borderWidth: 1,
        marginBottom: 12,
        textAlign: 'center',
        maxWidth: 80,
        alignSelf: 'center',
    },
  bioActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
  },
  bioButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      marginLeft: 8,
      flexDirection: 'row',
      alignItems: 'center',
  },
  cancelBioButton: {
      backgroundColor: 'rgba(122, 137, 255, 0.1)',
      borderColor: '#7A89FF',
      borderWidth: 1,
  },
  cancelBioButtonText: {
      color: '#7A89FF',
      fontFamily: 'Inter_500Medium',
  },
  saveBioButton: {
      backgroundColor: '#00F0FF',
      borderColor: '#00F0FF',
      borderWidth: 1,
  },
  saveBioButtonText: {
      color: '#0A0F1E',
      fontFamily: 'Inter_600SemiBold',
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  performanceItem: {
    backgroundColor: 'rgba(42, 53, 85, 0.3)',
    width: '48%',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  performanceValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
   noDataText: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#7A89FF',
        textAlign: 'center',
        marginTop: 10,
    },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  settingsText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#E0EFFF',
  },
}); 