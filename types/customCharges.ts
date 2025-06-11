// Fixd/types/customCharges.ts
import { Timestamp } from 'firebase/firestore';
import { LocationDetails, OrderItem } from './orders'; // Import LocationDetails and OrderItem

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
  id: string;
  mechanicId: string;
  mechanicName: string;
  customerId: string;
  customerName: string;
  items: OrderItem[]; // Replaces single description
  totalPrice: number; // Replaces single price
  status: 'PendingApproval' | 'ApprovedAndPendingPayment' | 'Paid' | 'DeclinedByCustomer' | 'CancelledByMechanic' | 'Accepted';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  scheduledAt?: Timestamp; // Added for optional appointment time
  paymentIntentId?: string;
  linkedRepairOrderId?: string;
  locationDetails?: LocationDetails;
  vehicleDisplay?: string; // Optional: To show which vehicle this is for
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