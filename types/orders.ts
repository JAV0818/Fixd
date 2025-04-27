import { Timestamp } from 'firebase/firestore';

// Type for individual items within an order
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vehicleId?: string; // Optional
  vehicleDisplay?: string; // Optional
}

// Type for location details
export interface LocationDetails {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  additionalNotes?: string;
}

// Type for the Repair Order document
export interface RepairOrder {
  id: string; // Firestore document ID
  customerId: string;
  items: OrderItem[];
  totalPrice: number;
  locationDetails: LocationDetails;
  paymentMethod: 'creditCard' | 'paypal' | null;
  status: 'Pending' | 'Accepted' | 'InProgress' | 'Completed' | 'Cancelled';
  createdAt: Timestamp;
  providerId: string | null;
  // Optional fields that might be added later
  acceptedAt?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  providerNotes?: string;
  customerRating?: number;
  providerRating?: number;
} 