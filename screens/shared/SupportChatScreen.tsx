import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SupportChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Chat feature is temporarily disabled.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0F1E',
  },
  text: {
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
});