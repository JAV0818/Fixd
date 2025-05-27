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
  Dimensions,
  Pressable,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator'; // Changed from ProviderStackParamList
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, Mic } from 'lucide-react-native';
import { RepairOrder } from '@/types/orders'; // Assuming this type is general enough
import { auth, firestore } from '@/lib/firebase';
import {
  doc, getDoc, onSnapshot, collection, query, orderBy, addDoc,
  serverTimestamp, Timestamp
} from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

// Define structure for PreAcceptanceChatMessage (same as in RequestContactScreen)
interface PreAcceptanceChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
  sentBy: 'customer' | 'provider';
}

// Define structure for the other user (could be a generic provider or specific one)
interface OtherUser {
  displayName?: string;
  profileImageUrl?: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'PreAcceptanceChat'>; // Changed to RootStackParamList and 'PreAcceptanceChat'

export default function PreAcceptanceChatScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<PreAcceptanceChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [order, setOrder] = useState<RepairOrder | null>(null);
  // const [otherUserDetails, setOtherUserDetails] = useState<OtherUser | null>(null); // To store details of the provider if needed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth.currentUser;
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch Order details (simplified, as customer may not need full provider details here)
  useEffect(() => {
    setLoading(true);
    const orderDocRef = doc(firestore, 'repairOrders', orderId);

    const unsubscribeOrder = onSnapshot(orderDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as RepairOrder;
        setOrder(orderData);
        setError(null);
        // If needed, fetch details of providers who have sent messages, or assume generic "Support"
      } else {
        setError("Order not found.");
        setOrder(null);
      }
      // setLoading(false); // Moved to messages useEffect
    }, (err) => {
      console.error("Error fetching order details:", err);
      setError("Failed to load order details.");
      setLoading(false);
    });

