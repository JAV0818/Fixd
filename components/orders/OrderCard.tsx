import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Card } from 'react-native-paper';
import { colors, spacing, radius, typography } from '@/styles/theme';
import { ThemedButton } from '@/components/ui/ThemedButton';

export interface OrderCardActions {
  onAccept?: () => void;
  onDecline?: () => void;
  onMessage?: () => void;
}

export interface OrderCardData {
  id: string;
  vehicleInfo?: string;
  description?: string;
  serviceType?: string;
  locationDetails?: { address?: string };
  status?: string;
  providerName?: string;
  orderType?: string;
  totalPrice?: number;
  items?: { name: string; price: number; quantity: number }[];
}

interface OrderCardProps {
  order: OrderCardData;
  onPress?: () => void;
  onMessagePress?: () => void;
  showMessageButton?: boolean;
  showAcceptDecline?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  variant?: 'customer' | 'provider';
}

export function OrderCard({
  order,
  onPress,
  onMessagePress,
  showMessageButton = false,
  showAcceptDecline = false,
  onAccept,
  onDecline,
  variant = 'customer',
}: OrderCardProps) {
  const status = (order.status || '').toLowerCase();
  const statusColor = getStatusColor(status);
  const statusBgColor = statusColor + '20';

  const canShowMessageButton = showMessageButton && (
    status === 'accepted' || 
    status === 'inprogress' || 
    status === 'claimed' ||
    status === 'scheduled'
  );

  // Only show accept/decline for custom quotes in pending status
  const canShowAcceptDecline = showAcceptDecline && 
    order.orderType === 'custom_quote' && 
    (status === 'pending' || status === 'pendingapproval');

  return (
    <Pressable onPress={onPress} style={styles.cardWrapper}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {/* Header Row: Vehicle Info + Status Badge */}
          <View style={styles.headerRow}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleText} numberOfLines={1}>
                {order.vehicleInfo || 'Vehicle Service'}
              </Text>
              {order.serviceType && (
                <Text style={styles.serviceText} numberOfLines={1}>
                  {order.serviceType}
                </Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {formatStatus(order.status)}
              </Text>
            </View>
          </View>

          {/* Description/Details */}
          {order.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {order.description}
            </Text>
          )}

          {/* Custom Quote Details */}
          {order.orderType === 'custom_quote' && order.providerName && (
            <Text style={styles.providerText} numberOfLines={1}>
              Custom quote from {order.providerName}
            </Text>
          )}

          {/* Location */}
          {order.locationDetails?.address && (
            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.textTertiary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {order.locationDetails.address}
              </Text>
            </View>
          )}

          {/* Items List (for custom quotes) */}
          {order.items && order.items.length > 0 && (
            <View style={styles.itemsContainer}>
              {order.items.slice(0, 2).map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ${item.price?.toFixed(2)}
                  </Text>
                </View>
              ))}
              {order.items.length > 2 && (
                <Text style={styles.moreItemsText}>
                  +{order.items.length - 2} more items
                </Text>
              )}
            </View>
          )}

          {/* Total Price (if available) */}
          {order.totalPrice != null && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>${order.totalPrice.toFixed(2)}</Text>
            </View>
          )}

          {/* Accept/Decline Buttons (for custom quotes) */}
          {canShowAcceptDecline && (
            <View style={styles.buttonContainer}>
              <View style={styles.actionButtonRow}>
                <ThemedButton
                  variant="danger"
                  onPress={onDecline}
                  style={styles.actionButton}
                >
                  Decline
                </ThemedButton>
                <ThemedButton
                  variant="primary"
                  onPress={onAccept}
                  style={styles.actionButton}
                >
                  Accept Quote
                </ThemedButton>
              </View>
            </View>
          )}

          {/* Message Button */}
          {canShowMessageButton && (
            <View style={styles.buttonContainer}>
              <ThemedButton
                variant="outlined"
                onPress={onMessagePress}
                icon="message"
                style={styles.messageButton}
              >
                Message Mechanic
              </ThemedButton>
            </View>
          )}
        </Card.Content>
      </Card>
    </Pressable>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
    case 'pendingapproval':
      return colors.warning;
    case 'accepted':
      return colors.warning;
    case 'inprogress':
    case 'scheduled':
      return colors.success;
    case 'completed':
      return colors.success;
    case 'cancelled':
    case 'declined':
    case 'declinedbycustomer':
    case 'cancelledbymechanic':
      return colors.danger;
    case 'claimed':
      return colors.primary;
    default:
      return colors.textTertiary;
  }
}

function formatStatus(status?: string): string {
  if (!status) return 'PENDING';
  
  const s = status.toLowerCase();
  switch (s) {
    case 'pendingapproval':
      return 'PENDING';
    case 'declinedbycustomer':
      return 'DECLINED';
    case 'cancelledbymechanic':
      return 'CANCELLED';
    case 'inprogress':
      return 'IN PROGRESS';
    default:
      return status.toUpperCase();
  }
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  vehicleText: {
    ...typography.title,
    marginBottom: spacing.xs / 2,
  },
  serviceText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  statusText: {
    ...typography.small,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  providerText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  locationText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  itemsContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  itemName: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  itemPrice: {
    ...typography.body,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  moreItemsText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    ...typography.title,
    fontSize: 15,
  },
  totalPrice: {
    ...typography.h3,
    fontSize: 18,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  messageButton: {
    width: '100%',
  },
});
