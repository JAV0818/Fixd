import { auth, firestore } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  createdAt: string;
  servicesRequested: number;
  averageRating: number;
  ratingGiven: number;
  vehicles: any[];
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  const userRef = doc(firestore, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return null;
  
  return userDoc.data() as UserProfile;
}