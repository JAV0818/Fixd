import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { auth, firestore } from '@/lib/firebase'; 
import LoginScreen from '@/screens/auth/LoginScreen';
import SignupScreen from '@/screens/auth/SignupScreen';
import CustomerNavigator from './CustomerNavigator'; // Your Bottom Tab Navigator
import ProviderTabNavigator from './ProviderTabNavigator'; // Your Provider Tab Navigator
import AdminTabNavigator from './AdminTabNavigator';
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
import OrderDetailScreen from '@/screens/customer/OrderDetailScreen'; // Import the order detail screen
import MechanicChatScreen from '@/screens/customer/MechanicChatScreen'; // Import the mechanic chat screen
import PastChatsScreen from '@/screens/customer/PastChatsScreen'; // Import the past chats screen
import AddVehicleScreen from '@/screens/customer/AddVehicleScreen'; // Import AddVehicleScreen
import PreAcceptanceChatScreen from '@/screens/customer/PreAcceptanceChatScreen'; // Import PreAcceptanceChatScreen
import UpdateEmailScreen from '@/screens/customer/UpdateEmailScreen'; // Import the new screen
import CustomQuoteDetailScreen from '@/screens/customer/CustomQuoteDetailScreen'; // Import the new quote detail screen
import HelpMeChooseScreen from '@/screens/customer/HelpMeChooseScreen';
import CustomQuoteRequestScreen from '@/screens/customer/CustomQuoteRequestScreen';
import AdminRequestsScreen from '@/screens/admin/AdminRequestsScreen';
import CustomerQuotesScreen from '@/screens/customer/CustomerQuotesScreen';
// import SupportChatScreen from '@/screens/shared/SupportChatScreen';
import SplashScreen from '../components/ui/SplashScreen';
import CreateCustomChargeScreen from '@/screens/provider/CreateCustomChargeScreen';

// Combine all param lists for the root navigator
// Use NavigatorScreenParams to type nested navigator params
import { NavigatorScreenParams } from '@react-navigation/native';

// Define ParamList for type safety
export type RootStackParamList = {
  Auth: undefined;
  Customer: NavigatorScreenParams<CustomerTabParamList>;
  Provider: NavigatorScreenParams<ProviderTabParamList>;
  Admin: NavigatorScreenParams<AdminTabParamList>;
  // Add other screens here that are not part of the tab navigators
  ServiceDetail: { id: string, vehicleId?: string | null };
  AddVehicle: undefined;
  ServiceSchedule: { serviceId: string, serviceName: string, vehicleId?: string };
  HelpMeChoose: { id: string };
  RequestQuote: undefined;
  CustomerQuotes: undefined;
  Support: { chatId?: string, customerId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Custom hook for auth state and navigation
function useAuthNavigation() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'provider' | 'customer' | null>(null);
  const [loading, setLoading] = useState(true); // Stays true until role is determined

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      const resolveRole = async () => {
          try {
            const userDocRef = doc(firestore, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
          const existingData = userDoc.exists() ? userDoc.data() : undefined;

          // Only set a default role if none exists; do not overwrite an existing role
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              email: currentUser.email || null,
              role: 'customer',
              firstName: currentUser.displayName?.split(' ')?.[0] || null,
              lastName: currentUser.displayName?.split(' ')?.slice(1).join(' ') || null,
            }, { merge: true });
          } else if (!existingData?.role) {
            await setDoc(userDocRef, {
              role: 'customer',
              email: existingData?.email ?? currentUser.email ?? null,
              firstName: existingData?.firstName ?? currentUser.displayName?.split(' ')?.[0] ?? null,
              lastName: existingData?.lastName ?? currentUser.displayName?.split(' ')?.slice(1).join(' ') ?? null,
            }, { merge: true });
          }

          const userDocFinal = userDoc.exists() ? userDoc : await getDoc(userDocRef);
          if (userDocFinal.exists()) {
            const userData = userDocFinal.data();
              const r = (userData.role as string) || (userData.isAdmin ? 'admin' : 'customer');
              setRole(r === 'admin' || r === 'provider' ? (r as any) : 'customer');
            } else {
              setRole('customer');
            }
          } catch (error) {
          console.error('Error fetching user role:', error);
          setRole('customer');
          } finally {
        setLoading(false);
      }
      };

      resolveRole();
    });

    return () => unsubscribe();
  }, []);

  return { user, role, loading };
}

export default function AppNavigator() {
  const { user, role, loading } = useAuthNavigation();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // User is signed in
        role === 'admin' ? (
          <>
            <Stack.Screen name="ProviderApp" component={AdminTabNavigator} />
            <Stack.Screen name="CreateCustomCharge" component={CreateCustomChargeScreen} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
            <Stack.Screen name="RequestContact" component={RequestContactScreen} />
            <Stack.Screen name="RequestStart" component={RequestStartScreen} />
            <Stack.Screen name="UpdateStatus" component={UpdateStatusScreen} />
          </>
        ) : role === 'provider' ? (
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
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="MechanicChat" component={MechanicChatScreen} />
            <Stack.Screen name="PastChats" component={PastChatsScreen} />
            <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
            <Stack.Screen name="PreAcceptanceChat" component={PreAcceptanceChatScreen} />
            <Stack.Screen name="UpdateEmail" component={UpdateEmailScreen} />
            <Stack.Screen name="CustomQuoteDetail" component={CustomQuoteDetailScreen} />
            <Stack.Screen name="HelpMeChoose" component={HelpMeChooseScreen} />
            <Stack.Screen name="RequestQuote" component={CustomQuoteRequestScreen} />
            <Stack.Screen name="CustomerQuotes" component={CustomerQuotesScreen} />
            {/* <Stack.Screen name="Support" component={SupportChatScreen} /> */}
            <Stack.Screen name="AdminRequests" component={AdminRequestsScreen} />
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