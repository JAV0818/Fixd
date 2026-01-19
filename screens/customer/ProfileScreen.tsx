import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, PenTool as Tool, Clock, Shield, Settings, ChevronRight, LogOut, User, Star } from 'lucide-react-native';
import { logout } from '@/lib/auth';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { auth, firestore } from '@/lib/firebase';
import { doc, getDoc, Timestamp, collection, query, where, getCountFromServer } from 'firebase/firestore';
import StarRatingDisplay from '@/components/ui/StarRatingDisplay';
import { colors } from '@/styles/theme';

// Interface for Customer Profile Data
interface CustomerProfile {
  firstName?: string;
  lastName?: string;
  createdAt?: Timestamp; // Use Firestore Timestamp
  ordersPlaced?: number;
  averageRating?: number;
  totalRatingsCount?: number;
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
          const ordersRef = collection(firestore, 'repair-orders');
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
        <View style={[styles.profileImage, { backgroundColor: colors.primary }]}>
          <Text style={styles.profileInitials}>{initials}</Text>
        </View>
      );
    }
    // Fallback if no initials
    return (
      <View style={[styles.profileImage, styles.placeholderAvatar]}>
        <User size={48} color={colors.textTertiary} /> 
      </View>
    );
  };

  if (loadingProfile || loadingCount) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {renderProfileAvatar()}
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.membershipLevel}>Fixd Customer</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedOrderCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.starsContainer}>
              <StarRatingDisplay 
                rating={profileData?.averageRating || 0}
                starSize={14}
                showRatingNumber={false}
                starColorFilled={colors.warning}
                starColorEmpty="#D9DBE9"
              />
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{memberSinceMonth}</Text>
            {memberSinceYear && <Text style={styles.memberYear}>{memberSinceYear}</Text>}
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <Pressable 
            style={styles.menuItem}
            onPress={() => navigation.navigate('ServiceSchedule' as never)}
          >
            <View style={styles.menuIconContainer}>
              <Clock size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuText}>Service Schedule</Text>
            <ChevronRight size={20} color={colors.textTertiary} />
          </Pressable>
          
          <Pressable 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('PrivacySettings' as never)}
          >
            <View style={styles.menuIconContainer}>
              <Shield size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuText}>Privacy and Settings</Text>
            <ChevronRight size={20} color={colors.textTertiary} />
          </Pressable>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    lineHeight: 40,
  },
  profileCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  membershipLevel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textTertiary,
  },
  statsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
    marginBottom: 4,
  },
  starsContainer: { 
    marginTop: 4,
  },
  memberYear: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
    marginTop: -4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.textTertiary,
  },
  statDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
    backgroundColor: colors.border,
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    backgroundColor: colors.dangerLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.danger,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  placeholderAvatar: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
}); 