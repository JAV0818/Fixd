// Centralized theme tokens and common styles for the application UI
import { StyleSheet } from 'react-native';

export const colors = {
  background: '#0A0F1E',
  surface: 'rgba(26, 33, 56, 1)',
  surfaceAlt: 'rgba(42, 53, 85, 0.5)',
  border: '#2A3555',
  textPrimary: '#FFFFFF',
  textSecondary: '#7A89FF',
  accent: '#00F0FF',
  danger: '#FF3D71',
  success: '#34C759',
  warning: '#FFB800',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 20,
};

export const typography = {
  h1: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: 2, color: colors.accent },
  h2: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: 2, color: colors.accent },
  title: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  body: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textPrimary },
  caption: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary },
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.accent,
    marginTop: spacing.lg,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.danger,
    marginTop: spacing.lg,
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  listFooter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.accent,
    marginBottom: spacing.sm,
    letterSpacing: 2,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export type Theme = {
  colors: typeof colors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  globalStyles: typeof globalStyles;
};

export const theme: Theme = { colors, spacing, radius, typography, globalStyles };

export default theme;

// Reusable component-level style fragments
export const componentStyles = StyleSheet.create({
  tealButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(0, 240, 255, 0.1)'
  },
  tealIconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(0, 240, 255, 0.1)'
  },
  tealButtonPressed: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
  },
  tealButtonDisabled: {
    opacity: 0.5,
  },
  tealButtonText: {
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold'
  },
  pagerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingTop: spacing.md,
  },
  pagerLabel: {
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  }
});


