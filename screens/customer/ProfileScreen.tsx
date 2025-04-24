import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Car, PenTool as Tool, Clock, Shield, Settings, ChevronRight, LogOut } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { logout } from '@/lib/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [profileImage, setProfileImage] = useState('');

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
      setHasCustomImage(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Profile data (would come from API/database in a real app)
  const customerInfo = {
    name: 'JULIAN VAZQUEZ',
    initials: 'JV',
    memberSinceMonth: 'JUN',
    memberSinceYear: '2021',
    orders: 156,
    rating: 4.9
  };

  const renderProfileAvatar = () => {
    if (hasCustomImage && profileImage) {
      return <Image source={{ uri: profileImage }} style={styles.profileImage} />;
    }
    
    return (
      <LinearGradient
        colors={['#00C2FF', '#0080FF']}
        style={styles.profileImage}
      >
        <Text style={styles.profileInitials}>{customerInfo.initials}</Text>
      </LinearGradient>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {renderProfileAvatar()}
            <Pressable style={styles.editImageButton} onPress={handleImagePick}>
              <Camera size={20} color="#00F0FF" />
            </Pressable>
          </View>
          <Text style={styles.name}>{customerInfo.name}</Text>
          <Text style={styles.membershipLevel}>FIXD CUSTOMER</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{customerInfo.orders}</Text>
              <Text style={styles.statLabel}>ORDERS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{customerInfo.rating}</Text>
              <Text style={styles.statLabel}>RATING</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{customerInfo.memberSinceMonth}</Text>
              <Text style={styles.memberYear}>{customerInfo.memberSinceYear}</Text>
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
}); 