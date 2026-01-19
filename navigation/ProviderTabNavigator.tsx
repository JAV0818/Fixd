import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, User, PenTool as Tool, MessageSquare } from 'lucide-react-native';
import { getFocusedRouteNameFromRoute, RouteProp } from '@react-navigation/native';
import { NavigatorScreenParams } from '@react-navigation/native';
import { CustomTabBar } from '@/components/ui/CustomTabBar';

// Import provider screens
import ProviderDashboardScreen from '../screens/provider/ProviderDashboardScreen';
import ProviderProfileScreen from '../screens/provider/ProviderProfileScreen';
import RepairOrdersScreen from '../screens/provider/RepairOrdersScreen';
import QuoteMarketplaceScreen from '@/screens/provider/QuoteMarketplaceScreen';
import ProviderMessagingScreen from '@/screens/provider/ProviderMessagingScreen';
import PerformanceDetailsScreen from '../screens/provider/PerformanceDetailsScreen';
import AccountSettingsScreen from '../screens/provider/AccountSettingsScreen';

// Import the ProviderNavigator stack
import ProviderNavigator, { ProviderStackParamList } from './ProviderNavigator';

// Define ParamList for the Profile Stack
export type ProfileStackParamList = {
  ProviderProfile: undefined;
  PerformanceDetails: undefined;
  AccountSettings: undefined;
};

const ProfileStackNavigator = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStack() {
  return (
    <ProfileStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNavigator.Screen name="ProviderProfile" component={ProviderProfileScreen} />
      <ProfileStackNavigator.Screen name="PerformanceDetails" component={PerformanceDetailsScreen} />
      <ProfileStackNavigator.Screen name="AccountSettings" component={AccountSettingsScreen} />
    </ProfileStackNavigator.Navigator>
  );
}

export type ProviderTabParamList = {
  Marketplace: undefined;
  RepairOrders: undefined;
  Messages: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

const Tab = createBottomTabNavigator<ProviderTabParamList>();

export default function ProviderTabNavigator() {
  const tabConfig = [
    { routeName: 'Marketplace', icon: Home, label: 'REQUESTS' },
    { routeName: 'RepairOrders', icon: Tool, label: 'QUEUE' },
    { routeName: 'Messages', icon: MessageSquare, label: 'MESSAGES' },
    { routeName: 'Profile', icon: User, label: 'PROFILE' },
  ];

  return (
    <Tab.Navigator
      initialRouteName="Marketplace"
      tabBar={(props) => <CustomTabBar {...props} tabConfig={tabConfig} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Marketplace" component={QuoteMarketplaceScreen} options={{ tabBarLabel: 'REQUESTS' }} />
      <Tab.Screen name="RepairOrders" component={RepairOrdersScreen} options={{ tabBarLabel: 'QUEUE' }} />
      <Tab.Screen name="Messages" component={ProviderMessagingScreen} options={{ tabBarLabel: 'MESSAGES' }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: 'PROFILE' }} />
    </Tab.Navigator>
  );
}
