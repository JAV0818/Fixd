import { Timestamp } from 'firebase/firestore';

// Type for individual items within an order
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vehicleId?: string | null; // Changed to allow null
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

// Order status type
export type OrderStatus = 'Pending' | 'Claimed' | 'Accepted' | 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'PendingApproval';

// Type for the Repair Order document
export interface RepairOrder {
  id: string; // Firestore document ID
  customerId: string;
  items: OrderItem[];
  totalPrice: number;
  locationDetails: LocationDetails;
  paymentMethod: 'creditCard' | 'paypal' | null;
  status: OrderStatus;
  createdAt: Timestamp;
  providerId: string | null;
  providerName?: string;
  customerName?: string;
  customerPhotoURL?: string;
  
  // Claim system fields
  claimedAt?: Timestamp | null;        // When the order was claimed
  claimExpiresAt?: Timestamp | null;   // When the claim auto-expires (1 hour from claim)
  assignedByAdmin?: boolean;           // True if owner assigned directly
  
  // Additional order fields
  description?: string;
  vehicleInfo?: string;
  categories?: string[];
  mediaUrls?: string[];
  orderType?: 'standard' | 'custom_quote';
  
  // Timestamps
  acceptedAt?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  updatedAt?: Timestamp;
  
  // Notes & Ratings
  providerNotes?: string;
  customerRating?: number;
  providerRating?: number;
} 