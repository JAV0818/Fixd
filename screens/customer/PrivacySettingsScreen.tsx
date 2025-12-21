import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, TextInput, ActivityIndicator, Alert } from 'react-native';
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
  Share2 as Share,
  UserMinus,
  ChevronRight
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { auth, firestore } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword as firebaseUpdatePassword, 
  deleteUser as firebaseDeleteUser 
} from 'firebase/auth';
import { colors } from '@/styles/theme';

// START ADDED HELPER COMPONENT DEFINITIONS
interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode; // Optional icon
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon }) => (
  <View style={styles.sectionHeaderContainer}>
    {icon}
    <Text style={styles.sectionHeaderTitle}>{title}</Text>
  </View>
);

interface SwitchRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isSaving?: boolean;
}

const SwitchRow: React.FC<SwitchRowProps> = ({ icon, label, description, value, onValueChange, isSaving }) => (
  <Pressable style={styles.settingRow} onPress={() => onValueChange(!value)} disabled={isSaving}>
    <View style={styles.settingContent}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
    </View>
    <View style={styles.switchContainer}>
      {isSaving ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={value ? colors.primary : colors.textLight}
          ios_backgroundColor={colors.border}
        />
      )}
    </View>
  </Pressable>
);
// END ADDED HELPER COMPONENT DEFINITIONS

interface UserSettings {
  locationTrackingEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  twoFactorAuthEnabled?: boolean; // Simplified for now
  shareUsageDataEnabled?: boolean;
}

