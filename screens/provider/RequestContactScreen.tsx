import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, // Keep for main structure if needed, but FlatList for messages
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  FlatList, // Import FlatList
  Dimensions, // Import Dimensions
  Pressable, // Import Pressable
  Animated, // Import Animated
  Modal,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, MessageCircle, Phone, Calendar, Clock, Paperclip, Image as ImageIcon, Mic, File, Download, X } from 'lucide-react-native';
import { RepairOrder } from '@/types/orders';
import { auth, firestore, storage } from '@/lib/firebase';
import {
  doc, getDoc, onSnapshot, collection, query, orderBy, addDoc,
  serverTimestamp, Timestamp, setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Define structure for User document (adjust based on your actual structure)
interface UserProfile {
  displayName?: string;
  profileImageUrl?: string;
  // Add other fields if needed
}

// Define structure for Message document
interface PreAcceptanceChatMessage { // Renamed from Message
  id: string;
  senderId: string; // Renamed from senderUid
  text?: string; // Make text optional
  createdAt: Timestamp;
  sentBy: 'customer' | 'provider'; // Added sentBy
  attachmentUrl?: string; // New field for attachment URL
  attachmentType?: 'image' | 'document'; // Updated - removed camera type
  attachmentName?: string;
  attachmentSize?: number;
}

type Props = NativeStackScreenProps<ProviderStackParamList, 'RequestContact'>;

export default function RequestContactScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<PreAcceptanceChatMessage[]>([]); // Updated type
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch Order and Customer details
  useEffect(() => {
    setLoading(true);
    const orderDocRef = doc(firestore, 'repairOrders', orderId);

    const unsubscribeOrder = onSnapshot(orderDocRef, async (docSnap) => {
      console.log("Order Snapshot received. Exists:", docSnap.exists());
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as RepairOrder;
        console.log("Order Data:", orderData);
        setOrder(orderData);
        setError(null);

        // Fetch customer data once order is loaded
        if (orderData.customerId) {
          const customerDocRef = doc(firestore, 'users', orderData.customerId);
          try {
            const customerDoc = await getDoc(customerDocRef);
            console.log("Customer Snapshot received. Exists:", customerDoc.exists());
            if (customerDoc.exists()) {
              console.log("Customer Data:", customerDoc.data());
              setCustomer(customerDoc.data() as UserProfile);
            } else {
              console.warn("Customer document not found for ID:", orderData.customerId);
              setCustomer(null); // Handle customer not found
            }
          } catch (customerError) {
            console.error("Error fetching customer data:", customerError);
            setError("Failed to load customer details.");
          }
        } else {
            setCustomer(null);
        }

      } else {
        setError("Order not found.");
        setOrder(null);
        setCustomer(null);
      }
      // Keep loading true until messages are also loaded (in next effect)
    }, (err) => {
      console.error("Error fetching order details (onSnapshot):", err); // Log specific error location
      setError("Failed to load order details.");
      setLoading(false);
    });

    return () => unsubscribeOrder(); // Cleanup order listener
  }, [orderId]);

  // Fetch Messages
  useEffect(() => {
    if (!order) return; // Wait for order to load

    let chatCollectionPath = 'preAcceptanceChats'; // Default to pre-acceptance
    if (order.status === 'Accepted' || order.status === 'InProgress') {
      chatCollectionPath = 'activeChat';
    }

    const messagesRef = collection(firestore, 'repairOrders', orderId, chatCollectionPath);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
      console.log("Messages Snapshot received. Size:", querySnapshot.size);
      const fetchedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PreAcceptanceChatMessage)); // Updated type
      console.log("Fetched Messages:", fetchedMessages);
      setMessages(fetchedMessages);
      setLoading(false); // Stop loading after messages (and order/customer) are fetched
       // Scroll to bottom when messages load/update
       setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, (err) => {
      console.error("Error fetching messages (onSnapshot):", err); // Log specific error location
      setError("Failed to load messages.");
      setLoading(false);
    });

    return () => unsubscribeMessages(); // Cleanup messages listener
  }, [orderId, order]); // Rerun when orderId or order object changes

  // Scroll to bottom when messages change (additional safety measure)
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Fade in animation for the screen (from customer screen)
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Enhanced image picker with multiple selection
  const handlePickImage = async () => {
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

  // Document picker function
  const handlePickDocument = async () => {
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

  // Enhanced send attachment function
  const handleSendAttachment = async (uri: string, type: 'image' | 'document', chatCollectionPath: string, fileName?: string, fileSize?: number) => {
    if (!currentUser || !order) return;
    setUploadingAttachment(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Validate file size (10MB limit)
      if (blob.size > 10 * 1024 * 1024) {
        Alert.alert("File Too Large", "Please select a file smaller than 10MB.");
        return;
      }

      const fileExtension = fileName?.split('.').pop() || (type === 'image' ? 'jpg' : 'pdf');
      const uploadFileName = `${Date.now()}-${currentUser.uid}-${fileName || `file.${fileExtension}`}`;
      const attachmentRef = ref(storage, `chatAttachments/${chatCollectionPath}/${orderId}/${uploadFileName}`);
      
      await uploadBytes(attachmentRef, blob);
      const downloadURL = await getDownloadURL(attachmentRef);

      const messagesRef = collection(firestore, 'repairOrders', orderId, chatCollectionPath);
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
    console.log("handleSendMessage called. currentUser:", !!currentUser, "order:", !!order, "message:", message);
    if ((!message.trim() && !uploadingAttachment) || !currentUser || !order || !order.customerId) {
        console.log("handleSendMessage: Preconditions not met.");
        return;
    }
    
    setSending(true); // Combined with uploadingAttachment
    const messageText = message;
    setMessage(''); // Clear input immediately

    let chatCollectionPath = 'preAcceptanceChats'; // Default to pre-acceptance
    if (order && (order.status === 'Accepted' || order.status === 'InProgress')) {
      chatCollectionPath = 'activeChat';
    }
    
    const messagesRef = collection(firestore, 'repairOrders', orderId, chatCollectionPath);

    try {
      console.log(`Adding message to repairOrders/${orderId}/${chatCollectionPath}`);
      if (messageText) { // Only send if there is text
        await addDoc(messagesRef, {
          senderId: currentUser.uid, // Renamed from senderUid
          text: messageText,
          createdAt: serverTimestamp(),
          sentBy: 'provider' // Added sentBy
        });
      }
      console.log("Message added successfully.");
      
      // Scroll to bottom after sending
       setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    } catch (error) {
      console.error("Firestore Error sending message:", error); // Log specific error
      Alert.alert("Error", "Could not send message.");
      setMessage(messageText); // Restore message on error
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

  // --- Helper functions from MechanicChatScreen ---
  const formatTime = (date: Date) => {
    // Defensive check
    if (!date || !(date instanceof Date)) return 'N/A'; 
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
  };

  const groupMessagesByDate = () => {
    const groupedMessages: { date: string; data: PreAcceptanceChatMessage[] }[] = [];
    messages?.forEach((message) => {
      if (!message.createdAt?.toDate) {
        return; 
      }
      const messageDate = message.createdAt.toDate();
      const dateString = messageDate.toDateString();
      const existingGroup = groupedMessages.find(group => group.date === dateString);
      if (existingGroup) {
        existingGroup.data.push(message);
      } else {
        groupedMessages.push({ date: dateString, data: [message] });
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

  const renderMessage = ({ item }: { item: PreAcceptanceChatMessage }) => {
    const isSentByMe = item.senderId === currentUser?.uid; // Updated from senderUid
    if (!item.createdAt?.toDate) return null;
    
    const FileIconComponent = getFileIcon(item.attachmentType, item.attachmentName);
    
    return (
      <View style={[styles.messageContainer, isSentByMe ? styles.userMessageContainer : styles.mechanicMessageContainer]}>
        <LinearGradient
          colors={isSentByMe ? ['#00C2FF', '#0080FF'] : ['#2A3555', '#272A3A']} // Match customer UI
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.messageBubble, isSentByMe ? styles.userMessageBubble : styles.mechanicMessageBubble]}
        >
          {/* Text content */}
          {item.text ? (
            <Text style={[styles.messageText, isSentByMe ? styles.userMessageText : styles.mechanicMessageText]}>
              {item.text}
            </Text>
          ) : null}
          
          {/* Image Attachments */}
          {item.attachmentUrl && (item.attachmentType === 'image') && (
            <Pressable onPress={() => handleImagePress(item.attachmentUrl!)}>
              <Image source={{ uri: item.attachmentUrl }} style={styles.chatImageAttachment} resizeMode="cover" />
              {item.attachmentSize && (
                <Text style={styles.attachmentSize}>{formatFileSize(item.attachmentSize)}</Text>
              )}
            </Pressable>
          )}
          
          {/* Document Attachments */}
          {item.attachmentUrl && item.attachmentType === 'document' && (
            <Pressable style={styles.documentAttachment} onPress={() => handleDocumentPress(item.attachmentUrl!, item.attachmentName!)}>
              <FileIconComponent size={24} color={isSentByMe ? "#FFFFFF" : "#00F0FF"} />
              <View style={styles.documentInfo}>
                <Text style={[styles.documentName, isSentByMe ? styles.userMessageText : styles.mechanicMessageText]}>
                  {item.attachmentName || 'Document'}
                </Text>
                {item.attachmentSize && (
                  <Text style={styles.documentSize}>{formatFileSize(item.attachmentSize)}</Text>
                )}
              </View>
              <Download size={16} color={isSentByMe ? "#FFFFFF" : "#7A89FF"} />
            </Pressable>
          )}
          
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTimestamp, isSentByMe ? styles.userTimestamp : styles.mechanicTimestamp]}>
              {formatTime(item.createdAt.toDate())}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderMessageGroup = ({ item }: { item: { date: string; data: PreAcceptanceChatMessage[] } }) => {
    return (
      <View>
        {renderDateSeparator(item.date)}
        {item.data?.map(message => (
          <React.Fragment key={message.id}>
            {renderMessage({ item: message })}
          </React.Fragment>
        ))}
      </View>
    );
  };
  // --- End Helper Functions ---

  // Helper functions
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type?: string, fileName?: string) => {
    if (type === 'image') return ImageIcon;
    if (fileName?.toLowerCase().includes('.pdf')) return File;
    return File;
  };

  const handleImagePress = (imageUrl: string) => {
    Alert.alert("Image View", "Full screen image viewer - implement with react-native-image-zoom-viewer or similar");
  };

  const handleDocumentPress = async (documentUrl: string, fileName: string) => {
    try {
      // Create a local file URI
      const localUri = FileSystem.cacheDirectory + fileName;
      
      console.log('Downloading document from:', documentUrl);
      console.log('Saving document to:', localUri);

      // Download the file
      const { uri } = await FileSystem.downloadAsync(documentUrl, localUri);
      console.log('Downloaded to:', uri);

      // Share the downloaded file
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available", "Sharing is not available on your device.");
        return;
      }
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Error handling document press:", error);
      Alert.alert("Error", "Could not open or download document. Please try again.");
    }
  };

  // --- Render Logic --- 
  if (loading) {
     return (
      <SafeAreaView style={styles.container}>
         {/* Basic Header for Loading */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#00F0FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CONTACT CLIENT</Text>
          <View style={{ width: 24 }} /> 
        </View>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#00F0FF" />
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
            <ArrowLeft size={24} color="#00F0FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={{ width: 24 }} /> 
        </View>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error || "Could not load order details."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Prepare display data
  const displayCustomerName = customer?.displayName || order.customerId.substring(0, 8) + '...';
  const displayAvatar = customer?.profileImageUrl || 'https://via.placeholder.com/48?text=User';
  const displayService = order.items[0]?.name || 'Service N/A';
  const displayDate = order.createdAt?.toDate().toLocaleDateString() || 'N/A';
  let displayTime = 'N/A';
  try {
      if (order.createdAt?.toDate) {
          displayTime = order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
  } catch (e) { console.error("Error formatting time:", e); }

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>CONTACT CLIENT</Text>
          <Text style={styles.headerSubtitle}>{orderId}</Text>
        </View>
        <View style={{ width: 24 }} /> 
      </View>
      
      <View style={styles.customerCard}>
        <Image source={{ uri: displayAvatar }} style={styles.avatar} />
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{displayCustomerName.toUpperCase()}</Text>
          <Text style={styles.serviceInfo}>{displayService}</Text>
          <View style={styles.serviceDetailRow}>
            <Calendar size={12} color="#7A89FF" />
            <Text style={styles.serviceDetailText}>{displayDate}</Text>
            <Clock size={12} color="#7A89FF" />
            <Text style={styles.serviceDetailText}>{displayTime}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callButtonInline} onPress={handlePhoneCall}>
           <View style={styles.callButtonIconContainerInline}>
             <Phone size={20} color="#00F0FF" />
           </View>
           <Text style={styles.callButtonTextInline}>CALL</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 47 + 10 : 0}
        style={{ flex: 1 }}
      >
         {/* Message List using FlatList directly */}
         <FlatList
             ref={flatListRef}
             data={groupMessagesByDate()}
             renderItem={renderMessageGroup}
             keyExtractor={item => item.date}
             style={styles.messagesListContainer}
             contentContainerStyle={styles.messagesListContent}
             showsVerticalScrollIndicator={false}
         />

          {/* Sending Indicator (copied from customer screen) */}
          {sending && (
             <View style={styles.loadingContainer}>
               <LinearGradient
                 colors={['rgba(0, 240, 255, 0.2)', 'rgba(122, 137, 255, 0.2)']}
                 start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                 style={styles.loadingBubble}
               >
                 <ActivityIndicator size="small" color="#00F0FF" />
                 <Text style={styles.sendingText}>Sending...</Text>
               </LinearGradient>
             </View>
          )}

         {/* Input Area - Copied from Customer screen */} 
          <LinearGradient
             colors={['#121827', '#0A0F1E']}
             style={[
               styles.inputContainer,
               { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 8 }
             ]}
           >
             <Pressable 
               style={styles.attachButton} 
               onPress={() => setShowAttachmentModal(true)} 
               disabled={uploadingAttachment || sending}
             >
               <LinearGradient colors={['#7A89FF', '#5A6AD0']} style={styles.iconButton}>
                   <Paperclip size={18} color={uploadingAttachment || sending ? "#555" : "#FFFFFF"} />
               </LinearGradient>
             </Pressable>
             <View style={styles.textInputContainer}> 
               <TextInput
                 style={styles.textInput}
                 placeholder={"Type a message..."}
                 placeholderTextColor="#6E7191"
                 value={message}
                 onChangeText={setMessage}
                 multiline
               />
             </View>
             <View style={styles.rightButtons}>
               <Pressable 
                 style={styles.sendButton} 
                 onPress={handleSendMessage}
                 disabled={sending || uploadingAttachment || !message.trim()}
               >
                 <LinearGradient colors={['#00C2FF', '#0080FF']} style={styles.sendGradient}>
                     <Send size={18} color="#FFFFFF" />
                 </LinearGradient>
               </Pressable>
             </View>
           </LinearGradient>
      </KeyboardAvoidingView>

      {/* Attachment Selection Modal */}
      <Modal
        visible={showAttachmentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAttachmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1A2138', '#0A0F1E']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Attachment</Text>
                <Pressable onPress={() => setShowAttachmentModal(false)} style={styles.closeButton}>
                  <X size={24} color="#FFFFFF" />
                </Pressable>
              </View>
              
              <View style={styles.attachmentOptions}>
                <Pressable style={styles.attachmentOption} onPress={handlePickImage}>
                  <LinearGradient colors={['#7A89FF', '#5A6AD0']} style={styles.optionIcon}>
                    <ImageIcon size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Photo Library</Text>
                    <Text style={styles.optionDescription}>Choose from gallery</Text>
                  </View>
                </Pressable>
                
                <Pressable style={styles.attachmentOption} onPress={handlePickDocument}>
                  <LinearGradient colors={['#FF6B6B', '#E74C3C']} style={styles.optionIcon}>
                    <File size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Document</Text>
                    <Text style={styles.optionDescription}>PDF, Word, Text files</Text>
                  </View>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window'); // Get width for styling

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030515',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  backButton: {
    padding: 8,
    borderRadius: 20, // Match customer style
    backgroundColor: 'rgba(0, 240, 255, 0.1)', // Match customer style
  },
  headerTitleContainer: { // From customer style
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { // From customer style
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF', // White title from customer style
    letterSpacing: 0.5,
  },
  headerSubtitle: { // From customer style (display order ID?)
    color: '#7A89FF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#00F0FF',
  },
  customerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: 1,
  },
  serviceInfo: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    marginBottom: 2,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDetailText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    marginLeft: 4,
    marginRight: 8,
  },
  callButtonInline: {
      alignItems: 'center',
      marginLeft: 16,
      justifyContent: 'center', 
  },
  callButtonIconContainerInline: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
      borderWidth: 1,
      borderColor: '#00F0FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
  },
  callButtonTextInline: {
      fontSize: 10,
      fontFamily: 'Inter_600SemiBold',
      color: '#00F0FF',
      letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderWidth: 1,
    borderTopColor: '#2A3555',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: 'rgba(18, 24, 39, 0.8)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A3555',
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    paddingVertical: 10,
    maxHeight: 100,
  },
  dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dateLine: { flex: 1, height: 1, backgroundColor: 'rgba(42, 53, 85, 0.5)' },
  dateText: { color: '#7A89FF', fontSize: 12, fontFamily: 'Inter_500Medium', marginHorizontal: 10, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(122, 137, 255, 0.1)', borderRadius: 10 },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    color: '#00F0FF',
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  errorText: {
    color: '#FF3D71',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  rightButtons: { flexDirection: 'row', },
  attachButton: { marginHorizontal: 2, },
  mediaButton: { marginHorizontal: 2, },
  iconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', },
  loadingContainer: { paddingHorizontal: 16, paddingVertical: 8, alignItems: 'flex-start', },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderBottomLeftRadius: 4, },
  sendingText: {
    color: '#00F0FF',
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessageContainer: { // Container for alignment
    alignSelf: 'flex-end',
  },
  mechanicMessageContainer: { // Container for alignment
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 14,
    paddingBottom: 10,
    marginBottom: 12, // Duplicates messageContainer marginBottom, check if needed
    borderRadius: 20,
    maxWidth: '80%', // Duplicates messageContainer maxWidth, check if needed
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userMessageBubble: {
    borderBottomRightRadius: 4, // Match customer style
  },
  mechanicMessageBubble: {
    borderBottomLeftRadius: 4, // Match customer style
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22, 
    marginBottom: 6, 
  },
  userMessageText: {
    color: '#FFFFFF', 
  },
  mechanicMessageText: {
    color: '#FFFFFF', 
  },
  messageTimestamp: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    textAlign: 'right',
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  mechanicTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageFooter: { // Container for timestamp etc.
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end'
  },
  messagesListContainer: { // Added missing style
      flex: 1, 
  },
  messagesListContent: { // Added missing style
      padding: 16,
  },
  sendButton: { // Added missing style
    width: 42,
    height: 42,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendGradient: { // Added missing style
      width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center'
  },
  chatImageAttachment: { // New style for image attachments
    width: 200, 
    height: 200,
    borderRadius: 10,
    marginTop: 5,
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#0A0F1E',
    borderRadius: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalGradient: {
    borderRadius: 20,
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  attachmentOptions: {
    padding: 20,
    gap: 16,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(42, 53, 85, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  documentAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(42, 53, 85, 0.5)',
    marginTop: 5,
    marginBottom: 5,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  attachmentSize: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    marginTop: 4,
  },
}); 