import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, MessageCircle, Phone, Calendar, Clock } from 'lucide-react-native';
import { RepairOrder } from '@/types/orders';
import { auth, firestore } from '@/lib/firebase';
import {
  doc, getDoc, onSnapshot, collection, query, orderBy, addDoc,
  serverTimestamp, Timestamp, setDoc
} from 'firebase/firestore';

// Define structure for User document (adjust based on your actual structure)
interface UserProfile {
  displayName?: string;
  profileImageUrl?: string;
  // Add other fields if needed
}

// Define structure for Message document
interface Message {
  id: string;
  senderUid: string;
  text: string;
  createdAt: Timestamp;
}

type Props = NativeStackScreenProps<ProviderStackParamList, 'RequestContact'>;

export default function RequestContactScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [customer, setCustomer] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const currentUser = auth.currentUser;

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

    const messagesRef = collection(firestore, 'chats', orderId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
      console.log("Messages Snapshot received. Size:", querySnapshot.size);
      const fetchedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      console.log("Fetched Messages:", fetchedMessages);
      setMessages(fetchedMessages);
      setLoading(false); // Stop loading after messages (and order/customer) are fetched
       // Scroll to bottom when messages load/update
       setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, (err) => {
      console.error("Error fetching messages (onSnapshot):", err); // Log specific error location
      setError("Failed to load messages.");
      setLoading(false);
    });

    return () => unsubscribeMessages(); // Cleanup messages listener
  }, [orderId, order]); // Rerun when orderId or order object changes

  const handleSendMessage = async () => {
    console.log("handleSendMessage called. currentUser:", !!currentUser, "order:", !!order, "message:", message);
    if (!message.trim() || !currentUser || !order || !order.customerId) {
        console.log("handleSendMessage: Preconditions not met.");
        return;
    }
    
    setSending(true);
    const messageText = message;
    setMessage(''); // Clear input immediately

    const chatId = order.id;
    const chatDocRef = doc(firestore, 'chats', chatId);
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');

    try {
      console.log(`Ensuring chat doc exists: chats/${chatId}`);
      await setDoc(chatDocRef, { 
        participants: [order.customerId, currentUser.uid] 
      }, { merge: true });
      console.log(`Chat doc ensured. Adding message to chats/${chatId}/messages`);
      await addDoc(messagesRef, {
        senderUid: currentUser.uid,
        text: messageText,
        createdAt: serverTimestamp()
      });
      console.log("Message added successfully.");
      
      // Scroll to bottom after sending
       setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

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
  const displayTime = order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'N/A';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CONTACT CLIENT</Text>
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
      </View>
      
      <View style={styles.contactOptions}>
        <TouchableOpacity style={styles.contactOption} onPress={handlePhoneCall}>
          <View style={styles.contactIconContainer}>
            <Phone size={20} color="#00F0FF" />
          </View>
          <Text style={styles.contactOptionText}>CALL</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.contactOption, styles.activeContactOption]}>
          <View style={[styles.contactIconContainer, styles.activeIconContainer]}>
            <MessageCircle size={20} color="#0A0F1E" />
          </View>
          <Text style={styles.activeContactOptionText}>MESSAGE</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.divider} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.messageContainer}
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesScroll}
          // Scroll to bottom on content size change
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })} 
        >
          {messages.map(msg => {
             const isSentByMe = msg.senderUid === currentUser?.uid;
             return (
                <View 
                  key={msg.id} 
                  style={[
                    styles.messageBubble,
                    isSentByMe ? styles.sentMessage : styles.receivedMessage
                  ]}
                >
                  <Text style={styles.messageText}>{msg.text}</Text>
                  <Text style={styles.messageTimestamp}>
                    {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'sending...'}
                  </Text>
                </View>
             );
            })}
        </ScrollView>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#7A89FF"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!message.trim() || sending) && styles.disabledSendButton]}
            onPress={handleSendMessage}
            disabled={!message.trim() || sending}
          >
            <Send size={20} color={message.trim() && !sending ? "#0A0F1E" : "#7A89FF"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
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
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
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
  contactOptions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contactOption: {
    alignItems: 'center',
    minWidth: 100,
  },
  contactIconContainer: {
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
  contactOptionText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  activeContactOption: {
    opacity: 1,
  },
  activeIconContainer: {
    backgroundColor: '#00F0FF',
  },
  activeContactOptionText: {
    color: '#00F0FF',
    fontFamily: 'Inter_700Bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A3555',
  },
  messageContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesScroll: {
    flex: 1,
    paddingVertical: 16,
  },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginBottom: 8,
    maxWidth: '80%',
  },
  sentMessage: {
    backgroundColor: '#00F0FF',
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    backgroundColor: '#2A3555',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#0A0F1E',
  },
  messageTimestamp: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(10, 15, 30, 0.6)',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  messageInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  disabledSendButton: {
    backgroundColor: 'rgba(122, 137, 255, 0.2)',
  },
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
}); 