// Note: Renamed component slightly to avoid conflict if imported alongside ProfileScreen
export default function PrivacySettingsScreen() { 
  // const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isSavingSetting, setIsSavingSetting] = useState<Record<string, boolean>>({}); // To track saving state for each setting
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setSettings({
              locationTrackingEnabled: data.locationTrackingEnabled ?? true,
              pushNotificationsEnabled: data.pushNotificationsEnabled ?? true,
              emailNotificationsEnabled: data.emailNotificationsEnabled ?? true,
              twoFactorAuthEnabled: data.twoFactorAuthEnabled ?? false,
              shareUsageDataEnabled: data.shareUsageDataEnabled ?? true,
            });
          } else {
            // User document doesn't exist, or settings are not there. Use defaults.
            setSettings({
              locationTrackingEnabled: true,
              pushNotificationsEnabled: true,
              emailNotificationsEnabled: true,
              twoFactorAuthEnabled: false,
              shareUsageDataEnabled: true,
            });
          }
        } catch (error) {
          console.error("Error fetching user settings:", error);
          Alert.alert("Error", "Could not load your settings. Using defaults.");
          // Fallback to defaults on error
          setSettings({
              locationTrackingEnabled: true,
              pushNotificationsEnabled: true,
              emailNotificationsEnabled: true,
              twoFactorAuthEnabled: false,
              shareUsageDataEnabled: true,
            });
        }
      }
      setLoadingSettings(false);
    };
    fetchSettings();
  }, []);

  const handleUpdateSetting = async (settingName: keyof UserSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [settingName]: value }));
    setIsSavingSetting(prev => ({ ...prev, [settingName]: true }));

    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(firestore, 'users', user.uid);
      try {
        // Using setDoc with merge: true to create/update fields without overwriting the whole doc
        await setDoc(userDocRef, { [settingName]: value }, { merge: true });
      } catch (error) {
        console.error(`Error updating ${settingName}:`, error);
        Alert.alert("Save Error", `Could not save ${settingName.replace("Enabled", "")} preference.`);
        // Revert UI on error
        setSettings(prev => ({ ...prev, [settingName]: !value })); 
      }
    }
    setIsSavingSetting(prev => ({ ...prev, [settingName]: false }));
  };

  const reauthenticate = async (password: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert("Error", "User not found or email missing.");
      return false;
    }
    const credential = EmailAuthProvider.credential(user.email, password);
    try {
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error: any) {
      console.error("Reauthentication failed:", error);
      Alert.alert("Authentication Failed", error.message || "Could not verify your current password. Please try again.");
      return false;
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword) {
      Alert.alert("Missing Field", "Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
        Alert.alert("Invalid New Password", "New password must be at least 6 characters long.");
        return;
    }
    if (newPassword !== confirmPassword) {
        Alert.alert("Password Mismatch", "New passwords do not match.");
        return;
    }

    setIsUpdatingPassword(true);
    const reauthSuccess = await reauthenticate(currentPassword);
    if (!reauthSuccess) {
      setIsUpdatingPassword(false);
      return;
    }

    const user = auth.currentUser;
    if (user) {
      try {
        await firebaseUpdatePassword(user, newPassword);
        Alert.alert("Success", "Your password has been updated successfully.");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (error: any) {
        console.error("Password update failed:", error);
        Alert.alert("Password Update Error", error.message || "Could not update your password. Please try again.");
      }
    }
    setIsUpdatingPassword(false);
  };
  
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This is a permanent action. You will be asked to confirm your current password to proceed. Are you sure you want to delete your account?",
      [
        { text: "Cancel", style: "cancel", onPress: () => setIsDeletingAccount(false) },
        { 
          text: "Confirm & Delete", 
          style: "destructive", 
          onPress: async () => {
            // Prompt for current password again for this sensitive action
            Alert.prompt(
              "Confirm Deletion",
              "Please enter your current password to delete your account.",
              async (passwordInput) => {
                if (passwordInput === null) { // User cancelled the prompt
                  setIsDeletingAccount(false);
                  return;
                }
                if (!passwordInput) {
                  Alert.alert("Password Required", "You must enter your current password to delete your account.");
                  setIsDeletingAccount(false);
                  return;
                }

                setIsDeletingAccount(true);
                const reauthSuccess = await reauthenticate(passwordInput);
                if (!reauthSuccess) {
                  setIsDeletingAccount(false);
                  return;
                }

                const user = auth.currentUser;
                if (user) {
                  try {
                    const userId = user.uid;
                    // Delete Firebase Auth user
                    await firebaseDeleteUser(user);
                    // Delete Firestore user document
                    const userDocRef = doc(firestore, 'users', userId);
                    await deleteDoc(userDocRef);
                    
                    Alert.alert("Account Deleted", "Your account has been successfully deleted.");
                    // Navigate to Login screen
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }], // Assuming 'Login' is the name of your login screen route
                    });
                  } catch (error: any) {
                    console.error("Account deletion failed:", error);
                    Alert.alert("Deletion Error", error.message || "Could not delete your account. Please try again.");
                  }
                }
                setIsDeletingAccount(false);
              },
              'secure-text' // Input type for password
            );
          }
        }
      ]
    );
  };

  if (loadingSettings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} disabled={isUpdatingPassword || isDeletingAccount}>
            <ArrowLeft size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.title}>Privacy & Security</Text>
        </View>
        <View style={styles.centeredMessageContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} disabled={isUpdatingPassword || isDeletingAccount}>
          <ArrowLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.title}>Privacy & Security</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Account Security Section */}
        <SectionHeader title="Account Security" />
        <Pressable style={styles.settingRow} onPress={() => navigation.navigate('UpdateEmail')}>
          <View style={styles.settingContent}>
            <View style={styles.iconContainer}>
              <Mail size={20} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.settingLabel}>Update Email</Text>
              <Text style={styles.settingDescription}>Change the email address associated with your account.</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textTertiary} />
        </Pressable>
        
        {/* Change Password Sub-Section */}
        <View style={styles.subSection}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showPassword}
              placeholder="Enter current password"
              placeholderTextColor="#7A89FF"
              autoCapitalize="none"
              editable={!isUpdatingPassword && !isDeletingAccount}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} disabled={isUpdatingPassword || isDeletingAccount}>
              {showPassword ? (
                <EyeOff size={20} color="#7A89FF" />
              ) : (
                <Eye size={20} color="#7A89FF" />
              )}
            </Pressable>
          </View>

          <Text style={styles.label}>New Password (min. 6 characters)</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#7A89FF"
              autoCapitalize="none"
              editable={!isUpdatingPassword && !isDeletingAccount}
            />
            <Pressable onPress={() => setShowNewPassword(!showNewPassword)} disabled={isUpdatingPassword || isDeletingAccount}>
              {showNewPassword ? (
                <EyeOff size={20} color="#7A89FF" />
              ) : (
                <Eye size={20} color="#7A89FF" />
              )}
            </Pressable>
          </View>

          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#7A89FF"
              autoCapitalize="none"
              editable={!isUpdatingPassword && !isDeletingAccount}
            />
            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isUpdatingPassword || isDeletingAccount}>
              {showConfirmPassword ? (
                <EyeOff size={20} color="#7A89FF" />
              ) : (
                <Eye size={20} color="#7A89FF" />
              )}
            </Pressable>
          </View>

          <Pressable style={[styles.saveButton, (isUpdatingPassword || isDeletingAccount) && styles.disabledButton]} onPress={handleSavePassword} disabled={isUpdatingPassword || isDeletingAccount}>
            {isUpdatingPassword ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Update Password</Text>
            )}
          </Pressable>
        </View>

        {/* Notification Settings Section */}
        <SectionHeader title="Notification Settings" />
        <SwitchRow 
          icon={<Bell size={20} color={colors.primary} />}
          label="Push Notifications"
          description="Receive alerts for order updates and messages."
          value={settings.pushNotificationsEnabled ?? true}
          onValueChange={(val) => handleUpdateSetting('pushNotificationsEnabled', val)}
          isSaving={isSavingSetting.pushNotificationsEnabled}
        />
        <SwitchRow 
          icon={<Mail size={20} color={colors.primary} />}
          label="Email Notifications"
          description="Receive order summaries and promotions via email."
          value={settings.emailNotificationsEnabled ?? true}
          onValueChange={(val) => handleUpdateSetting('emailNotificationsEnabled', val)}
          isSaving={isSavingSetting.emailNotificationsEnabled}
        />

        {/* Account Actions Section */}
        <SectionHeader title="Account Actions" />
        <Pressable style={styles.settingRow} onPress={handleDeleteAccount} disabled={isDeletingAccount}>
          <View style={styles.settingContent}>
            <View style={[styles.iconContainer, styles.dangerIconContainer]}>
              <UserMinus size={20} color={colors.danger} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.settingLabel, styles.dangerText]}>Delete Account</Text>
              <Text style={styles.settingDescription}>Permanently delete your account and all associated data.</Text>
            </View>
          </View>
          {isDeletingAccount ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <ChevronRight size={20} color={colors.danger} />
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionHeaderContainer: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIconContainer: {
    backgroundColor: colors.dangerLight,
  },
  textContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dangerText: {
    color: colors.danger,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textTertiary,
    lineHeight: 18,
  },
  subSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textTertiary,
    fontFamily: 'Inter_500Medium',
  },
  disabledButton: {
    opacity: 0.6,
  },
  switchContainer: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
}); 