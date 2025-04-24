import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Bell, Lock, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
};

const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
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
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={styles.settingsItemIcon}>{icon}</View>
    <View style={styles.settingsItemContent}>
      <Text style={styles.settingsItemTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
    </View>
    <View style={styles.settingsItemRight}>
      {rightElement || <ChevronRight size={20} color="#999" />}
    </View>
  </TouchableOpacity>
);

const AccountSettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <SettingsSection title="Personal Information">
          <SettingsItem
            icon={<User size={24} color="#2196F3" />}
            title="Profile Information"
            subtitle="Update your name, email, and phone number"
            onPress={() => {}}
          />
          <SettingsItem
            icon={<User size={24} color="#2196F3" />}
            title="Business Details"
            subtitle="Manage your service offerings and business info"
            onPress={() => {}}
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsItem
            icon={<Bell size={24} color="#FF9800" />}
            title="Push Notifications"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#ccc', true: '#2196F3' }}
              />
            }
          />
          <SettingsItem
            icon={<Bell size={24} color="#FF9800" />}
            title="Email Notifications"
            subtitle="Receive updates and summaries via email"
            onPress={() => {}}
          />
        </SettingsSection>

        <SettingsSection title="Privacy & Security">
          <SettingsItem
            icon={<Lock size={24} color="#4CAF50" />}
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => {}}
          />
          <SettingsItem
            icon={<Lock size={24} color="#4CAF50" />}
            title="Location Services"
            rightElement={
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: '#ccc', true: '#2196F3' }}
              />
            }
          />
          <SettingsItem
            icon={<Lock size={24} color="#4CAF50" />}
            title="Privacy Policy"
            onPress={() => {}}
          />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsItem
            icon={<HelpCircle size={24} color="#673AB7" />}
            title="Help Center"
            subtitle="FAQs and troubleshooting guides"
            onPress={() => {}}
          />
          <SettingsItem
            icon={<HelpCircle size={24} color="#673AB7" />}
            title="Contact Support"
            subtitle="Get help with your account or services"
            onPress={() => {}}
          />
        </SettingsSection>

        <TouchableOpacity style={styles.logoutButton} onPress={() => {}}>
          <LogOut size={20} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsItemIcon: {
    marginRight: 16,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingsItemSubtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  settingsItemRight: {
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default AccountSettingsScreen; 