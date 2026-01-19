import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/styles/theme';
import { ThemedButton } from '@/components/ui/ThemedButton';

interface ReviewModalProps {
  visible: boolean;
  orderId: string;
  orderTitle: string;
  revieweeName: string;
  revieweeId: string;
  reviewerRole: 'customer' | 'provider';
  onClose: () => void;
  onSubmit: (rating: number, review: string) => Promise<void>;
}

export function ReviewModal({
  visible,
  orderId,
  orderTitle,
  revieweeName,
  revieweeId,
  reviewerRole,
  onClose,
  onSubmit,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarPress = (index: number) => {
    setRating(index + 1);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, review.trim());
      // Reset form
      setRating(0);
      setReview('');
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setReview('');
      onClose();
    }
  };

  const title = reviewerRole === 'customer' 
    ? `Rate ${revieweeName}`
    : `Rate ${revieweeName}`;
  
  const subtitle = reviewerRole === 'customer'
    ? 'How was your service experience?'
    : 'How was your experience working with this customer?';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayPressable} onPress={handleClose} />
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton} disabled={isSubmitting}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderInfoText} numberOfLines={1}>
                Order: {orderTitle}
              </Text>
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Your Rating</Text>
              <View style={styles.starsContainer}>
                {Array.from({ length: 5 }).map((_, index) => {
                  const isFilled = index < rating;
                  return (
                    <Pressable
                      key={index}
                      onPress={() => handleStarPress(index)}
                      disabled={isSubmitting}
                      style={styles.starButton}
                    >
                      <Star
                        size={40}
                        color={isFilled ? colors.warning : colors.border}
                        fill={isFilled ? colors.warning : 'none'}
                      />
                    </Pressable>
                  );
                })}
              </View>
              {rating > 0 && (
                <Text style={styles.ratingText}>
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </Text>
              )}
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Write a Review (Optional)</Text>
              <TextInput
                style={styles.reviewInput}
                value={review}
                onChangeText={setReview}
                placeholder="Share your experience..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                maxLength={500}
                editable={!isSubmitting}
              />
              <Text style={styles.charCount}>{review.length}/500</Text>
            </View>

            <ThemedButton
              variant="primary"
              onPress={handleSubmit}
              disabled={isSubmitting || rating === 0}
              loading={isSubmitting}
              style={styles.submitButton}
            >
              Submit Review
            </ThemedButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    gap: spacing.lg,
  },
  orderInfo: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
  },
  orderInfoText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ratingSection: {
    alignItems: 'center',
  },
  ratingLabel: {
    ...typography.body,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  ratingText: {
    ...typography.body,
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  reviewSection: {
    gap: spacing.sm,
  },
  reviewLabel: {
    ...typography.body,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  reviewInput: {
    ...typography.body,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

