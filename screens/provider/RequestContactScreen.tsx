import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, MessageCircle, Phone, Calendar, Clock } from 'lucide-react-native';

type Props = NativeStackScreenProps<ProviderStackParamList, 'RequestContact'>;

// Mock message history
const MOCK_MESSAGES = [
  {
    id: '1',
    sender: 'provider',
    text: 'Hello! I saw your service request for home cleaning.',
    timestamp: '10:30 AM'
  },
  {
    id: '2',
    sender: 'customer',
    text: 'Hi! Yes, I needed someone to come by next week.',
    timestamp: '10:32 AM'
  },
  {
    id: '3',
    sender: 'provider',
    text: 'I can help with that. Do you have any specific cleaning products you prefer I use?',
    timestamp: '10:33 AM'
  }
];

export default function RequestContactScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [sending, setSending] = useState(false);
  
  // In a real app, you would fetch the request and customer details using the ID
  const requestDetails = {
    id: requestId,
    customerName: 'John Smith',
    customerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    service: 'Home Cleaning',
    date: 'May 15, 2023',
    time: '14:00 - 16:00',
    address: '123 Main St, Anytown, CA 94501',
    phoneNumber: '(555) 123-4567',
    email: 'john.smith@example.com',
    status: 'Pending',
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setSending(true);
    
    // Simulate sending a message
    setTimeout(() => {
      const newMessage = {
        id: Date.now().toString(),
        sender: 'provider',
        text: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages([...messages, newMessage]);
      setMessage('');
      setSending(false);
    }, 500);
  };

  const handlePhoneCall = () => {
    Alert.alert(
      "Make Phone Call",
      `Call ${requestDetails.customerName} at ${requestDetails.phoneNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => console.log("Initiating call...") }
      ]
    );
  };

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
        <Image source={{ uri: requestDetails.customerAvatar }} style={styles.avatar} />
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{requestDetails.customerName.toUpperCase()}</Text>
          <Text style={styles.serviceInfo}>{requestDetails.service}</Text>
          <View style={styles.serviceDetailRow}>
            <Calendar size={12} color="#7A89FF" />
            <Text style={styles.serviceDetailText}>{requestDetails.date}</Text>
            <Clock size={12} color="#7A89FF" />
            <Text style={styles.serviceDetailText}>{requestDetails.time}</Text>
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
        <ScrollView style={styles.messagesScroll}>
          {messages.map(msg => (
            <View 
              key={msg.id} 
              style={[
                styles.messageBubble,
                msg.sender === 'provider' ? styles.sentMessage : styles.receivedMessage
              ]}
            >
              <Text style={styles.messageText}>{msg.text}</Text>
              <Text style={styles.messageTimestamp}>{msg.timestamp}</Text>
            </View>
          ))}
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
            style={[styles.sendButton, !message.trim() && styles.disabledSendButton]}
            onPress={handleSendMessage}
            disabled={!message.trim() || sending}
          >
            <Send size={20} color={message.trim() ? "#0A0F1E" : "#7A89FF"} />
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
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(122, 137, 255, 0.2)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  messageTimestamp: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    alignSelf: 'flex-end',
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
}); 