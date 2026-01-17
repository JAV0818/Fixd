import React, { ReactNode } from 'react';
import { PaperProvider } from 'react-native-paper';
import { customLightTheme } from '@/styles/paperTheme';

/**
 * PaperThemeProvider wraps the app with React Native Paper's theme provider
 * This makes the theme available throughout the app via useTheme() hook
 */
export function PaperThemeProvider({ children }: { children: ReactNode }) {
  return (
    <PaperProvider theme={customLightTheme}>
      {children}
    </PaperProvider>
  );
}

// Re-export useTheme from Paper for convenience
export { useTheme } from 'react-native-paper';

