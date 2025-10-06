import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/theme';

export default function ProviderMessagingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.hint}>Provider conversations will appear here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  content: { padding: 16 },
  title: { color: colors.accent, fontFamily: 'Inter_700Bold', fontSize: 22, marginBottom: 8 },
  hint: { color: '#7A89FF' },
});


