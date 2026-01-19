import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, User, Activity } from 'lucide-react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RequestsProvider } from '@/contexts/RequestsContext';
import { CustomTabBar } from '@/components/ui/CustomTabBar';

// --- Import the actual screen components ---
// TODO: Adjust paths if files are moved/renamed later
import HomeScreen from '../screens/customer/HomeScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import PastChatsScreen from '../screens/customer/PastChatsScreen';
import ServiceScheduleScreen from '../screens/customer/ServiceScheduleScreen';
import CustomQuoteRequestScreen from '../screens/customer/CustomQuoteRequestScreen';
import CustomerQuotesScreen from '../screens/customer/CustomerQuotesScreen';
import RequestsHomeScreen from '../screens/customer/RequestsHomeScreen';
import SupportChatScreen from '../screens/shared/SupportChatScreen';
import CustomChargeDetailScreen from '../screens/customer/CustomChargeDetailScreen';

export type CustomerTabParamList = {
  Services: undefined;
  Orders: undefined;
  Profile: undefined;
};

// Added: StackParamList for screens within the "Services" tab
export type HomeStackParamList = {
  Home: undefined; // For HomeScreen
  CustomChargeDetail: { customChargeId: string };
  // Add other screens navigable from Home here
};

const Tab = createBottomTabNavigator<CustomerTabParamList>();
const Stack = createNativeStackNavigator<HomeStackParamList>();
type RequestsStackParamList = {
  RequestsHome: undefined;
  RequestQuote: undefined;
  CustomerQuotes: undefined;
  Support: undefined;
};
const RequestsStack = createNativeStackNavigator<RequestsStackParamList>();

// Added: StackNavigator for the "Services" tab
function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="CustomChargeDetail" component={CustomChargeDetailScreen} />
    </Stack.Navigator>
  );
}

function RequestsStackNavigator() {
  return (
    <RequestsProvider>
      <RequestsStack.Navigator screenOptions={{ headerShown: false }}>
        <RequestsStack.Screen name="RequestsHome" component={RequestsHomeScreen} />
        <RequestsStack.Screen name="RequestQuote" component={CustomQuoteRequestScreen} />
        <RequestsStack.Screen name="CustomerQuotes" component={CustomerQuotesScreen} />
        <RequestsStack.Screen name="Support" component={SupportChatScreen} />
      </RequestsStack.Navigator>
    </RequestsProvider>
  );
}

export default function CustomerNavigator() {
  const tabConfig = [
    { routeName: 'Services', icon: Home, label: 'REQUEST' },
    { routeName: 'Orders', icon: Activity, label: 'ORDERS' },
    { routeName: 'Profile', icon: User, label: 'PROFILE' },
  ];

  return (
    <Tab.Navigator
      initialRouteName="Services"
      tabBar={(props) => <CustomTabBar {...props} tabConfig={tabConfig} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Services" component={RequestsStackNavigator} options={{ tabBarLabel: 'REQUEST' }} />
      <Tab.Screen name="Orders" component={CustomerQuotesScreen} options={{ tabBarLabel: 'ORDERS' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'PROFILE' }} />
    </Tab.Navigator>
  );
} 