import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { auth } from '@/lib/firebase';
import { useRouter, useSegments } from 'expo-router';

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // Check if the current route is not the login or signup screen
      const isAuthRoute = segments[0] === undefined || segments[0] === 'signup';
      
      if (!user && !isAuthRoute) {
        // User is not authenticated and not on an auth route, redirect to login
        router.replace('/');
      } else if (user && isAuthRoute) {
        // User is authenticated but on an auth route, redirect to appropriate screen
        // You might want to check Firestore for user role here
        router.replace('/(customer)');
      }
    });

    return () => unsubscribe();
  }, [segments]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="signup" />
        <Stack.Screen 
          name="(customer)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="(provider)" />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}