import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Mail, Lock, User, Phone } from 'lucide-react-native';

import { auth, firestore } from '@/lib/firebase';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { colors, spacing, radius, typography } from '@/styles/theme';

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
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>First name<Text style={styles.requiredStar}> *</Text></Text>
                <View style={styles.inputContainer}>
                  <User size={18} color={colors.textTertiary} />
                  <TextInput
                    style={styles.input}
                    placeholder="First name"
                    placeholderTextColor={colors.textLight}
                    value={formData.firstName}
                    onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                    selectionColor={colors.primary}
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Last name<Text style={styles.requiredStar}> *</Text></Text>
                <View style={styles.inputContainer}>
                  <User size={18} color={colors.textTertiary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Last name"
                    placeholderTextColor={colors.textLight}
                    value={formData.lastName}
                    onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                    selectionColor={colors.primary}
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>
              </View>
            </View>

            <Text style={styles.label}>Email<Text style={styles.requiredStar}> *</Text></Text>
            <View style={styles.inputContainer}>
              <Mail size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textLight}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                autoCapitalize="none"
                keyboardType="email-address"
                selectionColor={colors.primary}
                autoCorrect={false}
                spellCheck={false}
              />
            </View>

            <Text style={styles.label}>Phone number<Text style={styles.requiredStar}> *</Text></Text>
            <View style={styles.inputContainer}>
              <Phone size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={colors.textLight}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                selectionColor={colors.primary}
                autoCorrect={false}
                spellCheck={false}
              />
            </View>

            <Text style={styles.label}>Password<Text style={styles.requiredStar}> *</Text></Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textLight}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
                selectionColor={colors.primary}
                autoCorrect={false}
                spellCheck={false}
              />
            </View>

            <Text style={styles.label}>Confirm password<Text style={styles.requiredStar}> *</Text></Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={colors.textLight}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry
                selectionColor={colors.primary}
                autoCorrect={false}
                spellCheck={false}
              />
            </View>

            <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignup} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Create account'}</Text>
            </Pressable>
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
    gap: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 52,
  },
  input: {
    flex: 1,
    height: 48,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    marginLeft: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  requiredStar: {
    color: colors.danger,
  },
  button: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
}); 