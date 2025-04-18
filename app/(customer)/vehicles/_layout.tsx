import { Stack } from 'expo-router';

export default function VehiclesLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'My Vehicles', 
          headerShown: false
        }} 
      />
      <Stack.Screen name="[id]" options={{ title: 'Vehicle Details' }} />
      <Stack.Screen name="service-options" options={{ title: 'Service Options' }} />
    </Stack>
  );
} 