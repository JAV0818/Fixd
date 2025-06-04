import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Bell, Lock, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/navigation/ProviderTabNavigator';

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
};

const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

type SettingsItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
};

const SettingsItem = ({ icon, title, subtitle, rightElement, onPress }: SettingsItemProps) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress} disabled={!onPress}>
    <View style={styles.settingsItemIcon}>{icon}</View>
    <View style={styles.settingsItemContent}>
      <Text style={styles.settingsItemTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
    </View>
    <View style={styles.settingsItemRight}>
      {rightElement ? rightElement : (onPress ? <ChevronRight size={20} color="#7A89FF" /> : null)}
    </View>
  </TouchableOpacity>
);

const AccountSettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = React.useState(false);
  const [locationEnabled, setLocationEnabled] = React.useState(true);

  const handleProfileInfo = () => console.log("Navigate to Profile Information Edit");
  const handleBusinessDetails = () => console.log("Navigate to Business Details Edit");
  const handleChangePassword = () => console.log("Navigate to Change Password");
  const handlePrivacyPolicy = () => console.log("Navigate to Privacy Policy");
  const handleHelpCenter = () => console.log("Navigate to Help Center");
  const handleContactSupport = () => console.log("Navigate to Contact Support");
  const handleLogout = () => {
    console.log("Logout action");
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ACCOUNT SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Personal & Business">
          <SettingsItem
            icon={<User size={20} color="#00F0FF" />}
            title="Profile Information"
            subtitle="Name, contact, public details"
            onPress={handleProfileInfo}
          />
          <SettingsItem
            icon={<User size={20} color="#00F0FF" />}
            title="Business Details"
            subtitle="Service offerings, business address"
            onPress={handleBusinessDetails}
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsItem
            icon={<Bell size={20} color="#00F0FF" />}
            title="Push Notifications"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#2A3555', true: 'rgba(0, 240, 255, 0.3)' }}
                thumbColor={notificationsEnabled ? '#00F0FF' : '#7A89FF'}
              />
            }
          />
          <SettingsItem
            icon={<Bell size={20} color="#00F0FF" />}
            title="Email Notifications"
            rightElement={
              <Switch
                value={emailNotificationsEnabled}
                onValueChange={setEmailNotificationsEnabled}
                trackColor={{ false: '#2A3555', true: 'rgba(0, 240, 255, 0.3)' }}
                thumbColor={emailNotificationsEnabled ? '#00F0FF' : '#7A89FF'}
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="Privacy & Security">
          <SettingsItem
            icon={<Lock size={20} color="#00F0FF" />}
            title="Change Password"
            onPress={handleChangePassword}
          />
          <SettingsItem
            icon={<Lock size={20} color="#00F0FF" />}
            title="Location Services"
            subtitle="Manage location data usage"
            rightElement={
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: '#2A3555', true: 'rgba(0, 240, 255, 0.3)' }}
                thumbColor={locationEnabled ? '#00F0FF' : '#7A89FF'}
              />
            }
          />
          <SettingsItem
            icon={<Lock size={20} color="#00F0FF" />}
            title="Privacy Policy"
            onPress={handlePrivacyPolicy}
          />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsItem
            icon={<HelpCircle size={20} color="#00F0FF" />}
            title="Help Center"
            onPress={handleHelpCenter}
          />
          <SettingsItem
            icon={<HelpCircle size={20} color="#00F0FF" />}
            title="Contact Support"
            onPress={handleContactSupport}
          />
        </SettingsSection>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FF3D71" />
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 1.5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    marginBottom: 12,
    letterSpacing: 1,
    paddingLeft: 8,
  },
  sectionContent: {
    backgroundColor: '#121827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 53, 85, 0.5)',
  },
  settingsItemIcon: {
    marginRight: 16,
    width: 24,
    alignItems: 'center',
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#E0EFFF',
  },
  settingsItemSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    marginTop: 3,
  },
  settingsItemRight: {
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    borderRadius: 10,
    paddingVertical: 16,
    marginTop: 24,
    marginBottom: 16,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#FF3D71',
  },
  logoutText: {
    color: '#FF3D71',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 10,
    letterSpacing: 1,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    textAlign: 'center',
    paddingVertical: 24,
  },
});

export default AccountSettingsScreen; 