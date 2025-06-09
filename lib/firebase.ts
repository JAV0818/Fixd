    import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
    import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
    // Firebase JS SDK for React-Native exports these helpers from the main auth entry
    // getReactNativePersistence is not typed yet, so we silence TS
    // @ts-ignore
    import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
    import { getFirestore } from 'firebase/firestore';
    import { getStorage } from 'firebase/storage';
    import { getFunctions } from 'firebase/functions';
    import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // Import this

    // Your web app's Firebase configuration
    const firebaseConfig = {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
    };

    // Initialize Firebase only if it hasn't been initialized already
    let app: FirebaseApp;
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }

    // Initialize Firebase services
    const auth = initializeAuth(app, {  // Initialize auth with persistence
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
    const firestore = getFirestore(app);
    const storage = getStorage(app);
    const functions = getFunctions(app);

    // Initialize Analytics only if supported (web-only)
    let analytics: Analytics | null = null;
    if (typeof window !== 'undefined') {
        isSupported().then(supported => {
            if (supported) {
                analytics = getAnalytics(app);
            }
        });
    }

export { app, auth, firestore, storage, functions, analytics };
