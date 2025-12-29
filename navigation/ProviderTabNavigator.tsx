import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, User, PenTool as Tool, Activity, Bell, MessageSquare } from 'lucide-react-native';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { getFocusedRouteNameFromRoute, RouteProp } from '@react-navigation/native';
import { NavigatorScreenParams } from '@react-navigation/native';

// Import provider screens
import ProviderDashboardScreen from '../screens/provider/ProviderDashboardScreen';
import ProviderProfileScreen from '../screens/provider/ProviderProfileScreen';
import RepairOrdersScreen from '../screens/provider/RepairOrdersScreen';
import QuoteMarketplaceScreen from '@/screens/provider/QuoteMarketplaceScreen';
import ProviderMessagingScreen from '@/screens/provider/ProviderMessagingScreen';
import PerformanceDetailsScreen from '../screens/provider/PerformanceDetailsScreen';
import AccountSettingsScreen from '../screens/provider/AccountSettingsScreen';

// Import the ProviderNavigator stack
import ProviderNavigator, { ProviderStackParamList } from './ProviderNavigator';
import { colors } from '@/styles/theme';

// Define ParamList for the Profile Stack
export type ProfileStackParamList = {
  ProviderProfile: undefined;
  PerformanceDetails: undefined;
  AccountSettings: undefined;
};

const ProfileStackNavigator = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStack() {
  return (
    <ProfileStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNavigator.Screen name="ProviderProfile" component={ProviderProfileScreen} />
      <ProfileStackNavigator.Screen name="PerformanceDetails" component={PerformanceDetailsScreen} />
      <ProfileStackNavigator.Screen name="AccountSettings" component={AccountSettingsScreen} />
    </ProfileStackNavigator.Navigator>
  );
}

export type ProviderTabParamList = {
  Marketplace: undefined;
  RepairOrders: undefined;
  Messages: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
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
      initialRouteName="Marketplace"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Marketplace') {
            return <GlowingIcon Icon={Home} color={color} size={size} focused={focused} />;
          } else if (route.name === 'RepairOrders') {
            return <GlowingIcon Icon={Tool} color={color} size={size} focused={focused} />;
          } else if (route.name === 'Messages') {
            return <GlowingIcon Icon={MessageSquare} color={color} size={size} focused={focused} />;
          }
          else if (route.name === 'Profile') {
            return <GlowingIcon Icon={User} color={color} size={size} focused={focused} />;
          }
          
          // Default fallback
          return <GlowingIcon Icon={Home} color={color} size={size} focused={focused} />;
        },
        tabBarActiveTintColor: colors.primary, 
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface, 
          borderTopColor: colors.border,
          height: 80,
          position: 'absolute',
          borderTopWidth: 1,
          elevation: 4,
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          height: 70,
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Marketplace" component={QuoteMarketplaceScreen} options={{ tabBarLabel: 'MARKETPLACE' }} />
      <Tab.Screen name="RepairOrders" component={RepairOrdersScreen} options={{ tabBarLabel: 'REPAIR QUEUE' }} />
      <Tab.Screen name="Messages" component={ProviderMessagingScreen} options={{ tabBarLabel: 'MESSENGER' }} />
      <Tab.Screen name="Profile" component={ProfileStack} />
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