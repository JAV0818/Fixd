import { Stack } from 'expo-router';

export default function StatsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="earnings" />
      <Stack.Screen name="services" />
      <Stack.Screen name="hours" />
      <Stack.Screen name="clients" />
    </Stack>
  );
}