import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, firestore } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail as firebaseUpdateEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

export default function UpdateEmailScreen() {
  const navigation = useNavigation();
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateEmail = async () => {
    setError(null);
    if (!newEmail || !confirmEmail || !currentPassword) {
      setError('All fields are required.');
      return;
    }
    if (newEmail !== confirmEmail) {
      setError('New emails do not match.');
      return;
    }
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    const user = auth.currentUser;
    if (!user || !user.email) {
      setError('User not authenticated or email missing.');
      setIsLoading(false);
      return;
    }

    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // If re-authentication is successful, update email in Firebase Auth
      await firebaseUpdateEmail(user, newEmail);

      // Update email in Firestore (if you store it there)
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, { email: newEmail });

      Alert.alert('Success', 'Your email has been updated. Please check your new email for a verification link if applicable.');
      navigation.goBack();

    } catch (err: any) {
      console.error("Error updating email:", err);
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use by another account.');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('This operation is sensitive and requires recent authentication. Please log out and log back in before updating your email.');
      } else {
        setError(err.message || 'Failed to update email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <Text style={styles.title}>UPDATE EMAIL</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.instructions}>
          Enter your new email address and confirm your current password to make changes.
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Email Address</Text>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#7A89FF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Enter new email"
              placeholderTextColor="#7A89FF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Email Address</Text>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#7A89FF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={confirmEmail}
              onChangeText={setConfirmEmail}
              placeholder="Confirm new email"
              placeholderTextColor="#7A89FF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputContainer}>
            {/* Using a generic icon for password for now */}
            <Mail size={20} color="#7A89FF" style={styles.inputIcon} /> 
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor="#7A89FF"
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
        </View>

        <Pressable 
          style={[styles.saveButton, isLoading && styles.disabledButton]}
          onPress={handleUpdateEmail}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#0A0F1E" />
          ) : (
            <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// Add ScrollView import if not already present at the top
import { ScrollView } from 'react-native-gesture-handler'; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  contentContainer: {
    padding: 24,
    flexGrow: 1,
  },
  instructions: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#A0AFFF',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3555',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#00F0FF',
  },
  saveButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00F0FF',
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  errorText: {
    color: '#FF3D71',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
}); 