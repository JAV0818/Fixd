import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useReviewModal } from '@/hooks/useReviewModal';
import { ReviewModal } from '@/components/reviews/ReviewModal';
import { RepairOrder } from '@/types/orders';
import { auth, firestore } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ReviewContextType {
  showReviewForOrder: (order: RepairOrder, role: 'customer' | 'provider') => Promise<void>;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  const {
    pendingReviewOrder,
    isModalVisible,
    reviewerRole,
    setIsModalVisible,
    showReviewForOrder: showReview,
    submitReview,
  } = useReviewModal({
    onReviewSubmitted: () => {
      // Review submitted
    },
  });

  const handleSubmitReview = useCallback(async (rating: number, review: string) => {
    if (!pendingReviewOrder) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Get reviewee info
    const revieweeId = reviewerRole === 'customer' 
      ? pendingReviewOrder.providerId 
      : pendingReviewOrder.customerId;

    if (!revieweeId) {
      throw new Error('Reviewee ID not found');
    }

    const revieweeDoc = await getDoc(doc(firestore, 'users', revieweeId));
    const revieweeData = revieweeDoc.data();
    const revieweeName = revieweeData?.firstName && revieweeData?.lastName
      ? `${revieweeData.firstName} ${revieweeData.lastName}`
      : revieweeData?.email || 'User';

    await submitReview(
      pendingReviewOrder.id,
      rating,
      review,
      reviewerRole
    );
  }, [pendingReviewOrder, reviewerRole, submitReview]);

  // Get reviewee name for modal
  const revieweeName = pendingReviewOrder
    ? reviewerRole === 'customer'
      ? pendingReviewOrder.providerName || 'Mechanic'
      : pendingReviewOrder.customerName || 'Customer'
    : '';

  const orderTitle = pendingReviewOrder?.vehicleInfo || pendingReviewOrder?.description || 'Service Order';

  return (
    <ReviewContext.Provider
      value={{
        showReviewForOrder: showReview,
      }}
    >
      {children}
      {pendingReviewOrder && (
        <ReviewModal
          visible={isModalVisible}
          orderId={pendingReviewOrder.id}
          orderTitle={orderTitle}
          revieweeName={revieweeName}
          revieweeId={reviewerRole === 'customer' 
            ? pendingReviewOrder.providerId || '' 
            : pendingReviewOrder.customerId}
          reviewerRole={reviewerRole}
          onClose={() => setIsModalVisible(false)}
          onSubmit={handleSubmitReview}
        />
      )}
    </ReviewContext.Provider>
  );
}

export function useReview() {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
}

