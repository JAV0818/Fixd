import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '@/styles/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>Fixd</Text>
        <Text style={styles.title}>Loading your experience</Text>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  brand: {
    ...typography.bodyLarge,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
  },
});

