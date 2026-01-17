import React from 'react';
import { Card, CardProps } from 'react-native-paper';
import { StyleSheet, ViewStyle } from 'react-native';

interface ThemedCardProps extends CardProps {
  children: React.ReactNode;
  marginBottom?: number;
}

/**
 * Themed Card component using React Native Paper
 * Replaces local card styles with consistent Paper cards
 */
export function ThemedCard({ 
  children, 
  marginBottom = 16,
  style,
  ...props 
}: ThemedCardProps) {
  return (
    <Card 
      style={[
        styles.card,
        { marginBottom },
        style,
      ]}
      {...props}
    >
      <Card.Content>
        {children}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    elevation: 2,
  } as ViewStyle,
});

