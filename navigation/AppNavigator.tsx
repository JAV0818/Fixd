import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase'; 
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LoginScreen from '@/screens/auth/LoginScreen';
import SignupScreen from '@/screens/auth/SignupScreen';
import CustomerNavigator from './CustomerNavigator'; // Your Bottom Tab Navigator
import ProviderTabNavigator from './ProviderTabNavigator'; // Your Provider Tab Navigator
import ProviderDashboardScreen from '@/screens/provider/ProviderDashboardScreen'; // Assuming this exists
import RequestDetailScreen from '@/screens/provider/RequestDetailScreen';
import RequestStartScreen from '@/screens/provider/RequestStartScreen';
import RequestCancelScreen from '@/screens/provider/RequestCancelScreen';
import RequestContactScreen from '@/screens/provider/RequestContactScreen';
import PerformanceDetailsScreen from '@/screens/provider/PerformanceDetailsScreen';
import AccountSettingsScreen from '@/screens/provider/AccountSettingsScreen';
import UpdateStatusScreen from '@/screens/provider/UpdateStatusScreen'; // Import the new screen
import ServiceDetailScreen from '@/screens/customer/ServiceDetailScreen'; // Generic Detail Screen
import BatteryJumpStartScreen from '@/screens/customer/BatteryJumpStartScreen'; // Import the new screen
import ServiceScheduleScreen from '@/screens/customer/ServiceScheduleScreen';
import PrivacySettingsScreen from '@/screens/customer/PrivacySettingsScreen';
import CartScreen from '@/screens/customer/CartScreen'; // Import the cart screen
import CheckoutScreen from '@/screens/customer/CheckoutScreen'; // Import the checkout screen
import OrderDetailScreen from '@/screens/customer/OrderDetailScreen'; // Import the order detail screen
import MechanicChatScreen from '@/screens/customer/MechanicChatScreen'; // Import the mechanic chat screen
import PastChatsScreen from '@/screens/customer/PastChatsScreen'; // Import the past chats screen

// Combine all param lists for the root navigator
// Use NavigatorScreenParams to type nested navigator params
import { NavigatorScreenParams } from '@react-navigation/native';

// Define ParamList for type safety
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  CustomerApp: undefined; // Represents the entire Customer Tab Navigator
  ProviderApp: undefined; // Represents the Provider main screen/navigator
  ServiceDetail: { id: string }; // For the generic template approach
  BatteryJumpStart: undefined; // Add the new dedicated screen
  ServiceSchedule: undefined; // Added from ProfileScreen navigation
  PrivacySettings: undefined; // Added from ProfileScreen navigation
  Cart: undefined; // Add the cart screen
  Checkout: undefined; // Add the checkout screen
  OrderDetail: { orderId: string }; // Add order detail screen
  MechanicChat: { orderId: string; mechanicName?: string }; // Add chat screen
  PastChats: undefined; // Add past chats screen
  // Provider screens
  RequestDetail: { requestId: string };
  RequestStart: { requestId: string };
  RequestCancel: { requestId: string };
  RequestContact: { requestId: string };
  // New provider screens
  PerformanceDetails: undefined;
  AccountSettings: undefined;
  UpdateStatus: { orderId: string }; // Add the new screen params
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Custom hook for auth state and navigation
function useAuthNavigation() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check user role
        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        setIsAdmin(userDoc.data()?.isAdmin || false);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  return { user, isAdmin, loading };
}

export default function AppNavigator() {
  const { user, isAdmin, loading } = useAuthNavigation();

  if (loading) {
    // Optional: Show a loading spinner/splash screen
    return null; 
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // User is signed in
        isAdmin ? (
          <>
            <Stack.Screen name="ProviderApp" component={ProviderTabNavigator} />
            {/* Provider screens */}
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
            <Stack.Screen name="RequestStart" component={RequestStartScreen} />
            <Stack.Screen name="RequestCancel" component={RequestCancelScreen} />
            <Stack.Screen name="RequestContact" component={RequestContactScreen} />
            <Stack.Screen name="PerformanceDetails" component={PerformanceDetailsScreen} />
            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
            <Stack.Screen name="UpdateStatus" component={UpdateStatusScreen} />
          </>
        ) : (
          // Regular customer flow
          <>
            <Stack.Screen name="CustomerApp" component={CustomerNavigator} />
            {/* Screens accessible FROM CustomerApp tabs */}
            <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
            <Stack.Screen name="BatteryJumpStart" component={BatteryJumpStartScreen} />
            <Stack.Screen name="ServiceSchedule" component={ServiceScheduleScreen} />
            <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="MechanicChat" component={MechanicChatScreen} />
            <Stack.Screen name="PastChats" component={PastChatsScreen} />
          </>
        )
      ) : (
        // No user is signed in
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
} 