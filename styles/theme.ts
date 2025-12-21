// Centralized theme tokens and common styles for the application UI
import { StyleSheet } from 'react-native';

export const colors = {
  // New modern light theme colors
  background: '#E8E9F3',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F7FC',
  border: '#D9DBE9',
  
  // Text colors
  textPrimary: '#14142B',
  textSecondary: '#4E4B66',
  textTertiary: '#6E7191',
  textLight: '#A0A3BD',
  
  // Primary/Accent colors
  primary: '#5B57F5',
  primaryLight: 'rgba(91, 87, 245, 0.1)',
  accent: '#5B57F5',
  
  // Status colors
  danger: '#EF4444',
  dangerLight: '#FFF0F0',
  success: '#34C759',
  successLight: '#F0FFF4',
  warning: '#FFB800',
  warningLight: '#FFF9E6',
  
  // Legacy support (for gradual migration)
  teal: '#00F0FF',
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
  h1: { fontSize: 32, fontFamily: 'Inter_700Bold', lineHeight: 40, color: colors.textPrimary },
  h2: { fontSize: 24, fontFamily: 'Inter_700Bold', lineHeight: 32, color: colors.textPrimary },
  h3: { fontSize: 20, fontFamily: 'Inter_600SemiBold', lineHeight: 28, color: colors.textPrimary },
  title: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  body: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 20 },
  bodyLarge: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.textSecondary, lineHeight: 22 },
  caption: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textTertiary },
  small: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textLight },
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
    marginTop: spacing.lg,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.danger,
    marginTop: spacing.lg,
  },
  listContainer: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  listFooter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
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
  // Modern Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  
  // Modern Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  
  secondaryButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  
  // Input Fields
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  
  // Pills/Chips
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  
  // Toggle Switch
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
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
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  
  // Legacy teal buttons (for backward compatibility during migration)
  tealButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tealIconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  tealButtonPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  tealButtonDisabled: {
    opacity: 0.5,
  },
  tealButtonText: {
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
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
    color: colors.textTertiary,
    fontFamily: 'Inter_500Medium',
  },
});


