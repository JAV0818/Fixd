import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, PenTool as Tool, Clock, Shield, Settings, ChevronRight, LogOut, User } from 'lucide-react-native';
import { logout } from '@/lib/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, firestore } from '@/lib/firebase'; // Import Firebase
import { doc, getDoc, Timestamp } from 'firebase/firestore'; // Import Firestore functions

// Interface for Customer Profile Data
interface CustomerProfile {
  firstName?: string;
  lastName?: string;
  createdAt?: Timestamp; // Use Firestore Timestamp
  ordersPlaced?: number;
  // averageRating?: number; // Decide if needed
}

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profileData, setProfileData] = useState<CustomerProfile>({});
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoadingProfile(true);
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data() as CustomerProfile;
            setProfileData(data);
          } else {
            console.error("No such user document!");
            setProfileData({}); // Reset data on error
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setProfileData({});
        }
      }
      setLoadingProfile(false);
    };

    fetchProfileData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Format display data
  const firstName = profileData.firstName || '';
  const lastName = profileData.lastName || '';
  const displayName = `${firstName} ${lastName}`.trim() || 'CUSTOMER NAME';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const orders = profileData.ordersPlaced || 0;
  // const rating = profileData.averageRating?.toFixed(1) || 'N/A'; // Decide on rating display
  const memberSinceDate = profileData.createdAt?.toDate();
  const memberSinceMonth = memberSinceDate?.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() || 'N/A';
  const memberSinceYear = memberSinceDate?.getFullYear().toString() || '';

  const renderProfileAvatar = () => {
    // Simplified: Only show initials or fallback
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
    // Fallback if no initials
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {renderProfileAvatar()}
          </View>
          <Text style={styles.name}>{displayName.toUpperCase()}</Text>
          <Text style={styles.membershipLevel}>FIXD CUSTOMER</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{orders}</Text>
              <Text style={styles.statLabel}>ORDERS</Text>
            </View>
            <View style={styles.statDivider} />
            {/* <View style={styles.statItem}>
              <Text style={styles.statValue}>{rating}</Text>
              <Text style={styles.statLabel}>RATING</Text> 
            </View>
            <View style={styles.statDivider} /> */}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{memberSinceMonth}</Text>
              <Text style={styles.memberYear}>{memberSinceYear}</Text>
              <Text style={styles.statLabel}>CUSTOMER SINCE</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Pressable 
            style={styles.menuItem}
            onPress={() => navigation.navigate('ServiceSchedule')}
          >
            <Clock size={20} color="#00F0FF" />
            <Text style={styles.menuText}>Service Schedule</Text>
            <ChevronRight size={20} color="#7A89FF" />
          </Pressable>
          <Pressable 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('PrivacySettings')}
          >
            <Shield size={20} color="#00F0FF" />
            <Text style={styles.menuText}>Privacy and Settings</Text>
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
  },
  profileInitials: {
    fontSize: 42,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
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
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 4,
    textAlign: 'center',
  },
  memberYear: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 14,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    letterSpacing: 1,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2A3555',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0F1E',
  },
  placeholderAvatar: {
     backgroundColor: 'rgba(122, 137, 255, 0.1)', // Use a placeholder background
     borderColor: '#7A89FF',
  },
}); 