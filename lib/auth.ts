import { auth, firestore } from './firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  createdAt: string;
}

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const userDoc = await getDoc(doc(firestore, 'users', user.uid));
  if (!userDoc.exists()) return null;

  return {
    id: user.uid,
    ...userDoc.data() as Omit<UserProfile, 'id'>
  };
};

export const logout = async () => {
  try {
    await signOut(auth);
    // Force clear any cached navigation state
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};