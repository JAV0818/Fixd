import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Chrome as Home, Car, MessageSquare, User } from 'lucide-react-native';

export default function CustomerTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 30,
          right: 30,
          elevation: 5,
          backgroundColor: '#0A0F1E',
          borderRadius: 28,
          height: 55,
          paddingTop: 6,
          borderTopWidth: 0,
          borderColor: '#2A3555',
          borderWidth: 1,
          shadowColor: '#00F0FF',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: '#00F0FF',
        tabBarInactiveTintColor: '#7A89FF',
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color, size }) => <Car size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}