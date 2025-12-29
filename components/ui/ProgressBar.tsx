import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1 (percentage)
  label?: string;
  showPercentage?: boolean;
  height?: number;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  percentageStyle?: TextStyle;
  gradientColors?: [string, string] | [string, string, ...string[]];
  backgroundColor?: string;
  animated?: boolean;
  animationDuration?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  height = 8,
  containerStyle,
  labelStyle,
  percentageStyle,
  gradientColors = ['#7B77FF', '#5B57F5'] as [string, string],
  backgroundColor = colors.border,
  animated = true,
  animationDuration = 800,
}) => {
  // Validate progress is between 0 and 1
  const validProgress = Math.min(Math.max(progress, 0), 1);
  
  // Animation value for the progress width
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: validProgress,
        duration: animationDuration,
        useNativeDriver: false, // We need to animate width which is not supported by native driver
      }).start();
    } else {
      progressAnim.setValue(validProgress);
    }
  }, [validProgress, animated, animationDuration]);
  
  // Calculate the width as a percentage
  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp'
  });
  
  // Calculate the percentage text
  const percentage = `${Math.round(validProgress * 100)}%`;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      
      <View style={[styles.progressContainer, { height }, { backgroundColor }]}>
        <Animated.View style={{ width: widthInterpolated, height: '100%' }}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressBar}
          />
        </Animated.View>
      </View>
      
      {showPercentage && <Text style={[styles.percentage, percentageStyle]}>{percentage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textTertiary,
    marginBottom: 4,
  },
  progressContainer: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 8,
  },
  percentage: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
    marginTop: 4,
    textAlign: 'right',
  },
});

export default ProgressBar; 