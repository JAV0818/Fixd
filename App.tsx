import React, { useEffect } from 'react';
import { Text, View } from 'react-native'; // Import basic components if needed for error state
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import AppNavigator from './navigation/AppNavigator'; // Check path relative to App.tsx
import { CartProvider } from './contexts/CartContext'; // Import CartProvider

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

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
    <SafeAreaProvider>
      <CartProvider>
        <AppNavigator />
        <StatusBar style="light" />
      </CartProvider>
    </SafeAreaProvider>
  );
}
