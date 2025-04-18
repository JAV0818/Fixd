import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Profile', 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="privacy-settings"
        options={{ 
          title: 'Privacy and Settings',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="service-schedule" 
        options={{ 
          title: 'Service Schedule',
          headerShown: false
        }} 
      />
    </Stack>
  );
} 