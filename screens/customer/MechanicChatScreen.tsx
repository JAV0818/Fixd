import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  FlatList, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, Mic, CheckCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import { Timestamp, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';

type MechanicChatScreenRouteProp = RouteProp<RootStackParamList, 'MechanicChat'>;
type MechanicChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MechanicChat'>;

// Message type definition
type Message = {
  id: string;
  text: string;
  createdAt: Timestamp;
  senderId: string;
  sentBy: 'customer' | 'provider';
  // For potential image/attachment support
  attachment?: { 
    type: 'image' | 'document';
    url: string;
  };
};

export default function MechanicChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MechanicChatScreenNavigationProp>();
  const route = useRoute<MechanicChatScreenRouteProp>();
  const { orderId, mechanicName } = route.params;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const currentUser = auth.currentUser;

  // Fetch messages using onSnapshot
  useEffect(() => {
    if (!orderId || !currentUser) {
        setLoading(false);
        setError("Missing order ID or user information.");
        return;
    }

    setLoading(true);
    setError(null);

    const messagesRef = collection(firestore, 'repairOrders', orderId, 'activeChat');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(fetchedMessages);
      setLoading(false);
       // Scroll to bottom when messages load/update
       setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, (err) => {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages.");
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();

  }, [orderId, currentUser]);

  // Scroll to bottom when messages change (additional safety measure)
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Fade in animation for the screen
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentUser || !orderId) {
        console.log("Send message preconditions not met (text, user, orderId)");
        return;
    }
    
    const messageText = inputText.trim();
    setInputText(''); // Clear input immediately
    setSending(true);

    const messagesCollectionRef = collection(firestore, 'repairOrders', orderId, 'activeChat');

    try {
      // Add the new message
      await addDoc(messagesCollectionRef, {
        senderId: currentUser.uid,
        text: messageText,
        createdAt: serverTimestamp(),
        sentBy: 'customer'
      });

      // Scroll to bottom after sending
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    } catch (error) {
      console.error("Firestore Error sending message:", error);
      Alert.alert("Error", "Could not send message.");
      setInputText(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groupedMessages: { date: string; data: Message[] }[] = [];
    
    messages?.forEach((message) => {
      // Defensively check createdAt before using it
      if (!message.createdAt?.toDate) {
        return; // Skip message if createdAt is not a valid Timestamp yet
      }
      const messageDate = message.createdAt.toDate();
      const dateString = messageDate.toDateString();
      
      const existingGroup = groupedMessages.find(group => group.date === dateString);
      
      if (existingGroup) {
        existingGroup.data.push(message);
      } else {
        groupedMessages.push({
          date: dateString,
          data: [message],
        });
      }
    });
    
    return groupedMessages;
  };

  const renderDateSeparator = (date: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    let displayDate = date;
    if (date === today) {
      displayDate = "Today";
    } else if (date === yesterday) {
      displayDate = "Yesterday";
    }
    
    return (
      <View style={styles.dateSeparator}>
        <View style={styles.dateLine} />
        <Text style={styles.dateText}>{displayDate}</Text>
        <View style={styles.dateLine} />
      </View>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // Check if the sender is the currently logged-in user
    const isUser = item.senderId === currentUser?.uid;

    // Defensively check createdAt before rendering
    if (!item.createdAt?.toDate) { 
      return null; 
    }
    
    return (
      <View style={[
        styles.messageContainer, 
        isUser ? styles.userMessageContainer : styles.mechanicMessageContainer
      ]}>
        <LinearGradient
          colors={isUser ? ['#00C2FF', '#0080FF'] : ['#2A3555', '#272A3A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.mechanicMessageBubble,
          ]}
        >
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.mechanicMessageText
          ]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTimestamp,
              isUser ? styles.userTimestamp : styles.mechanicTimestamp
            ]}>
              {formatTime(item.createdAt.toDate())}
            </Text>
            {/* Read status removed - Implement later if needed */}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderMessageGroup = ({ item }: { item: { date: string; data: Message[] } }) => {
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

  // Handle Loading State
  if (loading) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim, paddingTop: insets.top }]}>
        <View style={styles.header}>
           <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
             <ArrowLeft size={24} color="#FFFFFF" />
           </Pressable>
          <Text style={styles.headerTitle}>{mechanicName || 'MECHANIC'}</Text>
           <View style={{width: 24}}/>{/* Spacer */}
         </View>
         <View style={styles.centeredContainer}>
           <ActivityIndicator size="large" color="#00F0FF" />
           <Text style={styles.loadingText}>Loading Messages...</Text>
         </View>
      </Animated.View>
    );
  }

  // Handle Error State
  if (error) {
      return (
          <Animated.View style={[styles.container, { opacity: fadeAnim, paddingTop: insets.top }]}>
             <View style={styles.header}>
                 {/* ... header ... */}
             </View>
             <View style={styles.centeredContainer}>
                 <Text style={styles.errorText}>{error}</Text>
             </View>
          </Animated.View>
      );
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { paddingTop: insets.top, opacity: fadeAnim }
      ]}
    >
      {/* Header */}
      <LinearGradient
        colors={['#121827', '#0A0F1E']}
        style={styles.header}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{mechanicName || 'Mechanic'}</Text>
          <Text style={styles.headerSubtitle}>Order #{orderId}</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Wrap FlatList and Input Area in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }} // Ensure KAV takes up remaining space
        keyboardVerticalOffset={Platform.OS === "ios" ? (insets.top + 60) : 0} // Header height + some padding
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={groupMessagesByDate()}
          renderItem={renderMessageGroup}
          keyExtractor={item => item.date}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />
        
        {/* Loading indicator */}
        {sending && (
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={['rgba(0, 240, 255, 0.2)', 'rgba(122, 137, 255, 0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loadingBubble}
            >
              <ActivityIndicator size="small" color="#00F0FF" />
              <Text style={styles.loadingText}>Mechanic is typing</Text>
              <View style={styles.typingDots}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDotMiddle]} />
                <View style={styles.typingDot} />
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Input Area */}
        <LinearGradient
          colors={['#121827', '#0A0F1E']}
          style={[
            styles.inputContainer,
            // Use a smaller, consistent padding for the input bar itself
            { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 10) : 10 }
          ]}
        >
          <Pressable style={styles.attachButton}>
            <LinearGradient
              colors={['#7A89FF', '#5A6AD0']}
              style={styles.iconButton}
            >
              <Paperclip size={18} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#6E7191"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>
          
          <View style={styles.rightButtons}>
            {inputText.length === 0 ? (
              <>
                <Pressable style={styles.mediaButton}>
                  <LinearGradient
                    colors={['#7A89FF', '#5A6AD0']}
                    style={styles.iconButton}
                  >
                    <ImageIcon size={18} color="#FFFFFF" />
                  </LinearGradient>
                </Pressable>
                <Pressable style={styles.mediaButton}>
                  <LinearGradient
                    colors={['#7A89FF', '#5A6AD0']}
                    style={styles.iconButton}
                  >
                    <Mic size={18} color="#FFFFFF" />
                  </LinearGradient>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.sendButton} onPress={handleSendMessage}>
                <LinearGradient
                  colors={['#00C2FF', '#0080FF']}
                  style={styles.sendGradient}
                >
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

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030515',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
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
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#7A89FF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  mechanicMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 20,
    padding: 14,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userMessageBubble: {
    borderBottomRightRadius: 4,
  },
  mechanicMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    marginBottom: 6,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  mechanicMessageText: {
    color: '#FFFFFF',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageTimestamp: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  mechanicTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  readIcon: {
    marginLeft: 4,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(42, 53, 85, 0.5)',
  },
  dateText: {
    color: '#7A89FF',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginHorizontal: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 10,
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  loadingText: {
    color: '#7A89FF',
    fontSize: 12,
    marginLeft: 8,
    fontFamily: 'Inter_500Medium',
  },
  typingDots: {
    flexDirection: 'row',
    marginLeft: 6,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00F0FF',
    marginHorizontal: 1,
  },
  typingDotMiddle: {
    marginTop: -2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,
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
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 10,
    maxHeight: 100,
  },
  rightButtons: {
    flexDirection: 'row',
  },
  attachButton: {
    marginHorizontal: 2,
  },
  mediaButton: {
    marginHorizontal: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    marginTop: 16,
  },
}); 