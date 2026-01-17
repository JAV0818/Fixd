# React Native Paper Implementation Roadmap

## Overview

This roadmap outlines the step-by-step process for integrating React Native Paper into the Fixd application. React Native Paper provides a Material Design component library with a robust theming system, similar to MUI.

## Goals

- ✅ Centralized theme system (like MUI's `useTheme()`)
- ✅ Reusable, consistent components (Button, Card, Input, etc.)
- ✅ Reduce duplicate styling code across screens
- ✅ Maintain current design language through theme customization
- ✅ Improve developer experience and code maintainability

## Phase 1: Setup & Installation

### Step 1.1: Install Dependencies

```bash
npm install react-native-paper react-native-vector-icons
```

**Note:** `react-native-vector-icons` is required for icons in Paper components.

### Step 1.2: Configure Icons (iOS)

Add to `ios/Podfile`:
```ruby
pod 'RNVectorIcons', :path => '../node_modules/react-native-vector-icons'
```

Then run:
```bash
cd ios && pod install
```

### Step 1.3: Configure Icons (Android)

Add to `android/app/build.gradle`:
```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

## Phase 2: Theme Customization

### Step 2.1: Create Custom Theme File

**File:** `styles/paperTheme.ts`

Create a custom theme that matches your existing design system:

```typescript
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { colors } from './theme';

export const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Map your existing colors
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.accent,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceAlt,
    error: colors.danger,
    errorContainer: colors.dangerLight,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: colors.textPrimary,
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
    outlineVariant: colors.border,
  },
};

// Optional: Create dark theme for future use
export const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    // Dark theme colors here
  },
};
```

### Step 2.2: Create Theme Provider Wrapper

**File:** `contexts/PaperThemeProvider.tsx`

```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { PaperProvider, useTheme as usePaperTheme } from 'react-native-paper';
import { customLightTheme } from '@/styles/paperTheme';

interface PaperThemeContextType {
  theme: typeof customLightTheme;
}

const PaperThemeContext = createContext<PaperThemeContextType | undefined>(undefined);

export function PaperThemeProvider({ children }: { children: ReactNode }) {
  return (
    <PaperProvider theme={customLightTheme}>
      {children}
    </PaperProvider>
  );
}

export function usePaperThemeContext() {
  const context = useContext(PaperThemeContext);
  if (!context) {
    throw new Error('usePaperThemeContext must be used within PaperThemeProvider');
  }
  return context;
}

// Re-export useTheme from Paper for convenience
export { useTheme } from 'react-native-paper';
```

### Step 2.3: Integrate Theme Provider

**File:** `App.tsx`

Wrap your app with `PaperThemeProvider`:

```typescript
import { PaperThemeProvider } from './contexts/PaperThemeProvider';

