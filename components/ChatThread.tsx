import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { Send, Image as ImageIcon, Paperclip, Clock, Check, CheckCheck, ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { IconButton } from 'react-native-paper';

export type Message = {
  id: string;
  text: string;
  sender: 'user' | 'provider';
  timestamp: string;
  read: boolean;
  image?: string;
  file?: string;
};

export type ChatParticipant = {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  typing?: boolean;
  lastSeen?: string;
};

type ChatThreadProps = {
  jobTitle: string;
  participant: ChatParticipant;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onSendImage?: (uri: string) => void;
  onBack: () => void;
};

const QuickReplies = [
  "I'm interested in this job",
  "Can you provide more details?",
  "Let's schedule a time to discuss",
  "What's your availability?",
];

export default function ChatThread({ 
  jobTitle, 
  participant, 
  messages, 
  onSendMessage,
  onSendImage,
  onBack
}: ChatThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleQuickReply = (reply: string) => {
    onSendMessage(reply);
    setShowQuickReplies(false);
  };

  const handleImagePick = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      onSendImage?.(result.assets[0].uri);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#00F0FF" />
          </Pressable>
          <View style={styles.participantInfo}>
            <Image source={{ uri: participant.avatar }} style={styles.avatar} />
            <View>
              <Text style={styles.participantName}>{participant.name}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: participant.online ? '#00F0FF' : '#7A89FF' }]} />
                <Text style={styles.statusText}>
                  {participant.online ? 'Online' : `Last seen ${participant.lastSeen}`}
                </Text>
                {participant.typing && (
                  <Text style={styles.typingIndicator}>typing...</Text>
                )}
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.jobTitle}>{jobTitle}</Text>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {messages.map((message, index) => (
          <View 
            key={message.id}
            style={[
              styles.messageWrapper,
              message.sender === 'user' ? styles.userMessage : styles.providerMessage
            ]}
          >
            <View style={[
              styles.messageBubble,
              message.sender === 'user' ? styles.userBubble : styles.providerBubble
            ]}>
              {message.image && (
                <Image source={{ uri: message.image }} style={styles.messageImage} />
              )}
              {message.text && (
                <Text style={[
                  styles.messageText,
                  message.sender === 'user' ? styles.userMessageText : styles.providerMessageText
                ]}>
                  {message.text}
                </Text>
              )}
              <View style={styles.messageFooter}>
                <Text style={styles.timestamp}>{message.timestamp}</Text>
                {message.sender === 'user' && (
                  <View style={styles.readStatus}>
                    {message.read ? (
                      <CheckCheck size={16} color="#00F0FF" />
                    ) : (
                      <Check size={16} color="#7A89FF" />
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {showQuickReplies && (
        <View style={styles.quickRepliesContainer}>
          {QuickReplies.map((reply, index) => (
            <Pressable
              key={index}
              style={styles.quickReplyButton}
              onPress={() => handleQuickReply(reply)}
            >
              <Text style={styles.quickReplyText}>{reply}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#7A89FF"
            multiline
          />
          <View style={styles.inputActions}>
            <Pressable onPress={handleImagePick} style={styles.actionButton}>
              <ImageIcon size={20} color="#00F0FF" />
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Paperclip size={20} color="#00F0FF" />
            </Pressable>
          </View>
        </View>
        <IconButton
          icon="send"
          size={24}
          iconColor={newMessage ? '#00F0FF' : '#7A89FF'}
          style={[styles.sendButton, !newMessage && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#00F0FF',
  },
  participantName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  typingIndicator: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#00F0FF',
    marginLeft: 6,
  },
  jobTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginLeft: 56,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  providerMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderWidth: 1,
  },
  userBubble: {
    borderColor: '#00F0FF',
  },
  providerBubble: {
    borderColor: '#7A89FF',
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  userMessageText: {
    color: '#00F0FF',
  },
  providerMessageText: {
    color: '#7A89FF',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    marginRight: 4,
  },
  readStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickRepliesContainer: {
    padding: 16,
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
  },
  quickReplyButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  quickReplyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#00F0FF',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    marginRight: 12,
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  input: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#00F0FF',
    maxHeight: 100,
  },
  inputActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    padding: 4,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderColor: '#7A89FF',
  },
});