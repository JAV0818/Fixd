// TODO: Admin flow - This file is temporarily disabled
// Admin screens have been removed to avoid confusion
// When ready to implement admin flow, uncomment and create admin screens

/*
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ClipboardList, Wrench, MessagesSquare, User } from 'lucide-react-native';
import { CustomTabBar } from '@/components/ui/CustomTabBar';

// TODO: Create admin screens:
// - screens/admin/AdminRequestsScreen.tsx
// - screens/admin/AdminRepairQueueScreen.tsx
// - screens/admin/AdminMessagingScreen.tsx
import ProfileScreen from '@/screens/customer/ProfileScreen';

type AdminTabParamList = {
  AdminRequests: undefined;
  AdminQueue: undefined;
  AdminMessages: undefined;
  AdminProfile: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminTabNavigator() {
  const tabConfig = [
    { routeName: 'AdminRequests', icon: ClipboardList, label: 'REQUESTS' },
    { routeName: 'AdminQueue', icon: Wrench, label: 'REPAIR QUEUE' },
    { routeName: 'AdminMessages', icon: MessagesSquare, label: 'MESSAGES' },
    { routeName: 'AdminProfile', icon: User, label: 'PROFILE' },
  ];

  return (
    <Tab.Navigator
      initialRouteName="AdminRequests"
      tabBar={(props) => <CustomTabBar {...props} tabConfig={tabConfig} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="AdminRequests" component={AdminRequestsScreen} options={{ tabBarLabel: 'REQUESTS' }} />
      <Tab.Screen name="AdminQueue" component={AdminRepairQueueScreen} options={{ tabBarLabel: 'REPAIR QUEUE' }} />
      <Tab.Screen name="AdminMessages" component={AdminMessagingScreen} options={{ tabBarLabel: 'MESSAGES' }} />
      <Tab.Screen name="AdminProfile" component={ProfileScreen} options={{ tabBarLabel: 'PROFILE' }} />
    </Tab.Navigator>
  );
}
*/

// Temporary placeholder to prevent import errors
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminTabNavigator() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Admin Flow</Text>
        <Text style={styles.subtitle}>Admin screens are temporarily disabled</Text>
        <Text style={styles.note}>Admins are currently using the provider navigator</Text>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 16,
    textAlign: 'center',
  },
  note: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    textAlign: 'center',
  },
});
