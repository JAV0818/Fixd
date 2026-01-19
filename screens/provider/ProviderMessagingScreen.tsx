import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, Plus, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { auth, firestore } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, Timestamp, doc, getDoc } from 'firebase/firestore';
import { colors, spacing, radius, typography } from '@/styles/theme';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

type ProviderMessagingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProviderMessaging'>;

interface Conversation {
  orderId: string;
  customerId: string;
  customerName: string;
  customerInitials: string;
  serviceType: string;
  lastMessage: string;
  lastMessageTime: Date | null;
  unreadCount: number;
  orderStatus: string;
}

export default function ProviderMessagingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProviderMessagingScreenNavigationProp>();
  const currentUser = auth.currentUser;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Fetch all orders where provider is assigned and has messages
    // Note: We don't orderBy here to avoid needing a composite index.
    // We sort by last message time client-side instead.
    const ordersRef = collection(firestore, 'repair-orders');
    const q = query(
      ordersRef,
      where('providerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (ordersSnapshot) => {
      const conversationsData: Conversation[] = [];

      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = orderDoc.data();
        const orderId = orderDoc.id;

        // Determine which chat collection to check
        const chatCollectionPath = 
          orderData.status === 'Accepted' || 
          orderData.status === 'InProgress' || 
          orderData.status === 'Completed'
            ? 'activeChat'
            : 'preAcceptanceChats';

        // Get the last message from the chat
        const messagesRef = collection(firestore, 'repair-orders', orderId, chatCollectionPath);
        const messagesQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));
        
        try {
          const messagesSnapshot = await getDocs(messagesQuery);
          
          if (!messagesSnapshot.empty) {
            const lastMessageDoc = messagesSnapshot.docs[0];
            const lastMessageData = lastMessageDoc.data();
            
            // Fetch customer details
            let customerName = 'Customer';
            let customerInitials = 'C';
            
            if (orderData.customerId) {
              try {
                const customerDocRef = doc(firestore, 'users', orderData.customerId);
                const customerDocSnap = await getDoc(customerDocRef);
                if (customerDocSnap.exists()) {
                  const customerData = customerDocSnap.data();
                  const firstName = customerData.firstName || '';
                  const lastName = customerData.lastName || '';
                  customerName = `${firstName} ${lastName}`.trim() || customerData.displayName || 'Customer';
                  customerInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'C';
                }
              } catch (err) {
                console.error('Error fetching customer:', err);
              }
            }

            const lastMessageText = lastMessageData.text || 
              (lastMessageData.attachmentType === 'image' ? '📷 Image' : 
               lastMessageData.attachmentType === 'document' ? '📄 Document' : '');
            
            const lastMessageTime = lastMessageData.createdAt?.toDate?.() || null;

            conversationsData.push({
              orderId,
              customerId: orderData.customerId || '',
              customerName,
              customerInitials,
              serviceType: orderData.categories?.[0] || orderData.serviceType || 'Service',
              lastMessage: lastMessageText,
              lastMessageTime,
              unreadCount: 0, // TODO: Implement unread count tracking
              orderStatus: orderData.status || 'Pending',
            });
          }
        } catch (err) {
          console.error(`Error fetching messages for order ${orderId}:`, err);
        }
      }

      // Sort by last message time (newest first)
      conversationsData.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
      });

      setConversations(conversationsData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching conversations:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Pagination calculations
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(conversations.length / pageSize));
  }, [conversations.length, pageSize]);

  const pagedConversations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return conversations.slice(start, end);
  }, [conversations, currentPage, pageSize]);

  // Reset to page 1 if current page is out of range
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const goPrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const goNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  const formatTimestamp = (date: Date | null) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const day = 24 * 60 * 60 * 1000;
    
    if (diff < day) {
      // Less than 1 day ago - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 7 * day) {
      // Less than a week ago - show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // More than a week ago - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleChatPress = (conversation: Conversation) => {
    navigation.navigate('RequestContact', { orderId: conversation.orderId });
  };

  const handleStartNewChat = () => {
    navigation.navigate('CreateCustomCharge');
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    return (
      <Pressable onPress={() => handleChatPress(item)}>
        <Card style={styles.conversationCard}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.conversationRow}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>{item.customerInitials}</Text>
                </LinearGradient>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>

              {/* Content */}
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {item.customerName}
                  </Text>
                  <Text style={styles.timestamp}>
                    {formatTimestamp(item.lastMessageTime)}
                  </Text>
                </View>
                
                <Text style={styles.serviceType} numberOfLines={1}>
                  {item.serviceType}
                </Text>
                
                <Text 
                  style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]} 
                  numberOfLines={1}
                >
                  {item.lastMessage || 'No messages yet'}
                </Text>
              </View>

              <ChevronRight size={20} color={colors.textTertiary} />
            </View>
          </Card.Content>
        </Card>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Pressable 
          style={styles.addButton}
          onPress={handleStartNewChat}
        >
          <Plus size={24} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : conversations.length > 0 ? (
        <>
          <FlatList
            data={pagedConversations}
            renderItem={renderConversationItem}
            keyExtractor={item => item.orderId}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={[styles.paginationContainer, { paddingBottom: insets.bottom + 20 }]}>
              <Pressable
                onPress={goPrev}
                disabled={currentPage === 1}
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              >
                <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                  Previous
                </Text>
              </Pressable>
              
              <Text style={styles.paginationText}>
                Page {currentPage} of {totalPages}
              </Text>
              
              <Pressable
                onPress={goNext}
                disabled={currentPage === totalPages}
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
              >
                <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                  Next
                </Text>
              </Pressable>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color={colors.textTertiary} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Conversations</Text>
          <Text style={styles.emptyMessage}>
            Start a conversation by creating a custom order or accepting a request.
          </Text>
          <ThemedButton
            variant="primary"
            onPress={handleStartNewChat}
            icon="plus"
            style={styles.emptyButton}
          >
            Start New Chat
          </ThemedButton>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    fontSize: 24,
    color: colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  listContent: {
    padding: spacing.lg,
  },
  conversationCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    padding: spacing.md,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: spacing.md,
    position: 'relative',
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.body,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  unreadCount: {
    ...typography.small,
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  customerName: {
    ...typography.bodyLarge,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    flex: 1,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  serviceType: {
    ...typography.body,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  lastMessage: {
    ...typography.body,
    color: colors.textSecondary,
  },
  unreadMessage: {
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: '80%',
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paginationButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    ...typography.body,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
  },
  paginationButtonTextDisabled: {
    color: colors.textTertiary,
  },
  paginationText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
