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
  Dimensions
} from 'react-native';
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, Mic, CheckCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';

type MechanicChatScreenRouteProp = RouteProp<RootStackParamList, 'MechanicChat'>;
type MechanicChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MechanicChat'>;

// Message type definition
type Message = {
  id: string;
  text: string;
  timestamp: Date;
  sender: 'user' | 'mechanic';
  read: boolean;
  // For potential image/attachment support
  attachment?: { 
    type: 'image' | 'document';
    url: string;
  };
};

// Mock initial messages (in a real app, these would be fetched from a backend)
const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Hi there! I\'m Michael, your assigned mechanic for the battery jump start service.',
    timestamp: new Date(Date.now() - 35 * 60000), // 35 mins ago
    sender: 'mechanic',
    read: true,
  },
  {
    id: '2',
    text: 'I\'m on my way to your location. Should arrive in about 15-20 minutes.',
    timestamp: new Date(Date.now() - 30 * 60000), // 30 mins ago
    sender: 'mechanic',
    read: true,
  },
  {
    id: '3',
    text: 'Great, thank you! My car is parked near the building entrance.',
    timestamp: new Date(Date.now() - 28 * 60000), // 28 mins ago
    sender: 'user',
    read: true,
  },
  {
    id: '4',
    text: 'Do I need to prepare anything before you arrive?',
    timestamp: new Date(Date.now() - 26 * 60000), // 26 mins ago
    sender: 'user',
    read: true,
  },
  {
    id: '5',
    text: 'No need to prepare anything. I\'ll bring all the necessary equipment. Just make sure you have your keys ready.',
    timestamp: new Date(Date.now() - 20 * 60000), // 20 mins ago
    sender: 'mechanic',
    read: true,
  },
  {
    id: '6',
    text: 'I\'m about 5 minutes away now.',
    timestamp: new Date(Date.now() - 5 * 60000), // 5 mins ago
    sender: 'mechanic',
    read: true,
  },
];

export default function MechanicChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MechanicChatScreenNavigationProp>();
  const route = useRoute<MechanicChatScreenRouteProp>();
  const { orderId, mechanicName } = route.params;
  
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Scroll to bottom on load and when messages change
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

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;
    
    // Create new message
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      timestamp: new Date(),
      sender: 'user',
      read: false,
    };
    
    // Add message to the list
    setMessages([...messages, newMessage]);
    
    // Clear the input field
    setInputText('');
    
    // Simulate mechanic response after a delay
    setLoading(true);
    setTimeout(() => {
      const mechanicResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I've arrived at your location. I'll be checking your car battery now.",
        timestamp: new Date(),
        sender: 'mechanic',
        read: false,
      };
      
      setMessages(prevMessages => [...prevMessages, mechanicResponse]);
      setLoading(false);
    }, 3000);
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groupedMessages: { date: string; data: Message[] }[] = [];
    
    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp);
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
    const isUser = item.sender === 'user';
    
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
              {formatTime(item.timestamp)}
            </Text>
            {isUser && item.read && (
              <CheckCheck size={12} color={isUser ? "rgba(255, 255, 255, 0.7)" : "#7A89FF"} style={styles.readIcon} />
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderMessageGroup = ({ item }: { item: { date: string; data: Message[] } }) => {
    return (
      <View>
        {renderDateSeparator(item.date)}
        {item.data.map(message => (
          <React.Fragment key={message.id}>
            {renderMessage({ item: message })}
          </React.Fragment>
        ))}
      </View>
    );
  };

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
      {loading && (
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
          { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 16 }
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
}); 