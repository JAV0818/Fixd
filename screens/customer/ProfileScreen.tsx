import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, PenTool as Tool, Clock, Shield, Settings, ChevronRight, LogOut, User, Star } from 'lucide-react-native';
import { logout } from '@/lib/auth';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { auth, firestore } from '@/lib/firebase'; // Import Firebase
import { doc, getDoc, Timestamp, collection, query, where, getCountFromServer } from 'firebase/firestore'; // Added imports for query
import StarRatingDisplay from '@/components/ui/StarRatingDisplay'; // Import the new component

// Interface for Customer Profile Data
interface CustomerProfile {
  firstName?: string;
  lastName?: string;
  createdAt?: Timestamp; // Use Firestore Timestamp
  ordersPlaced?: number;
  // averageRating?: number; // Decide if needed
}

// Insert helper to safely convert various timestamp representations to a JS Date
const toDateSafe = (value: any): Date | null => {
  if (!value) return null;
  // Firestore Timestamp (has toDate method)
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  // Firestore timestamp object with seconds field
  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  // Already a Date instance
  if (value instanceof Date) {
    return value;
  }
  // Attempt string/number conversion
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profileData, setProfileData] = useState<CustomerProfile>({});
  const [completedOrderCount, setCompletedOrderCount] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingCount, setLoadingCount] = useState(true);

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
        setLoadingProfile(false);

        // Fetch Completed Order Count
        setLoadingCount(true);
        try {
          const ordersRef = collection(firestore, 'repairOrders');
          const q = query(ordersRef, where('customerId', '==', user.uid), where('status', '==', 'Completed'));
          const snapshot = await getCountFromServer(q);
          setCompletedOrderCount(snapshot.data().count);
        } catch (countError) {
          console.error("Error fetching completed order count:", countError);
          setCompletedOrderCount(0);
        }
        setLoadingCount(false);
      } else {
        // Handle case where user is not logged in (clear data)
        setProfileData({});
        setCompletedOrderCount(0);
        setLoadingProfile(false);
        setLoadingCount(false);
      }
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
  // const orders = profileData.ordersPlaced || 0;
  // const rating = profileData.averageRating?.toFixed(1) || 'N/A'; // Decide on rating display
  // Safely derive the "member since" date parts without assuming Firestore Timestamp structure
  const memberSinceDate = toDateSafe(profileData.createdAt);
  const memberSinceMonth = memberSinceDate
    ? memberSinceDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    : 'N/A';
  const memberSinceYear = memberSinceDate ? memberSinceDate.getFullYear().toString() : '';

  const renderProfileAvatar = () => {
    // Simplified: Only show initials or fallback
    if (initials) {
      return (
        <View
          style={[styles.profileImage, { backgroundColor: '#0080FF' }]}
        >
          <Text style={styles.profileInitials}>{initials}</Text>
        </View>
      );
    }
    // Fallback if no initials
    return (
      <View style={[styles.profileImage, styles.placeholderAvatar]}>
        <User size={60} color="#7A89FF" /> 
      </View>
    );
  };

  if (loadingProfile || loadingCount) {
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
              <Text style={[styles.statValue, {marginLeft: 0}]}>{completedOrderCount}</Text>
              <Text style={styles.statLabel}>ORDERS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <StarRatingDisplay 
                rating={3} // Replace with actual averageRating when available
                starSize={16}
                showRatingNumber={true}
                ratingNumberStyle={styles.statValue}
                starColorFilled="#00F0FF"
                starColorEmpty="#4A5588"
                starContainerStyle={styles.starsContainer}
              />
              <Text style={styles.statLabel}>RATING</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {marginLeft: 0}]}>{memberSinceMonth}</Text>
              {memberSinceYear && <Text style={styles.memberYear}>{memberSinceYear}</Text>}
              <Text style={styles.statLabel}>CUSTOMER SINCE</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Pressable 
            style={styles.menuItem}
            onPress={() => navigation.navigate('ServiceSchedule' as never)}
          >
            <Clock size={20} color="#00F0FF" />
            <Text style={styles.menuText}>Service Schedule</Text>
            <ChevronRight size={20} color="#7A89FF" />
          </Pressable>
          <Pressable 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('PrivacySettings' as never)}
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
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  membershipLevel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#00F0FF',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(10, 15, 30, 0.7)', 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  statItem: {
    alignItems: 'center',
    flex: 1, 
    paddingHorizontal: 2,
  },
  statValue: {
    fontSize: 16, 
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 4,
    textAlign: 'center',
  },
  ratingValueText: {
  },
  starsContainer: { 
    marginBottom: 4, 
  },
  memberYear: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    lineHeight: 12,
    marginTop: -2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: '60%',
    alignSelf: 'center',
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
     backgroundColor: 'rgba(122, 137, 255, 0.1)',
     borderColor: '#7A89FF',
  },
}); 