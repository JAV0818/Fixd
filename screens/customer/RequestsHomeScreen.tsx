import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRequestsContext } from '@/contexts/RequestsContext';
import { colors } from '@/styles/theme';
import CustomQuoteRequestForm from './CustomQuoteRequestForm';
import CustomerQuotesView from './CustomerQuotesView';

export default function RequestsHomeScreen() {
  const { activeMode, setActiveMode } = useRequestsContext();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Header with Toggle */}
        <View style={styles.header}>
          <Text style={styles.title}>Get help now,{'\n'}book a service</Text>
        </View>

        {/* Toggle Selector */}
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleButton, activeMode === 'request' && styles.toggleButtonActive]}
            onPress={() => setActiveMode('request')}
          >
            <Text style={[styles.toggleText, activeMode === 'request' && styles.toggleTextActive]}>
              Request Quote
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, activeMode === 'view' && styles.toggleButtonActive]}
            onPress={() => setActiveMode('view')}
          >
            <Text style={[styles.toggleText, activeMode === 'view' && styles.toggleTextActive]}>
              View My Quotes
            </Text>
          </Pressable>
        </View>

        {/* Conditional Content */}
        {activeMode === 'request' ? (
          <CustomQuoteRequestForm />
        ) : (
          <CustomerQuotesView />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E9F3',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    color: '#14142B',
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    lineHeight: 40,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#5B57F5',
  },
  toggleText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#4E4B66',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
});

