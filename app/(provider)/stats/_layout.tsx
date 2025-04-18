import { Stack } from 'expo-router';

export default function StatsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="earnings" options={{ title: 'Earnings Stats' }} />
      <Stack.Screen name="services" options={{ title: 'Services Stats' }} />
      <Stack.Screen name="hours" options={{ title: 'Hours Stats' }} />
      <Stack.Screen name="clients" options={{ title: 'Clients Stats' }} />
    </Stack>
  );
}