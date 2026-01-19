import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  FlatList,
  Pressable,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Phone, Calendar, Clock, Paperclip, Image as ImageIcon, File, Download, X } from 'lucide-react-native';
import { IconButton, Card } from 'react-native-paper';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { RepairOrder } from '@/types/orders';
import { auth, firestore, storage } from '@/lib/firebase';
import {
  doc, getDoc, onSnapshot, collection, query, orderBy, addDoc,
  serverTimestamp, Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors, spacing, radius, typography } from '@/styles/theme';

interface UserProfile {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface PreAcceptanceChatMessage {
  id: string;
  senderId: string;
  text?: string;
  createdAt: Timestamp;
  sentBy: 'customer' | 'provider';
  attachmentUrl?: string;
  attachmentType?: 'image' | 'document';
  attachmentName?: string;
  attachmentSize?: number;
}

type Props = NativeStackScreenProps<any, 'RequestContact'>;

export default function RequestContactScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<PreAcceptanceChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [customer, setCustomer] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth.currentUser;
  const insets = useSafeAreaInsets();

  // Fetch Order and Customer details
  useEffect(() => {
    setLoading(true);
    const orderDocRef = doc(firestore, 'repair-orders', orderId);

    const unsubscribeOrder = onSnapshot(orderDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as RepairOrder;
        setOrder(orderData);
        setError(null);

        if (orderData.customerId) {
          const customerDocRef = doc(firestore, 'users', orderData.customerId);
          try {
            const customerDoc = await getDoc(customerDocRef);
            if (customerDoc.exists()) {
              setCustomer(customerDoc.data() as UserProfile);
            } else {
              setCustomer(null);
            }
          } catch (customerError) {
            console.error("Error fetching customer data:", customerError);
          }
        }
      } else {
        setError("Order not found.");
        setOrder(null);
      }
    }, (err) => {
      console.error("Error fetching order details:", err);
      setError("Failed to load order details.");
      setLoading(false);
    });