    return () => unsubscribeOrder();
  }, [orderId]);

  // Fetch Pre-Acceptance Messages
  useEffect(() => {
    if (!order) return;

    const messagesRef = collection(firestore, 'repairOrders', orderId, 'preAcceptanceChats');
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
      console.error("Error fetching pre-acceptance messages:", err);
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

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser || !order) {
        return;
    }
    
    setSending(true);
    const messageText = message;
    setMessage(''); 

    const messagesRef = collection(firestore, 'repairOrders', orderId, 'preAcceptanceChats');

    try {
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        text: messageText,
        createdAt: serverTimestamp(),
        sentBy: 'customer' // Key change: message sent by customer
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error("Firestore Error sending message:", error);
      Alert.alert("Error", "Could not send message.");
      setMessage(messageText); 
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    if (!date || !(date instanceof Date)) return 'N/A'; 
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
  };

  const groupMessagesByDate = () => {
    const groupedMessages: { date: string; data: PreAcceptanceChatMessage[] }[] = [];
    messages?.forEach((msg) => { // Renamed to avoid conflict
      if (!msg.createdAt?.toDate) {
        return; 
      }
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

  const renderMessageItem = ({ item }: { item: PreAcceptanceChatMessage }) => { // Renamed from renderMessage
    const isSentByMe = item.senderId === currentUser?.uid;
    // For customer, 'isSentByMe' means sentBy: 'customer'.
    // If item.sentBy === 'provider', it's from the other side.
    if (!item.createdAt?.toDate) return null; 
    return (
      <View style={[styles.messageContainer, isSentByMe ? styles.userMessageContainer : styles.otherUserMessageContainer]}>
        <LinearGradient
          colors={isSentByMe ? ['#00C2FF', '#0080FF'] : ['#2A3555', '#272A3A']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.messageBubble, isSentByMe ? styles.userMessageBubble : styles.otherUserMessageBubble]}
        >
          <Text style={[styles.messageText, isSentByMe ? styles.userMessageText : styles.otherUserMessageText]}>{item.text}</Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTimestamp, isSentByMe ? styles.userTimestamp : styles.otherUserTimestamp]}>{formatTime(item.createdAt.toDate())}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderMessageGroup = ({ item }: { item: { date: string; data: PreAcceptanceChatMessage[] } }) => {
    return (
      <View>
        {renderDateSeparator(item.date)}
        {item.data?.map(chatMsg => ( // Renamed to avoid conflict
          <React.Fragment key={chatMsg.id}>
            {renderMessageItem({ item: chatMsg })}
          </React.Fragment>
        ))}
      </View>
    );
  };

  if (loading) {
     return (
      <SafeAreaView style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#00F0FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Chat</Text>
          <View style={{ width: 24 }} /> 
        </View>
        <View style={styles.centeredLoadingContainer}>
          <ActivityIndicator size="large" color="#00F0FF" />
          <Text style={styles.loadingText}>Loading Chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
         <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#00F0FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={{ width: 24 }} /> 
        </View>
        <View style={styles.centeredLoadingContainer}>
          <Text style={styles.errorText}>{error || "Could not load order details."}</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Determine the chat title - could be "Chat with Support" or provider name if available
  const chatPartnerName = "Support / Provider"; // Placeholder

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          {/* For customer, maybe show "Chat about Order" or with Provider if one messaged */}
          <Text style={styles.headerTitle}>Chat with {chatPartnerName}</Text>
          <Text style={styles.headerSubtitle}>Order #{orderId.substring(0,6)}...</Text>
        </View>
        <View style={{ width: 24 }} /> 
      </View>
      
      {/* Optional: Display a small card about the order or context if needed */}
      {/* <View style={styles.contextCard}> ... </View> */}
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 50 : 0} // Adjust offset as needed
        style={{ flex: 1 }}
      >
         <FlatList
             ref={flatListRef}
             data={groupMessagesByDate()}
             renderItem={renderMessageGroup}
             keyExtractor={item => item.date}
             style={styles.messagesListContainer}
             contentContainerStyle={[styles.messagesListContent, { paddingBottom: 10 }]}
             showsVerticalScrollIndicator={false}
         />

          {sending && (
             <View style={styles.sendingIndicatorContainer}>
               <LinearGradient
                 colors={['rgba(0, 240, 255, 0.2)', 'rgba(122, 137, 255, 0.2)']}
                 start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                 style={styles.sendingBubble}
               >
                 <ActivityIndicator size="small" color="#00F0FF" />
                 <Text style={styles.sendingText}>Sending...</Text>
               </LinearGradient>
             </View>
          )}

          <LinearGradient
             colors={['#121827', '#0A0F1E']} // Input area gradient
             style={[
               styles.inputToolbar, // Renamed from inputContainer for clarity
               { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 16 }
             ]}
           >
             <Pressable style={styles.utilityButton}>
               <LinearGradient colors={['#7A89FF', '#5A6AD0']} style={styles.iconButtonWrapper}>
                   <Paperclip size={18} color="#FFFFFF" />
               </LinearGradient>
             </Pressable>
             <View style={styles.textInputWrapper}> 
               <TextInput
                 style={styles.messageTextInput} // Renamed from textInput
                 placeholder="Type your message..." // Customer-centric placeholder
                 placeholderTextColor="#6E7191"
                 value={message}
                 onChangeText={setMessage}
                 multiline
               />
             </View>
             <View style={styles.inputActionButtons}>
               {message.length === 0 ? (
                 <>
                   <Pressable style={styles.utilityButton}>
                     <LinearGradient colors={['#7A89FF', '#5A6AD0']} style={styles.iconButtonWrapper}>
                         <ImageIcon size={18} color="#FFFFFF" />
                     </LinearGradient>
                   </Pressable>
                   <Pressable style={styles.utilityButton}>
                     <LinearGradient colors={['#7A89FF', '#5A6AD0']} style={styles.iconButtonWrapper}>
                         <Mic size={18} color="#FFFFFF" />
                     </LinearGradient>
                   </Pressable>
                 </>
               ) : (
                 <Pressable 
                   style={styles.sendIconWrapper} // Renamed from sendButton
                   onPress={handleSendMessage}
                   disabled={sending}
                 >
                   <LinearGradient colors={['#00C2FF', '#0080FF']} style={styles.sendGradientWrapper}>
                       <Send size={18} color="#FFFFFF" />
                   </LinearGradient>
                 </Pressable>
               )}
             </View>
           </LinearGradient>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#030515', // Darker background consistent with other customer screens
  },
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555', // Standard border color
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.1)', 
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#7A89FF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  // Loading and Error states
  centeredLoadingContainer: { // Renamed from centeredContainer for clarity
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Message list area
  messagesListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesListContent: {
    paddingVertical: 16,
  },
  // Date Separator (same as provider chat)
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A3555',
  },
  dateText: {
    color: '#7A89FF',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginHorizontal: 10,
  },
  // Individual message item
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  userMessageContainer: { // Sent by current user (customer)
    justifyContent: 'flex-end',
    marginLeft: '20%', 
  },
  otherUserMessageContainer: { // Received (from provider/support)
    justifyContent: 'flex-start',
    marginRight: '20%',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%', 
  },
  userMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherUserMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  otherUserMessageText: {
    color: '#E0EFFF',
  },
  messageFooter: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  messageTimestamp: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherUserTimestamp: {
    color: '#7A89FF',
  },
  // Sending indicator
  sendingIndicatorContainer: {
    alignItems: 'flex-end', // Align to right for sent messages
    marginRight: 16,
    marginBottom: 8,
  },
  sendingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  sendingText: {
    color: '#00F0FF',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginLeft: 8,
  },
  // Input Toolbar (bottom area)
  inputToolbar: { // Renamed from inputContainer
    flexDirection: 'row',
    alignItems: 'flex-end', // Align items to bottom for multiline input
    paddingHorizontal: 12,
    paddingTop: 12, // Add some top padding
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
  },
  textInputWrapper: { // Renamed from textInputContainer
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(42, 53, 85, 0.5)', // Input field background
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 0, // Adjust padding for OS
    minHeight: 44, // Ensure decent height
    alignItems: 'center', // Center placeholder text vertically
    marginHorizontal: 8,
  },
  messageTextInput: { // Renamed from textInput
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    maxHeight: 100, // Limit multiline height
    paddingTop: Platform.OS === 'android' ? 8 : 0, // Android multiline padding
    paddingBottom: Platform.OS === 'android' ? 8 : 0,
  },
  inputActionButtons: { // Renamed from rightButtons
    flexDirection: 'row',
    alignItems: 'flex-end', // Align with bottom of input field
    paddingBottom: Platform.OS === 'ios' ? 0 : 8, // Adjust for Android
  },
  utilityButton: { // Renamed from attachButton / mediaButton
    padding: 6,
  },
  iconButtonWrapper: { // Renamed from iconButton
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIconWrapper: { // Renamed from sendButton
    paddingLeft: 6, // Add some space before send icon
    paddingBottom: Platform.OS === 'ios' ? 0 : 2, // Fine-tune alignment
  },
  sendGradientWrapper: { // Renamed from sendGradient
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 