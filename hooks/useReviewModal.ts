import { useState, useEffect, useCallback } from 'react';
import { auth, firestore } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { RepairOrder } from '@/types/orders';

interface UseReviewModalOptions {
  onReviewSubmitted?: (orderId: string) => void;
}

/**
 * Hook to manage review modal state and submission
 * Shows review modal when triggered for a specific order
 */
export function useReviewModal(options: UseReviewModalOptions = {}) {
  const [pendingReviewOrder, setPendingReviewOrder] = useState<RepairOrder | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reviewerRole, setReviewerRole] = useState<'customer' | 'provider'>('customer');

  // Show review modal for a specific order
  const showReviewForOrder = useCallback(async (order: RepairOrder, role: 'customer' | 'provider') => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Check if review is already submitted
    if (role === 'customer' && order.customerRating) {
      return; // Customer already rated
    }
    if (role === 'provider' && order.providerRating) {
      return; // Provider already rated
    }

    // Verify the user has permission to review this order
    if (role === 'customer' && order.customerId !== currentUser.uid) {
      console.warn('Customer trying to review order that is not theirs');
      return;
    }
    if (role === 'provider' && order.providerId !== currentUser.uid) {
      console.warn('Provider trying to review order that is not theirs');
      return;
    }

    setPendingReviewOrder(order);
    setReviewerRole(role);
    setIsModalVisible(true);
  }, []);

  // Submit review
  const submitReview = useCallback(async (
    orderId: string,
    rating: number,
    review: string,
    role: 'customer' | 'provider'
  ) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      const orderRef = doc(firestore, 'repair-orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data() as RepairOrder;
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (role === 'customer') {
        // Customer rating the provider
        updateData.customerRating = rating;
        updateData.customerReview = review;
        updateData.customerRatedAt = serverTimestamp();
      } else {
        // Provider rating the customer
        updateData.providerRating = rating;
        updateData.providerReview = review;
        updateData.providerRatedAt = serverTimestamp();
      }

      await updateDoc(orderRef, updateData);

      // Update user's average rating via cloud function or client-side calculation
      // For now, we'll trigger a cloud function to recalculate
      // This will be handled by the cloud function

      // Call callback if provided
      if (options.onReviewSubmitted) {
        options.onReviewSubmitted(orderId);
      }

      // Close modal after submission
      setPendingReviewOrder(null);
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }, [checkForPendingReviews, options]);

  return {
    pendingReviewOrder,
    isModalVisible,
    reviewerRole,
    setIsModalVisible,
    showReviewForOrder,
    submitReview,
  };
}

