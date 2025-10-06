import React, { useEffect } from 'react';
import { Text, View, LogBox } from 'react-native'; // Import basic components if needed for error state
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo'; // Import registerRootComponent
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { NavigationContainer } from '@react-navigation/native'; // Import NavigationContainer
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Added import
import { StripeProvider } from '@stripe/stripe-react-native'; // Import StripeProvider

import AppNavigator from './navigation/AppNavigator'; // Check path relative to App.tsx
import { CartProvider } from './contexts/CartContext'; // Import CartProvider

// Import notification functions
import { initializeNotificationHandler, setupNotifications } from './utils/notifications';
import { auth } from './lib/firebase'; // Assuming your firebase config is here
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';

// Ignore specific VirtualizedList warning
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
]);

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Initialize notification handler once when the app loads
    initializeNotificationHandler();

    // Listen for auth state changes to setup notifications for logged-in user
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, setup notifications
        console.log('User signed in, setting up notifications:', user.uid);
        setupNotifications();
      } else {
        // User is signed out
        console.log('User signed out.');
        // Optionally, clear the token from Firestore if you have a logout function that handles it
      }
    });

    return () => unsubscribe(); // Unsubscribe on unmount
  }, []);

  // Log font loading errors
  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontError]);

  // Render loading state or null while fonts are loading
  if (!fontsLoaded && !fontError) {
    return null; // Or replace with a dedicated loading/splash screen component
  }

  // Optional: Render an error message if fonts fail to load
  if (fontError) {
     return (
         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
             <Text style={{ color: 'red' }}>Error loading fonts. App cannot start.</Text>
         </View>
     );
  }

  // Render the main application structure
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CartProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
        </CartProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
 
 // Register the main App component
 registerRootComponent(App);
