import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, User, Activity } from 'lucide-react-native';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// --- Import the actual screen components ---
// TODO: Adjust paths if files are moved/renamed later
import HomeScreen from '../screens/customer/HomeScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import OrdersScreen from '../screens/customer/OrdersScreen';
import CustomChargeDetailScreen from '../screens/customer/CustomChargeDetailScreen';

export type CustomerTabParamList = {
  Services: undefined;
  Orders: undefined;
  Profile: undefined;
};

// Added: StackParamList for screens within the "Services" tab
export type HomeStackParamList = {
  Home: undefined; // For HomeScreen
  CustomChargeDetail: { customChargeId: string };
  // Add other screens navigable from Home here
};

const Tab = createBottomTabNavigator<CustomerTabParamList>();
const Stack = createNativeStackNavigator<HomeStackParamList>();

// Added: StackNavigator for the "Services" tab
function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="CustomChargeDetail" component={CustomChargeDetailScreen} />
    </Stack.Navigator>
  );
}

// Generic glowing icon component
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

// TODO: Customize Tab Bar Appearance (icons, colors, etc.)
export default function CustomerNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Services"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Services') {
            return <GlowingIcon Icon={Home} color={color} size={size} focused={focused} />;
          } 
          else if (route.name === 'Orders') {
            return <GlowingIcon Icon={Activity} color={color} size={size} focused={focused} />;
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
        },
        tabBarItemStyle: {
          height: 60, // Apply to all tabs
        }
      })}
    >
      <Tab.Screen name="Services" component={HomeStackNavigator} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarLabel: 'Orders' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
  },
  focusedGlowContainer: {
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
}); 