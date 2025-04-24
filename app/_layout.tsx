import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import AppNavigator from '@/navigation/AppNavigator'; // Import our main navigator
import { CartProvider } from '@/contexts/CartContext'; // Import our CartProvider

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      {/* Wrap AppNavigator with CartProvider */}
      <CartProvider>
        <AppNavigator />
      </CartProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}