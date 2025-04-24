import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  gradientColors = ['#00C2FF', '#0080FF'] as [string, string],
  backgroundColor = 'rgba(42, 53, 85, 0.5)',
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
    color: '#7A89FF',
    marginBottom: 4,
  },
  progressContainer: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginTop: 4,
    textAlign: 'right',
  },
});

export default ProgressBar; 