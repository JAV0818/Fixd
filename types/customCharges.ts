// Fixd/types/customCharges.ts
import { LocationDetails } from './orders'; // Import LocationDetails

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
  status: 'PendingApproval' | 'ApprovedAndPendingPayment' | 'Paid' | 'DeclinedByCustomer' | 'CancelledByMechanic' | 'Accepted';
  createdAt: any; // Should be Firestore Timestamp, consider importing firebase type if used elsewhere
  updatedAt: any; // Should be Firestore Timestamp
  paymentIntentId?: string;
  linkedRepairOrderId?: string;
  locationDetails?: LocationDetails;
}

// We need LocationDetails type here as well, or import it if it's in a shared types file.
// Assuming LocationDetails is defined in './orders' or a common types file, if not, define it here.
// For now, let's assume it will be imported or is available globally if not already.
// If not, we would add: 
// export interface LocationDetails {
//   address: string;
//   city: string;
//   state: string;
//   zipCode: string;
//   phoneNumber?: string;
//   additionalNotes?: string;
// } 