# Review & Rating System

## Overview

The review system allows both customers and providers to rate each other after an order is completed. Ratings are automatically calculated and displayed on user profiles.

## Architecture

### Components

1. **ReviewModal** (`components/reviews/ReviewModal.tsx`)
   - Reusable modal component for submitting reviews
   - Supports 1-5 star ratings
   - Optional text review (up to 500 characters)
   - Different UI for customer vs provider reviewers

2. **useReviewModal Hook** (`hooks/useReviewModal.ts`)
   - Manages review modal state
   - Detects completed orders that need reviews
   - Handles review submission

3. **ReviewContext** (`contexts/ReviewContext.tsx`)
   - Global context provider for review functionality
   - Automatically checks for pending reviews when app becomes active
   - Shows review modal when needed

### Cloud Function

**onRatingSubmit** (`functions/src/index.ts`)
- Triggers when a `repair-orders` document is updated with a rating
- Automatically recalculates average ratings for both customers and providers
- Updates `averageRating` and `totalRatingsCount` fields in user documents

## Data Structure

### Repair Order Fields
```typescript
{
  customerRating?: number;        // 1-5 rating from customer
  customerReview?: string;         // Optional text review from customer
  customerRatedAt?: Timestamp;     // When customer submitted review
  providerRating?: number;         // 1-5 rating from provider
  providerReview?: string;         // Optional text review from provider
  providerRatedAt?: Timestamp;     // When provider submitted review
}
```

### User Profile Fields
```typescript
{
  averageRating?: number;          // Calculated average (1-5)
  totalRatingsCount?: number;      // Total number of ratings received
}
```

## Flow

### When Order is Completed

1. **Provider completes order** in `RequestStartScreen` or `UpdateStatusScreen`
2. Order status changes to "Completed" in Firestore
3. **Review modal triggers immediately**:
   - **Provider**: Prompted to rate the customer (immediately after completion)
   - **Customer**: Prompted to rate the provider (when they view their orders and status changes to Completed)

### Review Submission

1. User selects rating (1-5 stars) and optionally writes a review
2. Review is saved to the `repair-orders` document
3. Cloud function `onRatingSubmit` triggers automatically
4. Cloud function recalculates the reviewee's average rating
5. User profile is updated with new `averageRating` and `totalRatingsCount`

### Profile Display

- **Provider Profile**: Shows `averageRating` with star display
- **Customer Profile**: Shows `averageRating` with star display
- Ratings are fetched from user document (updated by cloud function)

## Usage

### Review Prompting

The system triggers review modals **immediately** when:
- **Provider**: Completes an order (via `RequestStartScreen` or `UpdateStatusScreen`)
- **Customer**: Views their orders and an order status changes to "Completed" (via `OrdersScreen` listener)

### Manual Review Triggering

You can manually trigger a review check:

```typescript
import { useReview } from '@/contexts/ReviewContext';

function MyComponent() {
  const { checkForPendingReviews } = useReview();
  
  // Trigger review check
  checkForPendingReviews();
}
```

### Showing Review for Specific Order

```typescript
import { useReview } from '@/contexts/ReviewContext';

function MyComponent() {
  const { showReviewForOrder } = useReview();
  
  // Show review modal for specific order
  showReviewForOrder(order);
}
```

## Cloud Function Deployment

The cloud function needs to be deployed to Firebase:

```bash
cd functions
npm install
firebase deploy --only functions:onRatingSubmit
```

## Security Rules

Ensure Firestore rules allow:
- Users to read their own user document
- Users to update `repair-orders` documents where they are the customer or provider
- Cloud function to read/write user documents (runs with admin privileges)

## Future Enhancements

- Push notifications when order is completed
- Reminder notifications if review not submitted after 24 hours
- Review history page showing all reviews received
- Ability to edit/delete reviews (with time limits)
- Review moderation system

