import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Mail, Lock, User, Phone } from 'lucide-react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';

import { auth, firestore } from '@/lib/firebase';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { colors, spacing, radius, typography } from '@/styles/theme';
import { ThemedButton } from '@/components/ui/ThemedButton';

export default function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // Validate form data
    if (Object.values(formData).some(value => !value)) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Create user profile in Firestore with a default customer role
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: 'customer',
        createdAt: serverTimestamp(),
      }, { merge: true });

      // Redirect to customer dashboard
      // TODO: Replace with React Navigation
      // router.replace('/(customer)');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already registered');
      } else {
        setError('Failed to create account. Please try again.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.pretitle}>Create account</Text>
            <Text style={styles.title}>Join Fixd</Text>
            <Text style={styles.subtitle}>Set up your profile to get started.</Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            <View style={styles.inputRow}>
              <View style={{ flex: 1, marginRight: spacing.xs }}>
                <PaperTextInput
                  label="First name"
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  mode="outlined"
                  left={<PaperTextInput.Icon icon="account" />}
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.xs }}>
                <PaperTextInput
                  label="Last name"
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                  mode="outlined"
                  left={<PaperTextInput.Icon icon="account" />}
                  style={styles.input}
                />
              </View>
            </View>

            <PaperTextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              left={<PaperTextInput.Icon icon="email" />}
              style={styles.input}
            />

            <PaperTextInput
              label="Phone number"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              mode="outlined"
              keyboardType="phone-pad"
              left={<PaperTextInput.Icon icon="phone" />}
              style={styles.input}
            />

            <PaperTextInput
              label="Password"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              mode="outlined"
              secureTextEntry
              left={<PaperTextInput.Icon icon="lock" />}
              style={styles.input}
            />

            <PaperTextInput
              label="Confirm password"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              mode="outlined"
              secureTextEntry
              left={<PaperTextInput.Icon icon="lock" />}
              style={styles.input}
            />

            <ThemedButton
              variant="primary"
              onPress={handleSignup}
              disabled={loading}
              loading={loading}
              style={styles.button}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </ThemedButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  pretitle: {
    ...typography.caption,
    color: colors.textLight,
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.body,
  },
  formContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: spacing.md,
  },
  errorContainer: {
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: spacing.sm,
  },
}); 