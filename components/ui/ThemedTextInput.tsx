import React from 'react';
import { TextInput, TextInputProps } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

interface ThemedTextInputProps extends Omit<TextInputProps, 'mode'> {
  variant?: 'outlined' | 'flat';
}

/**
 * Themed TextInput component using React Native Paper
 * Replaces local input styles with consistent Paper inputs
 */
export function ThemedTextInput({ 
  variant = 'outlined',
  ...props 
}: ThemedTextInputProps) {
  const theme = useTheme();
  
  return (
    <TextInput
      mode={variant}
      {...props}
      style={[
        { backgroundColor: variant === 'flat' ? theme.colors.surface : 'transparent' },
        props.style,
      ]}
    />
  );
}

