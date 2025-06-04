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
import AddVehicleScreen from '@/screens/customer/AddVehicleScreen'; // Import AddVehicleScreen
import PreAcceptanceChatScreen from '@/screens/customer/PreAcceptanceChatScreen'; // Import PreAcceptanceChatScreen
import UpdateEmailScreen from '@/screens/customer/UpdateEmailScreen'; // Import the new screen

// Combine all param lists for the root navigator
// Use NavigatorScreenParams to type nested navigator params
import { NavigatorScreenParams } from '@react-navigation/native';

// Define ParamList for type safety
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  CustomerApp: undefined; // Represents the entire Customer Tab Navigator
  ProviderApp: undefined; // Represents the Provider main screen/navigator
  ServiceDetail: { id: string; vehicleId: string | null }; // Updated to include vehicleId
  BatteryJumpStart: undefined; // Add the new dedicated screen
  ServiceSchedule: undefined; // Added from ProfileScreen navigation
  PrivacySettings: undefined; // Added from ProfileScreen navigation
  UpdateEmail: undefined; // Added for updating email
  Cart: undefined; // Add the cart screen
  Checkout: undefined; // Add the checkout screen
  OrderDetail: { orderId: string }; // Add order detail screen
  MechanicChat: { orderId: string; mechanicName?: string }; // Add chat screen
  PastChats: undefined; // Add past chats screen
  AddVehicle: undefined; // Add the new vehicle screen
  PreAcceptanceChat: { orderId: string }; // Added for pre-acceptance chat
  // Provider screens - REMOVE THESE - they belong in ProviderStackParamList
  /*
  RequestDetail: { requestId: string }; 
  RequestStart: { requestId: string };
  RequestCancel: { requestId: string };
  RequestContact: { requestId: string };
  PerformanceDetails: undefined;
  AccountSettings: undefined;
  UpdateStatus: { orderId: string };
  */
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Custom hook for auth state and navigation
function useAuthNavigation() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Stays true until role is determined

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Introduce a small delay to allow other Firestore operations (like FCM token save)
        // to potentially complete and for data to be more consistent for this read.
        setTimeout(async () => {
          try {
            const userDocRef = doc(firestore, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            console.log('[AppNavigator with Delay] User document for role check (UID:', currentUser.uid, '):', userDoc.data());
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log('[AppNavigator with Delay] isAdmin field value:', userData.isAdmin, 'Type:', typeof userData.isAdmin);
              setIsAdmin(userData.isAdmin === true);
            } else {
              console.log('[AppNavigator with Delay] User document does not exist for UID:', currentUser.uid);
              setIsAdmin(false);
            }
          } catch (error) {
            console.error("Error fetching user role (with delay):", error);
            setIsAdmin(false);
          } finally {
            setLoading(false); // Role determination complete, stop loading
          }
        }, 750); // Delay of 750ms (adjust if needed)
      } else {
        // No user, clear admin state and stop loading immediately
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
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
            {/* Provider screens - REMOVE THESE - Handled by ProviderNavigator */}
            {/* 
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
            <Stack.Screen name="RequestStart" component={RequestStartScreen} />
            <Stack.Screen name="RequestCancel" component={RequestCancelScreen} />
            <Stack.Screen name="RequestContact" component={RequestContactScreen} />
            <Stack.Screen name="PerformanceDetails" component={PerformanceDetailsScreen} />
            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
            <Stack.Screen name="UpdateStatus" component={UpdateStatusScreen} />
            */}
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
            <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
            <Stack.Screen name="PreAcceptanceChat" component={PreAcceptanceChatScreen} />
            <Stack.Screen name="UpdateEmail" component={UpdateEmailScreen} />
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