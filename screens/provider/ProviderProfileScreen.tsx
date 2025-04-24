import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, PenTool as Tool, Clock, Settings, ChevronRight, LogOut, Star, CheckCircle, Users, DollarSign, Activity, Info } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { logout } from '@/lib/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '@/navigation/ProviderNavigator';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { NavigationProp } from '@react-navigation/native';

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
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60');
  const [bio, setBio] = useState('Dedicated Quantum Mechanic with 15 years of experience specializing in temporal distortion alignment and neural network calibration.');
  const [isEditingBio, setIsEditingBio] = useState(false);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
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

  const handleSaveBio = () => {
    // TODO: Add API call to save bio
    setIsEditingBio(false);
  }

  const handleMetricsDetailsPress = () => {
    rootNavigation.navigate('PerformanceDetails');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
            <Pressable style={styles.editImageButton} onPress={handleImagePick}>
              <Camera size={20} color="#00F0FF" />
            </Pressable>
          </View>
          <Text style={styles.name}>AAREN JOHNSON</Text>
          <Text style={styles.membershipLevel}>QUANTUM TECHNICIAN - LEVEL 5</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>JOBS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.9</Text>
              <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      fill={star <= Math.floor(4.9) || (star === Math.ceil(4.9) && (4.9 % 1) >= 0.5) ? "#FFB800" : "none"}
                      color="#FFB800"
                      style={{ marginRight: 2 }}
                    />
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>15</Text>
              <Text style={styles.statLabel}>YEARS</Text>
            </View>
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
              />
              <Pressable style={styles.saveBioButton} onPress={handleSaveBio}>
                <CheckCircle size={16} color="#0A0F1E" />
                <Text style={styles.saveBioButtonText}>SAVE BIO</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setIsEditingBio(true)}>
              <Text style={styles.bioText}>{bio}</Text>
              <Text style={styles.editBioPrompt}>Tap to edit</Text>
            </Pressable>
          )}
        </View>

        {/* Performance Metrics Section */}
        <View style={styles.metricsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>PERFORMANCE METRICS</Text>
            <Pressable onPress={handleMetricsDetailsPress} style={styles.detailsContainer}>
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
          <Pressable 
            style={styles.menuItem}
            onPress={() => rootNavigation.navigate('AccountSettings')}
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
}); 