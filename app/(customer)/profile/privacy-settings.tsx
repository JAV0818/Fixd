import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Shield, 
  Bell, 
  MapPin, 
  Key, 
  Smartphone, 
  Eye, 
  EyeOff,
  Mail,
  Share2 as Share
} from 'lucide-react-native';

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    locationTracking: true,
    pushNotifications: true,
    emailNotifications: true,
    twoFactorAuth: false,
    shareData: true,
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSavePassword = () => {
    // Handle password change
  };

  return (
    <View style={styles.container}>
      <Text style={{ color: 'red', fontSize: 30, marginTop: 100 }}>DEBUG: RENDERED!</Text>
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <Text style={styles.title}>PRIVACY & SECURITY</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#00F0FF" />
            <Text style={styles.sectionTitle}>ACCOUNT SECURITY</Text>
          </View>

          <View style={styles.passwordSection}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passwordInput}>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter current password"
                placeholderTextColor="#7A89FF"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#7A89FF" />
                ) : (
                  <Eye size={20} color="#7A89FF" />
                )}
              </Pressable>
            </View>

            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordInput}>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter new password"
                placeholderTextColor="#7A89FF"
              />
            </View>

            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.passwordInput}>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#7A89FF"
              />
            </View>

            <Pressable style={styles.saveButton} onPress={handleSavePassword}>
              <Text style={styles.saveButtonText}>UPDATE PASSWORD</Text>
            </Pressable>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Key size={20} color="#00F0FF" />
              <View>
                <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                <Text style={styles.settingDescription}>
                  Add an extra layer of security to your account
                </Text>
              </View>
            </View>
            <Switch
              value={settings.twoFactorAuth}
              onValueChange={(value) => setSettings({ ...settings, twoFactorAuth: value })}
              trackColor={{ false: '#2A3555', true: 'rgba(0, 240, 255, 0.3)' }}
              thumbColor={settings.twoFactorAuth ? '#00F0FF' : '#7A89FF'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#00F0FF" />
            <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Smartphone size={20} color="#00F0FF" />
              <View>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive updates about your services
                </Text>
              </View>
            </View>
            <Switch
              value={settings.pushNotifications}
              onValueChange={(value) => setSettings({ ...settings, pushNotifications: value })}
              trackColor={{ false: '#2A3555', true: 'rgba(0, 240, 255, 0.3)' }}
              thumbColor={settings.pushNotifications ? '#00F0FF' : '#7A89FF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Mail size={20} color="#00F0FF" />
              <View>
                <Text style={styles.settingTitle}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive service updates via email
                </Text>
              </View>
            </View>
            <Switch
              value={settings.emailNotifications}
              onValueChange={(value) => setSettings({ ...settings, emailNotifications: value })}
              trackColor={{ false: '#2A3555', true: 'rgba(0, 240, 255, 0.3)' }}
              thumbColor={settings.emailNotifications ? '#00F0FF' : '#7A89FF'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color="#00F0FF" />
            <Text style={styles.sectionTitle}>LOCATION & DATA</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <MapPin size={20} color="#00F0FF" />
              <View>
                <Text style={styles.settingTitle}>Location Tracking</Text>
                <Text style={styles.settingDescription}>
                  Allow tracking for better service
                </Text>
              </View>
            </View>
            <Switch
              value={settings.locationTracking}
              onValueChange={(value) => setSettings({ ...settings, locationTracking: value })}
              trackColor={{ false: '#2A3555', true: 'rgba(0, 240, 255, 0.3)' }}
              thumbColor={settings.locationTracking ? '#00F0FF' : '#7A89FF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Share size={20} color="#00F0FF" />
              <View>
                <Text style={styles.settingTitle}>Share Usage Data</Text>
                <Text style={styles.settingDescription}>
                  Help us improve our services
                </Text>
              </View>
            </View>
            <Switch
              value={settings.shareData}
              onValueChange={(value) => setSettings({ ...settings, shareData: value })}
              trackColor={{ false: '#2A3555', true: 'rgba(0, 240, 255, 0.3)' }}
              thumbColor={settings.shareData ? '#00F0FF' : '#7A89FF'}
            />
          </View>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>DANGER ZONE</Text>
          <Pressable style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>DELETE ACCOUNT</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  passwordSection: {
    gap: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 8,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3555',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#00F0FF',
  },
  saveButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00F0FF',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  dangerZone: {
    padding: 16,
    gap: 16,
  },
  dangerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#FF3D71',
    letterSpacing: 2,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3D71',
  },
  deleteButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FF3D71',
    letterSpacing: 2,
  },
});