import { auth, firestore } from './firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';

export interface Vehicle {
  id: string;
  vehicleName: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  miles: number;
  image?: string;
  lastService?: string;
  nextService?: string;
  status?: 'optimal' | 'attention' | 'critical';
}

export async function addVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  const vehicleWithId = {
    ...vehicle,
    id: crypto.randomUUID(),
    status: 'optimal',
    lastService: 'Not serviced yet',
    nextService: 'Schedule service',
  };

  const userRef = doc(firestore, 'users', user.uid);
  await updateDoc(userRef, {
    vehicles: arrayUnion(vehicleWithId)
  });
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  const userRef = doc(firestore, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();

  if (!userData?.vehicles) return;

  const vehicleToDelete = userData.vehicles.find((v: Vehicle) => v.id === vehicleId);
  if (!vehicleToDelete) return;

  await updateDoc(userRef, {
    vehicles: arrayRemove(vehicleToDelete)
  });
}

export async function getUserVehicles(): Promise<Vehicle[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  const userRef = doc(firestore, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();

  return userData?.vehicles || [];
}