    return () => unsubscribeOrder();
  }, [orderId]);

  // Fetch Messages
  useEffect(() => {
    if (!order) return;

    // For completed orders, fetch from both collections to show all messages
    let chatCollectionPath = 'preAcceptanceChats';
    if (order.status === 'Accepted' || order.status === 'InProgress' || order.status === 'Completed') {
      chatCollectionPath = 'activeChat';
    }

    const messagesRef = collection(firestore, 'repair-orders', orderId, chatCollectionPath);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PreAcceptanceChatMessage));
      setMessages(fetchedMessages);
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, (err) => {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages.");
      setLoading(false);
    });

    return () => unsubscribeMessages();
  }, [orderId, order]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handlePickImage = async () => {
    // Disable attachments for completed orders
    if (order?.status === 'Completed') {
      Alert.alert("Order Completed", "You cannot send attachments for completed orders.");
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "Permission to access camera roll is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const chatCollectionPath = order?.status === 'Accepted' || order?.status === 'InProgress' ? 'activeChat' : 'preAcceptanceChats';
      for (const asset of result.assets) {
        await handleSendAttachment(asset.uri, 'image', chatCollectionPath, asset.fileName || 'image.jpg', asset.fileSize);
      }
    }
    setShowAttachmentModal(false);
  };

  const handlePickDocument = async () => {
    // Disable attachments for completed orders
    if (order?.status === 'Completed') {
      Alert.alert("Order Completed", "You cannot send attachments for completed orders.");
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const chatCollectionPath = order?.status === 'Accepted' || order?.status === 'InProgress' ? 'activeChat' : 'preAcceptanceChats';
        for (const asset of result.assets) {
          await handleSendAttachment(asset.uri, 'document', chatCollectionPath, asset.name, asset.size);
        }
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Could not pick document.");
    }
    setShowAttachmentModal(false);
  };

  const handleSendAttachment = async (uri: string, type: 'image' | 'document', chatCollectionPath: string, fileName?: string, fileSize?: number) => {
    if (!currentUser || !order) return;
    setUploadingAttachment(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      if (blob.size > 10 * 1024 * 1024) {
        Alert.alert("File Too Large", "Please select a file smaller than 10MB.");
        return;
      }

      const fileExtension = fileName?.split('.').pop() || (type === 'image' ? 'jpg' : 'pdf');
      const uploadFileName = `${Date.now()}-${currentUser.uid}-${fileName || `file.${fileExtension}`}`;
      const attachmentRef = ref(storage, `chatAttachments/${chatCollectionPath}/${orderId}/${uploadFileName}`);
      
      await uploadBytes(attachmentRef, blob);
      const downloadURL = await getDownloadURL(attachmentRef);

      const messagesRef = collection(firestore, 'repair-orders', orderId, chatCollectionPath);
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        attachmentUrl: downloadURL,
        attachmentType: type,
        attachmentName: fileName || `${type}.${fileExtension}`,
        attachmentSize: fileSize || blob.size,
        createdAt: serverTimestamp(),
        sentBy: 'provider',
        text: '',
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error("Error sending attachment:", error);
      Alert.alert("Error", "Could not send attachment.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleSendMessage = async () => {
    // Disable sending messages for completed orders
    if (order?.status === 'Completed') {
      Alert.alert("Order Completed", "You cannot send messages for completed orders. You can only view previous messages.");
      return;
    }

    if ((!message.trim() && !uploadingAttachment) || !currentUser || !order || !order.customerId) {
      return;
    }
    
    setSending(true);
    const messageText = message;
    setMessage('');

    let chatCollectionPath = 'preAcceptanceChats';
    if (order && (order.status === 'Accepted' || order.status === 'InProgress')) {
      chatCollectionPath = 'activeChat';
    }
    
    const messagesRef = collection(firestore, 'repair-orders', orderId, chatCollectionPath);

    try {
      if (messageText) {
        await addDoc(messagesRef, {
          senderId: currentUser.uid,
          text: messageText,
          createdAt: serverTimestamp(),
          sentBy: 'provider'
        });
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Could not send message.");
      setMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handlePhoneCall = () => {
    Alert.alert(
      "Make Phone Call",
      `Call ${order?.locationDetails?.phoneNumber || '(XXX) XXX-XXXX'}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => console.log("Initiating call...") }
      ]
    );
  };

  const formatTime = (date: Date) => {
    if (!date || !(date instanceof Date)) return 'N/A'; 
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
  };

  const groupMessagesByDate = () => {
    const groupedMessages: { date: string; data: PreAcceptanceChatMessage[] }[] = [];
    messages?.forEach((msg) => {
      if (!msg.createdAt?.toDate) return;
      const messageDate = msg.createdAt.toDate();
      const dateString = messageDate.toDateString();
      const existingGroup = groupedMessages.find(group => group.date === dateString);
      if (existingGroup) {
        existingGroup.data.push(msg);
      } else {
        groupedMessages.push({ date: dateString, data: [msg] });
      }
    });
    return groupedMessages;
  };

  const renderDateSeparator = (date: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let displayDate = date;
    if (date === today) displayDate = "Today";
    else if (date === yesterday) displayDate = "Yesterday";
    return (
      <View style={styles.dateSeparator}>
        <View style={styles.dateLine} />
        <Text style={styles.dateText}>{displayDate}</Text>
        <View style={styles.dateLine} />
      </View>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleImagePress = (imageUrl: string) => {
    Alert.alert("Image View", "Full screen image viewer coming soon");
  };

  const handleDocumentPress = async (documentUrl: string, fileName: string) => {
    try {
      const localUri = FileSystem.cacheDirectory + fileName.replace(/[^a-zA-Z0-9.]/g, '_');
      const { uri } = await FileSystem.downloadAsync(documentUrl, localUri);
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available", "Sharing is not available on your device.");
        return;
      }
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Error handling document press:", error);
      Alert.alert("Error", "Could not open or download document.");
    }
  };

  const renderMessage = ({ item }: { item: PreAcceptanceChatMessage }) => {
    const isSentByMe = item.senderId === currentUser?.uid;
    if (!item.createdAt?.toDate) return null;
    
    return (
      <View style={[styles.messageContainer, isSentByMe ? styles.myMessageContainer : styles.otherMessageContainer]}>
        <View style={[styles.messageBubble, isSentByMe ? styles.myMessageBubble : styles.otherMessageBubble]}>
          {item.text ? (
            <Text style={[styles.messageText, isSentByMe ? styles.myMessageText : styles.otherMessageText]}>
              {item.text}
            </Text>
          ) : null}
          
          {item.attachmentUrl && item.attachmentType === 'image' && (
            <Pressable onPress={() => handleImagePress(item.attachmentUrl!)}>
              <Image source={{ uri: item.attachmentUrl }} style={styles.imageAttachment} resizeMode="cover" />
              {item.attachmentSize && (
                <Text style={styles.attachmentSize}>{formatFileSize(item.attachmentSize)}</Text>
              )}
            </Pressable>
          )}
          
          {item.attachmentUrl && item.attachmentType === 'document' && (
            <Pressable style={styles.documentAttachment} onPress={() => handleDocumentPress(item.attachmentUrl!, item.attachmentName!)}>
              <File size={24} color={isSentByMe ? "#FFFFFF" : colors.primary} />
              <View style={styles.documentInfo}>
                <Text style={[styles.documentName, isSentByMe ? styles.myMessageText : styles.otherMessageText]}>
                  {item.attachmentName || 'Document'}
                </Text>
                {item.attachmentSize && (
                  <Text style={styles.documentSize}>{formatFileSize(item.attachmentSize)}</Text>
                )}
              </View>
              <Download size={16} color={isSentByMe ? "#FFFFFF" : colors.textTertiary} />
            </Pressable>
          )}
          
          <Text style={[styles.messageTimestamp, isSentByMe ? styles.myTimestamp : styles.otherTimestamp]}>
            {formatTime(item.createdAt.toDate())}
          </Text>
        </View>
      </View>
    );
  };

  const renderMessageGroup = ({ item }: { item: { date: string; data: PreAcceptanceChatMessage[] } }) => {
    return (
      <View>
        {renderDateSeparator(item.date)}
        {item.data?.map(msg => (
          <React.Fragment key={msg.id}>
            {renderMessage({ item: msg })}
          </React.Fragment>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat</Text>
          <View style={{ width: 40 }} /> 
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={{ width: 40 }} /> 
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error || "Could not load order details."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayCustomerName = customer?.firstName && customer?.lastName 
    ? `${customer.firstName} ${customer.lastName}` 
    : customer?.displayName || 'Customer';
  const displayAvatar = customer?.profileImageUrl || customer?.photoURL;
  const customerInitials = customer?.firstName && customer?.lastName
    ? `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase()
    : customer?.displayName ? customer.displayName.substring(0, 2).toUpperCase() : 'CU';
  const displayService = (order as any).categories?.join(', ') || order.items?.[0]?.name || 'Service';
  const displayDate = order.createdAt?.toDate?.().toLocaleDateString() || 'N/A';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Chat with Customer</Text>
          <Text style={styles.headerSubtitle}>Order #{orderId.substring(0,8)}</Text>
        </View>
        <View style={{ width: 40 }} /> 
      </View>
      
      {/* Customer Card */}
      <View style={styles.customerCard}>
        {displayAvatar ? (
          <Image source={{ uri: displayAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarInitialsContainer]}>
            <Text style={styles.avatarInitials}>{customerInitials}</Text>
          </View>
        )}
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{displayCustomerName}</Text>
          <Text style={styles.serviceInfo}>{displayService}</Text>
          <View style={styles.serviceDetailRow}>
            <Calendar size={12} color={colors.textTertiary} />
            <Text style={styles.serviceDetailText}>{displayDate}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callButton} onPress={handlePhoneCall}>
          <Phone size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 60 : 0}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={groupMessagesByDate()}
          renderItem={renderMessageGroup}
          keyExtractor={item => item.date}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesListContent}
          showsVerticalScrollIndicator={false}
        />

        {(sending || uploadingAttachment) && (
          <View style={styles.sendingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.sendingText}>Sending...</Text>
          </View>
        )}

        {/* Input Area - disabled for completed orders */}
        {order?.status !== 'Completed' ? (
          <View style={[styles.inputContainer, { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 10) : 10 }]}>
            <Pressable 
              style={styles.attachButton} 
              onPress={() => setShowAttachmentModal(true)} 
              disabled={uploadingAttachment || sending}
            >
              <Paperclip size={22} color={uploadingAttachment || sending ? colors.textLight : colors.primary} />
            </Pressable>
            
            <View style={styles.textInputWrapper}> 
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor={colors.textLight}
                value={message}
                onChangeText={setMessage}
                multiline
              />
            </View>
            
            <IconButton
              icon="send"
              size={24}
              iconColor="#FFFFFF"
              style={[styles.sendButton, (!message.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={sending || uploadingAttachment || !message.trim()}
            />
          </View>
        ) : (
          <View style={styles.completedMessageContainer}>
            <Text style={styles.completedMessageText}>
              This order is completed. You can view previous messages but cannot send new ones.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Attachment Modal */}
      <Modal
        visible={showAttachmentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAttachmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Attachment</Text>
              <Pressable onPress={() => setShowAttachmentModal(false)} style={styles.closeButton}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>
            
            <View style={styles.attachmentOptions}>
              <Pressable style={styles.attachmentOption} onPress={handlePickImage}>
                <View style={[styles.optionIcon, { backgroundColor: colors.primaryLight }]}>
                  <ImageIcon size={24} color={colors.primary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Photo Library</Text>
                  <Text style={styles.optionDescription}>Choose from gallery</Text>
                </View>
              </Pressable>
              
              <Pressable style={styles.attachmentOption} onPress={handlePickDocument}>
                <View style={[styles.optionIcon, { backgroundColor: colors.dangerLight }]}>
                  <File size={24} color={colors.danger} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Document</Text>
                  <Text style={styles.optionDescription}>PDF, Word, Text files</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    color: colors.textTertiary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    color: colors.primary,
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  
  // Customer Card
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  avatarInitialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  avatarInitials: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  customerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  serviceInfo: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDetailText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textTertiary,
    marginLeft: 4,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  
  // Messages List
  messagesList: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
  },
  messagesListContent: {
    padding: 16,
    paddingBottom: 8,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dateText: {
    color: colors.textTertiary,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  
  // Message Bubbles
  messageContainer: {
    marginVertical: 4,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: colors.textPrimary,
  },
  messageTimestamp: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    textAlign: 'right',
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: colors.textTertiary,
  },
  
  // Attachments
  imageAttachment: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginTop: 5,
    marginBottom: 5,
  },
  attachmentSize: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.textTertiary,
    marginTop: 4,
  },
  documentAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 5,
    backgroundColor: colors.surfaceAlt,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  documentSize: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.textTertiary,
  },
  
  // Sending Indicator
  sendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sendingText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  
  // Input Area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 22,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    maxHeight: 100,
  },
  completedMessageContainer: {
    padding: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  completedMessageText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.warning,
    textAlign: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentOptions: {
    padding: 20,
    gap: 12,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: 16,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textTertiary,
  },
});
