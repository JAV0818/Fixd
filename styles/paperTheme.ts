import { MD3LightTheme } from 'react-native-paper';
import { colors } from './theme';

/**
 * Custom React Native Paper theme that matches our existing design system
 * Maps our color tokens to Paper's Material Design 3 theme structure
 */
export const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors
    primary: colors.primary, // #5B57F5
    primaryContainer: colors.primaryLight, // rgba(91, 87, 245, 0.1)
    onPrimary: '#FFFFFF',
    onPrimaryContainer: colors.primary,
    
    // Secondary/Accent colors
    secondary: colors.accent, // #5B57F5
    secondaryContainer: colors.primaryLight,
    onSecondary: '#FFFFFF',
    onSecondaryContainer: colors.primary,
    
    // Background colors
    background: colors.background, // #E8E9F3
    onBackground: colors.textPrimary, // #14142B
    
    // Surface colors
    surface: colors.surface, // #FFFFFF
    surfaceVariant: colors.surfaceAlt, // #F7F7FC
    onSurface: colors.textPrimary, // #14142B
    onSurfaceVariant: colors.textSecondary, // #4E4B66
    
    // Error/Danger colors
    error: colors.danger, // #EF4444
    errorContainer: colors.dangerLight, // #FFF0F0
    onError: '#FFFFFF',
    onErrorContainer: colors.danger,
    
    // Success colors (using tertiary for success)
    tertiary: colors.success, // #34C759
    tertiaryContainer: colors.successLight, // #F0FFF4
    onTertiary: '#FFFFFF',
    onTertiaryContainer: colors.success,
    
    // Outline/Border colors
    outline: colors.border, // #D9DBE9
    outlineVariant: colors.border,
    
    // Shadow
    shadow: '#000000',
    scrim: '#000000',
    
    // Inverse colors (for dark mode if needed later)
    inverseSurface: colors.textPrimary,
    inverseOnSurface: colors.surface,
    inversePrimary: colors.primary,
    
    // Surface dim/bright (for elevation)
    surfaceDim: colors.surfaceAlt,
    surfaceBright: colors.surface,
  },
  // Customize spacing/typography if needed
  roundness: 12, // Match your radius.md (8) or lg (12)
};

export type CustomTheme = typeof customLightTheme;

