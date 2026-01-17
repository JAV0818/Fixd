import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Mail, Lock } from 'lucide-react-native';
import { TextInput as PaperTextInput, Card, Button } from 'react-native-paper';

import { auth, firestore } from '@/lib/firebase';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { colors, spacing, radius, typography } from '@/styles/theme';
import { ThemedButton } from '@/components/ui/ThemedButton';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check user role in Firestore
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      const userData = userDoc.data();
      
      // NOTE: No navigation needed here. AppNavigator handles redirection on auth state change.
      // if (userData?.isAdmin) {
        // // TODO: Replace with React Navigation
        // // router.replace('/(provider)');
      // } else {
        // // TODO: Replace with React Navigation
        // // router.replace('/(customer)');
      // }
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop&q=60' }}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.78)', 'rgba(255,255,255,0.9)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.brand}>Fixd</Text>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

            <Card style={styles.card}>
              <Card.Content>
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <PaperTextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  left={<PaperTextInput.Icon icon="email" />}
                  style={styles.input}
                />

                <PaperTextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  secureTextEntry
                  left={<PaperTextInput.Icon icon="lock" />}
                  style={styles.input}
                />

                <ThemedButton
                  variant="primary"
                  onPress={handleLogin}
                  disabled={loading}
                  loading={loading}
                  style={styles.button}
                >
                  {loading ? 'Logging in...' : 'Log in'}
                </ThemedButton>

                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Signup')}
                  style={styles.signupButton}
                  labelStyle={styles.signupText}
                >
                  Don't have an account? <Text style={styles.signupHighlight}>Sign up</Text>
                </Button>
              </Card.Content>
            </Card>
      </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  brand: {
    fontSize: 44,
    lineHeight: 50,
    fontFamily: 'Inter_800ExtraBold',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    borderRadius: radius.xl,
    marginTop: spacing.lg,
  },
  errorContainer: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  signupButton: {
    marginTop: spacing.xs,
  },
  signupText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  signupHighlight: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
}); 