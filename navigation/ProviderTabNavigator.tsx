import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, User, PenTool as Tool, Activity, Bell } from 'lucide-react-native';
import { View, StyleSheet, Animated, Easing } from 'react-native';

// Import provider screens
import ProviderDashboardScreen from '../screens/provider/ProviderDashboardScreen';
import ProviderProfileScreen from '../screens/provider/ProviderProfileScreen';
import RepairOrdersScreen from '../screens/provider/RepairOrdersScreen';
import RequestsScreen from '../screens/provider/RequestsScreen';

export type ProviderTabParamList = {
  Requests: undefined;
  RepairOrders: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<ProviderTabParamList>();

// Generic glowing icon component - reused from CustomerNavigator
interface GlowingIconProps {
  color: string;
  size: number;
  focused: boolean;
  Icon: React.ElementType;
}

const GlowingIcon = ({ color, size, focused, Icon }: GlowingIconProps) => {
  // Create animated values for smoother transitions
  const pulseAnim = React.useRef(new Animated.Value(0)).current;
  const focusAnim = React.useRef(new Animated.Value(0)).current;
  
  // Handle focus changes with spring physics for natural motion
  React.useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: focused ? 1 : 0,
      tension: 50,
      friction: 10,
      useNativeDriver: true,
    }).start();
    
    // Start or stop the pulse animation based on focus state
    if (focused) {
      startPulseAnimation();
    }
  }, [focused]);
  
  // Create an ultra-smooth continuous pulse animation
  const startPulseAnimation = () => {
    // Reset the pulse value
    pulseAnim.setValue(0);
    
    // Create a smooth sine wave-like pulse animation
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2500, // Slower animation for smoother effect
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    ).start();
  };
  
  // Create smooth interpolated values for multiple properties
  const iconScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });
  
  const glowScale = Animated.add(
    focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1.1],
    }),
    pulseAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.08, 0],
      extrapolate: 'clamp',
    })
  );
  
  const glowOpacity = Animated.add(
    focusAnim.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0, 0.2, 0.5],
      extrapolate: 'clamp',
    }),
    pulseAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.15, 0],
      extrapolate: 'clamp',
    })
  );
  
  // Get the right size for the icon based on focus state
  const iconSize = focused ? size + 4 : size;

  return (
    <View style={styles.iconWrapper}>
      <Animated.View 
        style={[
          styles.glowContainer,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }]
          }
        ]}
      />
      <Animated.View style={[
        styles.iconContainer,
        focused && styles.focusedIconContainer,
        {
          transform: [{ scale: iconScale }]
        }
      ]}>
        <Icon 
          size={iconSize} 
          color={color}
        />
      </Animated.View>
    </View>
  );
};

export default function ProviderTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Requests"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Requests') {
            return <GlowingIcon Icon={Bell} color={color} size={size} focused={focused} />;
          } 
          else if (route.name === 'RepairOrders') {
            return <GlowingIcon Icon={Tool} color={color} size={size} focused={focused} />;
          }
          else if (route.name === 'Profile') {
            return <GlowingIcon Icon={User} color={color} size={size} focused={focused} />;
          }
          
          // Default fallback
          return <GlowingIcon Icon={Home} color={color} size={size} focused={focused} />;
        },
        tabBarActiveTintColor: '#00F0FF', 
        tabBarInactiveTintColor: '#7A89FF',
        tabBarStyle: {
          backgroundColor: '#0A0F1E', 
          borderTopColor: '#2A3555',
          height: 65, // Increase tab bar height
          position: 'absolute',
          borderTopWidth: 1,
          elevation: 0, // Remove Android shadow
          shadowOpacity: 0, // Remove iOS shadow
        },
        tabBarItemStyle: {
          height: 60, // Apply to all tabs
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Requests" component={RequestsScreen} options={{ tabBarLabel: 'REQUESTS' }} />
      <Tab.Screen name="RepairOrders" component={RepairOrdersScreen} options={{ tabBarLabel: 'REPAIR QUEUE' }} />
      <Tab.Screen name="Profile" component={ProviderProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
    borderRadius: 20,
    zIndex: 1,
  },
  focusedIconContainer: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  glowContainer: {
    position: 'absolute',
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#00F0FF',
    opacity: 0,
  },
  focusedGlowContainer: {
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
}); 