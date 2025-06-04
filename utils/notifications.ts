import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { auth, firestore } from '@/lib/firebase'; // Assuming your firebase config is here
import { doc, updateDoc } from 'firebase/firestore';

// Function to register for push notifications and get the token
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notification permissions not granted!');
    // Optionally, inform the user that they will not receive notifications.
    // Alert.alert('Permissions Required', 'Please enable notifications in settings to receive updates.');
    return undefined;
  }

  try {
    // Important: getExpoPushTokenAsync() should be used for Expo managed projects.
    // It requires a projectId in app.json/app.config.js.
    // Ensure your app.json includes: "extra": { "eas": { "projectId": "YOUR_EAS_PROJECT_ID" } }
    // or if you are not using EAS Build, you might need to configure firebase manually in app.json for notifications.
    const expoPushToken = await Notifications.getExpoPushTokenAsync();
    token = expoPushToken.data;
    console.log('Expo Push Token:', token);
  } catch (e: any) {
    console.error('Failed to get Expo Push Token:', e.message);
    // This can happen if the device is a simulator (for APNS) or if projectId is missing for Expo.
    // Alert.alert('Token Error', `Failed to get push token: ${e.message}`);
    return undefined;
  }

  return token;
}

// Function to save the FCM token to Firestore for the current user
export async function saveTokenToFirestore(token: string): Promise<void> {
  if (!auth.currentUser) {
    console.warn('[NotificationUtils] No user logged in, cannot save FCM token.');
    return;
  }
  if (!token) {
    console.warn('[NotificationUtils] No token provided to save.');
    return;
  }

  try {
    const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
    // IMPORTANT CHANGE: Using updateDoc instead of setDoc.
    // This will fail if the document does not already exist.
    await updateDoc(userDocRef, { fcmToken: token }); 
    console.log('[NotificationUtils] FCM Token updated in Firestore for user:', auth.currentUser.uid);
  } catch (error: any) {
    // Check if the error is because the document doesn't exist
    if (error.code === 'not-found') { // Firestore error code for non-existent document during update
      console.error('[NotificationUtils] Error saving FCM token: User document does not exist. Token not saved. UID:', auth.currentUser.uid, error.message);
      // This confirms the hypothesis that the user document isn't created before FCM save is attempted.
      // The main fix would be in the signup logic to ensure timely document creation.
    } else {
      console.error('[NotificationUtils] Error updating FCM token in Firestore:', error);
    }
  }
}

// Call this function after user logs in or app starts with a logged-in user
export async function setupNotifications(): Promise<void> {
  const token = await registerForPushNotificationsAsync();
  if (token) {
    await saveTokenToFirestore(token);
  }
}

// --- Notification Handler Setup (Call this in App.tsx) ---
export function initializeNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false, // Or true, manage badge count appropriately
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} 