import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/styles/theme';

interface TabConfig {
  routeName: string;
  icon: React.ElementType;
  label: string;
}

interface CustomTabBarProps extends BottomTabBarProps {
  tabConfig?: TabConfig[];
}

export function CustomTabBar({ state, descriptors, navigation, tabConfig }: CustomTabBarProps) {
  return (
    <View style={styles.tabbar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Get icon from tabConfig or use default logic
        let IconComponent;
        if (tabConfig) {
          const config = tabConfig.find(c => c.routeName === route.name);
          IconComponent = config?.icon;
        }

        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
          ? options.title
          : route.name;

        return (
          <TouchableOpacity
            key={route.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabbarItem}
          >
            {IconComponent && (
              <IconComponent 
                size={24} 
                color={isFocused ? colors.primary : colors.textLight} 
              />
            )}
            {typeof label === 'string' && (
              <Text style={[styles.tabbarLabel, { color: isFocused ? colors.primary : colors.textLight }]}>
                {label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 85,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 12,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabbarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabbarLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