export default function App() {
  // ... existing code ...

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperThemeProvider>
          <CartProvider>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="light" />
            </NavigationContainer>
          </CartProvider>
        </PaperThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

## Phase 3: Component Migration Strategy

### Migration Priority Order

1. **Buttons** (High Impact, Low Risk)
2. **Cards** (High Impact, Medium Risk)
3. **TextInputs** (High Impact, Medium Risk)
4. **Dialogs/Modals** (Medium Impact, Low Risk)
5. **Chips/Tags** (Low Impact, Low Risk)
6. **Lists** (Medium Impact, Medium Risk)
7. **Other Components** (As needed)

### Step 3.1: Create Wrapper Components

Create wrapper components that match your current API but use Paper internally:

**File:** `components/ui/ThemedButton.tsx`

```typescript
import React from 'react';
import { Button, ButtonProps } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

interface ThemedButtonProps extends Omit<ButtonProps, 'mode'> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'text';
}

export function ThemedButton({ 
  variant = 'primary', 
  ...props 
}: ThemedButtonProps) {
  const theme = useTheme();
  
  const mode = variant === 'outlined' ? 'outlined' 
    : variant === 'text' ? 'text'
    : 'contained';
  
  return (
    <Button 
      mode={mode}
      buttonColor={variant === 'primary' ? theme.colors.primary : undefined}
      textColor={variant === 'secondary' ? theme.colors.primary : undefined}
      {...props}
    />
  );
}
```

**File:** `components/ui/ThemedCard.tsx`

```typescript
import React from 'react';
import { Card, CardProps } from 'react-native-paper';

export function ThemedCard({ children, ...props }: CardProps) {
  return (
    <Card style={{ marginBottom: 16 }} {...props}>
      <Card.Content>
        {children}
      </Card.Content>
    </Card>
  );
}
```

### Step 3.2: Migration Checklist Template

For each screen/component:

- [ ] Identify components to migrate
- [ ] Create wrapper component if needed
- [ ] Replace local styles with Paper components
- [ ] Test functionality
- [ ] Test styling/appearance
- [ ] Remove unused local styles
- [ ] Update imports

## Phase 4: Component-by-Component Migration

### 4.1: Buttons

**Before:**
```tsx
<Pressable style={styles.button}>
  <Text style={styles.buttonText}>Click me</Text>
</Pressable>
```

**After:**
```tsx
import { Button } from 'react-native-paper';

<Button mode="contained" onPress={handlePress}>
  Click me
</Button>
```

**Screens to migrate:**
- [ ] `screens/customer/OrdersScreen.tsx`
- [ ] `screens/provider/RepairOrdersScreen.tsx`
- [ ] `screens/customer/CustomerQuotesScreen.tsx`
- [ ] All other screens with buttons

### 4.2: Cards

**Before:**
```tsx
<View style={styles.card}>
  <Text style={styles.cardTitle}>Title</Text>
</View>
```

**After:**
```tsx
import { Card, Card.Title } from 'react-native-paper';

<Card>
  <Card.Title title="Title" />
  <Card.Content>
    {/* Content */}
  </Card.Content>
</Card>
```

**Screens to migrate:**
- [ ] Order cards
- [ ] Quote cards
- [ ] Service cards

### 4.3: TextInputs

**Before:**
```tsx
<TextInput 
  style={styles.input}
  placeholder="Enter text"
/>
```

**After:**
```tsx
import { TextInput } from 'react-native-paper';

<TextInput
  mode="outlined"
  label="Enter text"
  value={value}
  onChangeText={setValue}
/>
```

**Screens to migrate:**
- [ ] Login/Signup screens
- [ ] Form screens
- [ ] Search inputs

### 4.4: Dialogs/Modals

**Before:**
```tsx
<Modal visible={visible}>
  <View style={styles.modal}>
    {/* Content */}
  </View>
</Modal>
```

**After:**
```tsx
import { Dialog, Dialog.Title, Dialog.Content, Dialog.Actions } from 'react-native-paper';

<Dialog visible={visible} onDismiss={onDismiss}>
  <Dialog.Title>Title</Dialog.Title>
  <Dialog.Content>
    {/* Content */}
  </Dialog.Content>
  <Dialog.Actions>
    <Button onPress={onDismiss}>Cancel</Button>
    <Button onPress={onConfirm}>Confirm</Button>
  </Dialog.Actions>
</Dialog>
```

## Phase 5: Advanced Features

### Step 5.1: Snackbar (Toast Notifications)

Replace custom toast implementations:

```tsx
import { Snackbar } from 'react-native-paper';

<Snackbar
  visible={snackbarVisible}
  onDismiss={() => setSnackbarVisible(false)}
  duration={3000}
>
  Message here
</Snackbar>
```

### Step 5.2: Chips/Tags

For filter pills and tags:

```tsx
import { Chip } from 'react-native-paper';

<Chip 
  selected={isSelected}
  onPress={handlePress}
>
  Filter Name
</Chip>
```

### Step 5.3: Lists

For order lists and other lists:

```tsx
import { List } from 'react-native-paper';

<List.Item
  title="Item Title"
  description="Item description"
  left={props => <List.Icon {...props} icon="folder" />}
  right={props => <List.Icon {...props} icon="chevron-right" />}
/>
```

## Phase 6: Cleanup & Optimization

### Step 6.1: Remove Unused Styles

After migrating components:
- [ ] Remove unused StyleSheet definitions
- [ ] Remove duplicate color constants
- [ ] Clean up unused theme imports

### Step 6.2: Update Theme File

Keep `styles/theme.ts` for:
- Custom spacing/radius values not in Paper
- Custom typography if needed
- Legacy support during migration

### Step 6.3: Documentation

- [ ] Update component documentation
- [ ] Create component usage examples
- [ ] Document theme customization

## Phase 7: Testing & Validation

### Testing Checklist

- [ ] All screens render correctly
- [ ] Theme colors match design
- [ ] Components respond to theme changes
- [ ] Dark mode works (if implemented)
- [ ] Performance is acceptable
- [ ] Bundle size impact is acceptable
- [ ] No visual regressions

### Performance Testing

```bash
# Check bundle size before/after
npx react-native-bundle-visualizer
```

## Timeline Estimate

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Setup | 1-2 hours | High |
| Phase 2: Theme | 2-3 hours | High |
| Phase 3: Strategy | 1 hour | Medium |
| Phase 4: Migration | 2-3 days | High |
| Phase 5: Advanced | 1-2 days | Low |
| Phase 6: Cleanup | 1 day | Medium |
| Phase 7: Testing | 1 day | High |

**Total Estimated Time:** 5-7 days

## Migration Best Practices

### 1. Gradual Migration
- Don't migrate everything at once
- Migrate one screen/component type at a time
- Test thoroughly after each migration

### 2. Keep Existing Theme
- Maintain `styles/theme.ts` during migration
- Use Paper theme for new components
- Gradually phase out old theme usage

### 3. Create Wrapper Components
- Create wrappers that match your current API
- Makes migration easier
- Allows gradual refactoring

### 4. Test Thoroughly
- Visual regression testing
- Functionality testing
- Performance testing

### 5. Document Changes
- Document new component usage
- Update style guide
- Create migration examples

## Common Issues & Solutions

### Issue: Icons not showing
**Solution:** Ensure `react-native-vector-icons` is properly configured

### Issue: Theme colors not matching
**Solution:** Double-check color mapping in `paperTheme.ts`

### Issue: Bundle size too large
**Solution:** Use tree-shaking, only import what you need

### Issue: Performance issues
**Solution:** Use `React.memo` for expensive components, optimize re-renders

## Resources

- [React Native Paper Docs](https://callstack.github.io/react-native-paper/)
- [Material Design 3](https://m3.material.io/)
- [Paper Theme Customization](https://callstack.github.io/react-native-paper/docs/guides/theming/)

## Next Steps

1. Review this roadmap
2. Install React Native Paper
3. Set up custom theme
4. Start with Button migration
5. Gradually migrate other components

---

**Last Updated:** [Current Date]
**Status:** Planning Phase

