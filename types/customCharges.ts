// Fixd/types/customCharges.ts

// UserProfile type
export interface UserProfile {
  id: string;
  displayName?: string;
  email?: string;
  role?: 'customer' | 'provider'; // You might eventually deprecate this if isAdmin is the primary role indicator
  firstName?: string;
  lastName?: string;
  phone?: string;
  isAdmin?: boolean; // Added
  // fcmToken?: string; // Will be needed later for notifications
}

// CustomCharge type
export interface CustomCharge {
  id?: string;
  mechanicId: string;
  mechanicName: string;
  customerId: string;
  customerName: string;
  description: string;
  price: number;
  status: 'PendingApproval' | 'ApprovedAndPendingPayment' | 'Paid' | 'DeclinedByCustomer' | 'CancelledByMechanic';
  createdAt: any; // Should be Firestore Timestamp, consider importing firebase type if used elsewhere
  updatedAt: any; // Should be Firestore Timestamp
  paymentIntentId?: string;
} 