import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { ClipboardList, Wrench, MessagesSquare, User } from 'lucide-react-native';
import { colors } from '@/styles/theme';

import AdminRequestsScreen from '@/screens/admin/AdminRequestsScreen';
import AdminRepairQueueScreen from '@/screens/admin/AdminRepairQueueScreen';
import AdminMessagingScreen from '@/screens/admin/AdminMessagingScreen';
import ProfileScreen from '@/screens/customer/ProfileScreen';

type AdminTabParamList = {
  AdminRequests: undefined;
  AdminQueue: undefined;
  AdminMessages: undefined;
  AdminProfile: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

const GlowingIcon = ({ color, size, focused, Icon }: { color: string; size: number; focused: boolean; Icon: React.ElementType }) => {
  const pulseAnim = React.useRef(new Animated.Value(0)).current;
  const focusAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(focusAnim, { toValue: focused ? 1 : 0, tension: 50, friction: 10, useNativeDriver: true }).start();
    if (focused) { startPulseAnimation(); }
  }, [focused]);

  const startPulseAnimation = () => {
    pulseAnim.setValue(0);
    Animated.loop(Animated.timing(pulseAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true })).start();
  };

  const iconScale = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const glowScale = Animated.add(focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.1] }), pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.08, 0], extrapolate: 'clamp' }));
  const glowOpacity = Animated.add(focusAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.2, 0.5], extrapolate: 'clamp' }), pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.15, 0], extrapolate: 'clamp' }));
  const iconSize = focused ? size + 4 : size;

  return (
    <View style={styles.iconWrapper}>
      <Animated.View style={[styles.glowContainer, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
      <Animated.View style={[styles.iconContainer, focused && styles.focusedIconContainer, { transform: [{ scale: iconScale }] }]}>
        <Icon size={iconSize} color={color} />
      </Animated.View>
    </View>
  );
};

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="AdminRequests"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'AdminRequests') return <GlowingIcon Icon={ClipboardList} color={color} size={size} focused={focused} />;
          if (route.name === 'AdminQueue') return <GlowingIcon Icon={Wrench} color={color} size={size} focused={focused} />;
          if (route.name === 'AdminMessages') return <GlowingIcon Icon={MessagesSquare} color={color} size={size} focused={focused} />;
          if (route.name === 'AdminProfile') return <GlowingIcon Icon={User} color={color} size={size} focused={focused} />;
          return <GlowingIcon Icon={ClipboardList} color={color} size={size} focused={focused} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 80, elevation: 4, shadowOpacity: 0.08, shadowRadius: 8 },
        tabBarItemStyle: { height: 70 },
      })}
    >
      <Tab.Screen name="AdminRequests" component={AdminRequestsScreen} options={{ tabBarLabel: 'REQUESTS' }} />
      <Tab.Screen name="AdminQueue" component={AdminRepairQueueScreen} options={{ tabBarLabel: 'REPAIR QUEUE' }} />
      <Tab.Screen name="AdminMessages" component={AdminMessagingScreen} options={{ tabBarLabel: 'MESSAGES' }} />
      <Tab.Screen name="AdminProfile" component={ProfileScreen} options={{ tabBarLabel: 'PROFILE' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrapper: { alignItems: 'center', justifyContent: 'center', width: 50, height: 50 },
  iconContainer: { justifyContent: 'center', alignItems: 'center', height: 40, width: 40, borderRadius: 20, zIndex: 1 },
  focusedIconContainer: { backgroundColor: 'rgba(0, 240, 255, 0.15)' },
  glowContainer: { position: 'absolute', height: 40, width: 40, borderRadius: 20, backgroundColor: '#00F0FF' },
});


