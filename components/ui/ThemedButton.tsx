import React from 'react';
import { Button, ButtonProps } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface ThemedButtonProps extends Omit<ButtonProps, 'mode' | 'loading'> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'text' | 'danger';
  fullWidth?: boolean;
  loading?: boolean;
}

/**
 * Themed Button component using React Native Paper
 * Replaces local button styles with consistent Paper buttons
 */
export function ThemedButton({ 
  variant = 'primary', 
  fullWidth = false,
  loading = false,
  disabled,
  style,
  children,
  ...props 
}: ThemedButtonProps) {
  const theme = useTheme();
  
  const mode = variant === 'outlined' ? 'outlined' 
    : variant === 'text' ? 'text'
    : 'contained';
  
  const buttonColor = variant === 'primary' 
    ? theme.colors.primary
    : variant === 'danger'
    ? theme.colors.error
    : undefined;
  
  const textColor = variant === 'secondary' || variant === 'outlined'
    ? theme.colors.primary
    : variant === 'text'
    ? theme.colors.primary
    : variant === 'danger'
    ? '#FFFFFF'
    : '#FFFFFF';
  
  // Extract iconColor from props if provided, otherwise use textColor for icons
  const iconColor = (props as any).iconColor || textColor;
  
  return (
    <Button 
      mode={mode}
      buttonColor={buttonColor}
      textColor={textColor}
      iconColor={iconColor}
      disabled={disabled || loading}
      loading={loading}
      style={[
        fullWidth && styles.fullWidth,
        style,
      ]}
      contentStyle={styles.contentStyle}
      labelStyle={styles.labelStyle}
      {...props}
    >
      {children}
    </Button>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  contentStyle: {
    paddingVertical: 4,
  },
  labelStyle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
});

