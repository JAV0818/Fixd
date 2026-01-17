# Fixd Backend Architecture & Design Document

> **Last Updated:** January 2026  
> **Status:** Planning Phase  
> **Version:** 1.0

---

## Table of Contents
1. [User Roles & Hierarchy](#1-user-roles--hierarchy)
2. [Firestore Collections Schema](#2-firestore-collections-schema)
3. [Order Lifecycle & States](#3-order-lifecycle--states)
4. [Feature Matrix by Role](#4-feature-matrix-by-role)
5. [Payment Flow](#5-payment-flow)
6. [Notifications System](#6-notifications-system)
7. [Security Rules Overview](#7-security-rules-overview)
8. [Cloud Functions Required](#8-cloud-functions-required)
9. [Storage Structure](#9-storage-structure)
10. [API Integrations](#10-api-integrations)

---

## 1. User Roles & Hierarchy

### Role Definitions

| Role | Description | Access Level |
|------|-------------|--------------|
| **Customer** | End users who request vehicle services | Limited to own data |
| **Mechanic** (Provider) | Service providers who fulfill orders | Access to assigned/available orders |
| **Owner** | Platform owner with full administrative control | Full system access |

### Role Hierarchy
```
Owner (Super Admin)
    ├── Can manage all mechanics
    ├── Can assign orders to mechanics
    ├── Can view all earnings/analytics
    └── Has all mechanic capabilities

Mechanic (Provider)
    ├── Can accept/decline orders
    ├── Can create custom quotes
    ├── Can communicate with customers
    └── Cannot modify other mechanics' data

Customer
    ├── Can create orders
    ├── Can accept/decline quotes
    └── Cannot access other customers' data
```

---

## 2. Firestore Collections Schema

### 2.1 `users` Collection

```javascript
users/{userId}
{
  // Identity
  email: string,
  firstName: string | null,
  lastName: string | null,
  phone: string | null,
  photoUrl: string | null,
  
  // Role & Status
  role: "customer" | "provider" | "owner",
  isActive: boolean,                    // Account enabled/disabled
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLoginAt: Timestamp,
  
  // Customer-specific fields
  completedOrdersCount: number,         // Incremented on order completion
  averageRating: number | null,         // Average rating received (1-5)
  totalRatingsCount: number,
  
  // Mechanic-specific fields (when role === "provider")
  providerProfile: {
    bio: string,
    specialties: string[],              // e.g., ["Oil Change", "Brake Service"]
    yearsExperience: number,
    certifications: string[],
    serviceRadius: number,              // miles
    isAvailable: boolean,               // Toggle availability
    averageRating: number,
    totalJobsCompleted: number,
    totalEarnings: number,              // Lifetime earnings
  } | null,
  
  // Settings & Preferences
  notificationPreferences: {
    pushEnabled: boolean,
    emailEnabled: boolean,
    smsEnabled: boolean,
  },
  
  // FCM Token for push notifications
  fcmToken: string | null,
}
```

### 2.2 `repair-orders` Collection

```javascript
repair-orders/{orderId}
{
  // Order Identity
  orderType: "standard" | "custom_quote",
  status: OrderStatus,                  // See Order States below
  
  // Parties
  customerId: string,                   // User ID of customer
  customerName: string,                 // Denormalized for display
  customerPhone: string | null,
  providerId: string | null,            // Assigned mechanic (null = unassigned)
  providerName: string | null,          // Denormalized for display
  assignedBy: string | null,            // Owner ID if manually assigned
  
  // Service Details
  description: string,
  categories: string[],                 // ["Oil Change", "Diagnostics"]
  vehicleInfo: string,                  // "2020 Toyota Camry"
  
  // Location
  locationDetails: {
    address: string,
    city: string | null,
    state: string | null,
    zip: string | null,
    coordinates: GeoPoint | null,       // For distance calculations
  },
  
  // Pricing (for custom quotes)
  items: [
    {
      name: string,
      description: string | null,
      price: number,
      quantity: number,
    }
  ],
  laborCost: number,
  partsCost: number,
  totalPrice: number,
  depositAmount: 20,                    // FIXED $20 platform fee (always $20)
  depositPaid: boolean,
  remainingBalance: number,             // totalPrice - 20 (goes to mechanic)
  
  // Media
  mediaUrls: string[],                  // Customer-uploaded photos
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  expiresAt: Timestamp,                 // 24 hours after creation
  scheduledAt: Timestamp | null,        // When service is scheduled
  acceptedAt: Timestamp | null,
  startedAt: Timestamp | null,
  completedAt: Timestamp | null,
  cancelledAt: Timestamp | null,
  
  // Cancellation
  cancellationReason: string | null,
  cancelledBy: string | null,           // userId who cancelled
  
  // Payment
  paymentMethod: "stripe" | "cash" | null,
  paymentStatus: "pending" | "deposit_paid" | "paid" | "refunded",
  stripePaymentIntentId: string | null,
  
  // Rating (after completion)
  customerRating: number | null,        // 1-5 stars
  customerReview: string | null,
  ratedAt: Timestamp | null,
}
```

### 2.3 `order-forms` Collection (Mechanic Work Documentation)

```javascript
order-forms/{formId}
{
  orderId: string,                      // Reference to repair-orders
  providerId: string,                   // Mechanic who filled it
  
  // Pre-service checklist
  preServiceChecklist: {
    vehicleConditionNotes: string,
    mileage: number,
    fuelLevel: string,
    existingDamage: string[],
    customerSignature: string | null,   // Base64 or URL
    photos: string[],                   // Before photos
  },
  
  // Work performed
  workPerformed: [
    {
      task: string,
      notes: string,
      partsUsed: string[],
      timeSpent: number,                // minutes
    }
  ],
  
  // Post-service
  postServiceChecklist: {
    testDriveCompleted: boolean,
    qualityCheckPassed: boolean,
    completionNotes: string,
    photos: string[],                   // After photos
    customerSignature: string | null,
  },
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  submittedAt: Timestamp | null,
}
```

### 2.4 `chats` Collection

```javascript
chats/{chatId}
{
  orderId: string,
  participants: string[],               // [customerId, providerId]
  type: "pre_acceptance" | "active_order",
  
  createdAt: Timestamp,
  lastMessageAt: Timestamp,
  lastMessage: string,                  // Preview text
  
  // Unread counts per user
  unreadCount: {
    [userId]: number,
  },
}

// Subcollection
chats/{chatId}/messages/{messageId}
{
  senderId: string,
  senderName: string,
  text: string,
  attachmentUrl: string | null,
  attachmentType: "image" | "document" | null,
  
  createdAt: Timestamp,
  readBy: string[],                     // User IDs who have read
}
```

### 2.5 `transactions` Collection

```javascript
transactions/{transactionId}
{
  orderId: string,
  customerId: string,
  providerId: string | null,
  
  type: "deposit" | "final_payment" | "refund",
  amount: number,
  method: "stripe" | "cash",
  
  // Stripe details (if applicable)
  stripePaymentIntentId: string | null,
  stripeChargeId: string | null,
  
  // Distribution
  platformFee: 20,                      // FIXED $20 owner's cut (deposit = platform fee)
  providerEarnings: number,             // Mechanic's cut (totalPrice - 20)
  
  status: "pending" | "completed" | "failed" | "refunded",
  
  createdAt: Timestamp,
  completedAt: Timestamp | null,
  
  notes: string | null,
}
```

### 2.6 `analytics` Collection (Owner Dashboard)

```javascript
analytics/daily/{date}                  // e.g., "2026-01-10"
{
  totalOrders: number,
  completedOrders: number,
  cancelledOrders: number,
  totalRevenue: number,
  platformFees: number,
  
  ordersByCategory: {
    [category]: number,
  },
  
  ordersByMechanic: {
    [providerId]: {
      completed: number,
      earnings: number,
    },
  },
}

analytics/mechanics/{providerId}
{
  totalJobsCompleted: number,
  totalEarnings: number,
  averageRating: number,
  currentMonthJobs: number,
  currentMonthEarnings: number,
}
```

---

## 3. Order Lifecycle & States

### Order Status Flow

```
                              ┌─────────────────┐
                              │    CREATED      │
                              │   (Pending)     │
                              └────────┬────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
    ┌─────────────────┐     ┌─────────────────┐      ┌─────────────────┐
    │    EXPIRED      │     │   ACCEPTED      │      │   CANCELLED     │
    │  (After 24hrs)  │     │  (By Mechanic)  │      │  (By Customer)  │
    └─────────────────┘     └────────┬────────┘      └─────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   SCHEDULED     │
                            │ (Date/Time Set) │
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  IN_PROGRESS    │
                            │ (Work Started)  │
                            └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                                 │
                    ▼                                 ▼
          ┌─────────────────┐              ┌─────────────────┐
          │   COMPLETED     │              │   CANCELLED     │
          │  (Work Done)    │              │ (During Service)│
          └────────┬────────┘              └─────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │     RATED       │
          │(Customer Rated) │
          └─────────────────┘
```

### Status Definitions

| Status | Description | Actions Available |
|--------|-------------|-------------------|
| `Pending` | New order, awaiting mechanic | Customer: Cancel, Edit; Mechanic: Accept, Chat |
| `Expired` | 24 hours passed, auto-expired | Customer: Resubmit; Mechanic: None |
| `Accepted` | Mechanic accepted the job | Customer: Chat, Cancel (fees may apply); Mechanic: Schedule, Chat |
| `Scheduled` | Date/time confirmed | Customer: Chat; Mechanic: Start, Chat |
| `InProgress` | Work has begun | Customer: Chat; Mechanic: Complete, Fill Forms, Chat |
| `Completed` | Work finished, payment collected | Customer: Rate, Chat (view only); Mechanic: View Forms |
| `Cancelled` | Order cancelled | View only for both parties |

### Expiration Logic

- **Trigger:** Cloud Function runs on schedule (every hour) or on document create
- **Condition:** `status === 'Pending' && now > expiresAt`
- **Action:** Update status to `Expired`, notify customer

---

## 4. Feature Matrix by Role

### 4.1 Customer Features

| Feature | Screen | Backend Requirements |
|---------|--------|---------------------|
| Create Order | CustomQuoteRequestForm | Write to `repair-orders`, upload to Storage |
| View Orders | OrdersScreen | Query `repair-orders` where `customerId == uid` |
| View Order Details | OrderDetailScreen | Read single `repair-orders` doc |
| Accept/Decline Quote | CustomerQuotesScreen | Update `repair-orders` status |
| Chat with Mechanic | ChatScreen | Read/Write `chats` subcollection |
| Make Deposit | PaymentScreen | Stripe integration, create `transaction` |
| Rate Mechanic | RatingModal | Update `repair-orders`, update mechanic's avg rating |
| View Profile Stats | ProfileScreen | Read own `users` doc (completedOrdersCount, etc.) |
| View Service Schedule | ServiceScheduleScreen | Query `repair-orders` where `status in [Scheduled, Completed]` |
| Privacy Settings | PrivacySettingsScreen | Update `users` preferences |

### 4.2 Mechanic Features

| Feature | Screen | Backend Requirements |
|---------|--------|---------------------|
| View Available Orders | RequestsScreen | Query `repair-orders` where `providerId == null && status == Pending` |
| View Assigned Orders | RepairOrdersScreen | Query `repair-orders` where `providerId == uid` |
| Accept Order | RequestDetailScreen | Update `repair-orders.providerId`, `status` |
| Create Custom Quote | CreateCustomChargeScreen | Write to `repair-orders` with `orderType: 'custom_quote'` |
| Pre-Order Chat | PreAcceptanceChatScreen | Write to `chats` with type `pre_acceptance` |
| Schedule Order | UpdateStatusScreen | Update `repair-orders.scheduledAt` |
| Start Order | RequestStartScreen | Update status to `InProgress`, create `order-forms` |
| Fill Work Forms | InspectionChecklistScreen | Write to `order-forms` |
| Complete Order | - | Update status, trigger payment collection |
| Collect Payment | PaymentCollectionModal | Create `transaction`, update `repair-orders.paymentStatus` |
| View Earnings | PerformanceDetailsScreen | Query `transactions` where `providerId == uid` |

### 4.3 Owner Features

| Feature | Screen | Backend Requirements |
|---------|--------|---------------------|
| View All Orders | AdminRequestsScreen | Query all `repair-orders` |
| Assign Orders | - | Update `repair-orders.providerId`, `assignedBy` |
| View All Mechanics | MechanicsListScreen | Query `users` where `role == 'provider'` |
| Manage Mechanics | MechanicDetailScreen | Update `users.isActive`, etc. |
| View Earnings | EarningsDashboard | Query `transactions`, `analytics` |
| View Analytics | AnalyticsScreen | Read `analytics` collection |
| Send Announcements | - | Write to notifications system |
| Manage Platform Settings | SettingsScreen | Update `config` collection |

---

## 5. Payment Flow

### 5.1 Deposit Flow (Customer → Platform)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Customer   │───▶│   App/UI     │───▶│   Stripe     │───▶│   Platform   │
│ Accepts Quote│    │ Payment Sheet│    │   Process    │    │   Account    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                   │
                                                                   │
                    ┌──────────────────────────────────────────────┘
                    │
                    ▼
            ┌──────────────┐
            │  Create      │
            │ Transaction  │
            │   Record     │
            └──────────────┘
```

### 5.2 Final Payment Flow (At Service Completion)

```
Option A: Stripe
─────────────────
Customer pays via app → Stripe processes → Split to:
  - Platform fee (owner's cut)
  - Mechanic earnings (transferred via Stripe Connect)

Option B: Cash
─────────────────
Mechanic collects cash → Records in app → System tracks:
  - Platform fee owed
  - Mechanic keeps cash minus platform fee
```

### 5.3 Revenue Split

```
PLATFORM FEE = DEPOSIT = $20 (flat fee, regardless of service total)

Example: Total Service $200
─────────────────────────────
Deposit (Platform Fee): $20 → Collected at quote acceptance → Goes to Owner
Remaining Balance: $180 → Collected at completion → Goes to Mechanic

Payment Collection Options:
  - Stripe: $180 transferred to mechanic
  - Cash: Mechanic collects $180 directly from customer
```

> **Key Point:** The $20 deposit IS the platform fee. This simplifies accounting - 
> the owner receives $20 per completed job, mechanics receive the full remaining balance.


---

## 6. Notifications System

### Notification Types

| Event | Recipients | Channels |
|-------|------------|----------|
| New order in area | Available Mechanics | Push, Email |
| Order accepted | Customer | Push, Email |
| Quote received | Customer | Push, Email |
| Quote accepted | Mechanic | Push |
| Order scheduled | Both | Push, Email |
| Service started | Customer | Push |
| Service completed | Customer | Push, Email |
| Payment received | Mechanic | Push |
| New message | Recipient | Push |
| Order expiring (1hr warning) | Customer | Push |
| Order expired | Customer | Push, Email |
| Order assigned (by owner) | Mechanic | Push |

### Implementation

- **Push:** Firebase Cloud Messaging (FCM)
- **Email:** Firebase Extensions or SendGrid
- **In-App:** Store in `users/{uid}/notifications` subcollection

---

## 7. Security Rules Overview

### Key Principles

1. **Customers** can only read/write their own data
2. **Mechanics** can read available orders, write to assigned orders
3. **Owner** has full read/write access
4. **Authentication required** for all operations

### Rule Helpers

```javascript
function isAuthenticated() {
  return request.auth != null;
}

function isOwner() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
}

function isProvider() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'provider';
}

function isCustomer() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'customer';
}

function isOrderParticipant(orderId) {
  let order = get(/databases/$(database)/documents/repair-orders/$(orderId)).data;
  return request.auth.uid == order.customerId || request.auth.uid == order.providerId;
}
```

---

## 8. Cloud Functions Required

### Scheduled Functions

| Function | Schedule | Purpose |
|----------|----------|---------|
| `expireOrders` | Every hour | Find and expire orders past 24hrs |
| `generateDailyAnalytics` | Daily at midnight | Aggregate daily stats |
| `cleanupExpiredData` | Weekly | Remove old data per retention policy |

### Trigger Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `onUserCreate` | `auth.user().onCreate` | Initialize user document with defaults |
| `onOrderCreate` | `repair-orders.onCreate` | Set `expiresAt`, notify mechanics |
| `onOrderStatusChange` | `repair-orders.onUpdate` | Send notifications, update analytics |
| `onPaymentComplete` | `transactions.onCreate` | Update order payment status, mechanic earnings |
| `onRatingSubmit` | `repair-orders.onUpdate` (rating field) | Recalculate mechanic's average rating |

### Callable Functions

| Function | Called By | Purpose |
|----------|-----------|---------|
| `createStripePaymentIntent` | Customer | Initialize Stripe payment |
| `recordCashPayment` | Mechanic | Log cash collection |
| `assignOrderToMechanic` | Owner | Manually assign order |
| `getEarningsReport` | Mechanic, Owner | Generate earnings summary |

---

## 9. Storage Structure

```
Firebase Storage
├── profileImages/
│   └── {userId}/
│       └── profile.jpg
│
├── repairOrders/
│   └── {userId}/
│       └── {orderId}/
│           ├── customer-upload-0.jpg
│           ├── customer-upload-1.jpg
│           └── ...
│
├── orderForms/
│   └── {orderId}/
│       ├── pre-service/
│       │   ├── photo-0.jpg
│       │   └── signature.png
│       └── post-service/
│           ├── photo-0.jpg
│           └── signature.png
│
└── chatAttachments/
    └── {chatId}/
        └── {messageId}/
            └── attachment.jpg
```

### Storage Rules Summary

- Profile images: Owner can read/write own
- Repair order media: Customer uploads, mechanic/owner can read
- Order forms: Mechanic writes, all participants can read
- Chat attachments: Participants only

---

## 10. API Integrations

### Required Third-Party Services

| Service | Purpose | Implementation |
|---------|---------|----------------|
| **Stripe** | Payments, payouts | Stripe SDK, Connect for mechanics |
| **Firebase Auth** | Authentication | Email/password, potentially Google/Apple |
| **Firebase Cloud Messaging** | Push notifications | FCM SDK |
| **Google Maps** | Address validation, distance | Maps SDK or Geocoding API |
| **SendGrid** (optional) | Transactional emails | Firebase Extension or direct API |

### Stripe Connect Flow

1. Mechanic signs up → Create Stripe Connected Account
2. Complete onboarding → Account verified
3. On payment → Split and transfer to connected account
4. Weekly payouts to mechanic's bank

---

## Implementation Priority

### Phase 1: Core Order Flow ⬅️ START HERE
- [ ] Order creation with media upload (Storage)
- [ ] Order expiration (24hr Cloud Function)
- [ ] Mechanic order acceptance
- [ ] Basic status updates

### Phase 2: Communication
- [ ] Pre-acceptance chat
- [ ] Active order chat
- [ ] Push notifications

### Phase 3: Work Documentation
- [ ] Pre-service forms
- [ ] Post-service forms
- [ ] Photo documentation

### Phase 4: Analytics & Rating
- [ ] Customer ratings
- [ ] Mechanic performance tracking
- [ ] Owner dashboard

### Phase 5: Owner Features
- [ ] Order assignment
- [ ] Mechanic management
- [ ] Earnings reports

### Phase 6: Payments ⬅️ LAST PRIORITY
- [ ] Stripe integration for $20 deposit collection
- [ ] Cash payment recording for remaining balance
- [ ] Payment status tracking
- [ ] Owner earnings dashboard

> **Note:** Payments deferred to last phase. Core functionality works without payments 
> (can test full flow, add payment integration when ready for production).

---

## Notes & Decisions

### Open Questions

1. ~~**Deposit percentage:**~~ ✅ RESOLVED - Flat $20 fee
2. ~~**Platform fee:**~~ ✅ RESOLVED - $20 deposit IS the platform fee
3. **Cash handling:** Mechanic collects remaining balance in cash - no platform fee owed (already collected as deposit)
4. **Refund policy:** What happens if customer cancels after deposit?
5. **Service radius:** Should mechanics set a service radius?

### Technical Decisions Made

- Using single `repair-orders` collection for both standard and custom quotes (differentiated by `orderType`)
- Denormalizing customer/provider names in orders for faster reads
- Using subcollections for chat messages (scalability)
- Storing forms separately from orders (forms can be large)

---

*This document should be updated as development progresses and new requirements are identified.*

