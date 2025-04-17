import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MessageSquarePlus, Activity } from 'lucide-react-native';
import ChatThread, { Message, ChatParticipant } from '../../components/ChatThread';
import NewChatModal, { UserSuggestion } from '../../components/NewChatModal';

const conversations = [
  {
    id: '1',
    jobTitle: 'Bathroom Leak Repair',
    participant: {
      id: '1',
      name: 'Aaren Johnson',
      avatar: 'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=800&auto=format&fit=crop&q=60',
      online: true,
      typing: false,
    },
    lastMessage: "I can take a look at it tomorrow morning if that works for you.",
    unreadCount: 2,
    messages: [
      {
        id: '1',
        text: "Hi, I saw your posting about the bathroom leak. Could you tell me more about the issue?",
        sender: 'provider',
        timestamp: '10:30 AM',
        read: true,
      },
      {
        id: '2',
        text: "The sink has been leaking for a few days now and it's causing water damage to the cabinet below.",
        sender: 'user',
        timestamp: '10:32 AM',
        read: true,
      },
      {
        id: '3',
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=60',
        sender: 'user',
        timestamp: '10:32 AM',
        read: true,
      },
      {
        id: '4',
        text: "I can take a look at it tomorrow morning if that works for you.",
        sender: 'provider',
        timestamp: '10:35 AM',
        read: false,
      },
    ],
  },
  {
    id: '2',
    jobTitle: 'Kitchen Cabinet Installation',
    participant: {
      id: '2',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=60',
      online: false,
      lastSeen: '2 hours ago',
    },
    lastMessage: "Here's my quote for the cabinet installation project.",
    unreadCount: 0,
    messages: [
      {
        id: '1',
        text: "I'm interested in your kitchen cabinet installation project. How many cabinets need to be installed?",
        sender: 'provider',
        timestamp: '2:15 PM',
        read: true,
      },
      {
        id: '2',
        text: "We have 10 upper and 8 lower cabinets that need installation. All materials are already on site.",
        sender: 'user',
        timestamp: '2:20 PM',
        read: true,
      },
      {
        id: '3',
        text: "Here's my quote for the cabinet installation project.",
        sender: 'provider',
        timestamp: '2:30 PM',
        read: true,
      },
    ],
  },
];

export default function MessagesScreen() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [chats, setChats] = useState(conversations);

  const handleSendMessage = (chatId: string, text: string) => {
    setChats(chats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
          }],
          lastMessage: text,
        };
      }
      return chat;
    }));
  };

  const handleSendImage = (chatId: string, uri: string) => {
    setChats(chats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, {
            id: Date.now().toString(),
            image: uri,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
          }],
        };
      }
      return chat;
    }));
  };

  const handleBack = () => {
    setSelectedChat(null);
  };

  const handleNewChat = (user: UserSuggestion) => {
    const newChat = {
      id: Date.now().toString(),
      jobTitle: 'New Conversation',
      participant: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        online: true,
      },
      lastMessage: '',
      unreadCount: 0,
      messages: [],
    };

    setChats([newChat, ...chats]);
    setShowNewChat(false);
    setSelectedChat(newChat.id);
  };

  if (selectedChat) {
    const chat = chats.find(c => c.id === selectedChat);
    if (!chat) return null;

    return (
      <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
        <ChatThread
          jobTitle={chat.jobTitle}
          participant={chat.participant}
          messages={chat.messages}
          onSendMessage={(text) => handleSendMessage(chat.id, text)}
          onSendImage={(uri) => handleSendImage(chat.id, uri)}
          onBack={handleBack}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Messages</Text>
          <Pressable 
            style={styles.newChatButton}
            onPress={() => setShowNewChat(true)}
          >
            <MessageSquarePlus size={24} color="#00F0FF" />
          </Pressable>
        </View>
        <View style={styles.searchBar}>
          <Search size={20} color="#7A89FF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#7A89FF"
          />
        </View>
      </View>

      <ScrollView style={styles.chatList}>
        {chats.map((chat) => (
          <Pressable
            key={chat.id}
            style={styles.chatItem}
            onPress={() => setSelectedChat(chat.id)}
          >
            <View style={styles.avatarContainer}>
              <Image source={{ uri: chat.participant.avatar }} style={styles.avatar} />
              {chat.participant.online && <View style={styles.onlineIndicator} />}
            </View>
            
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.participantName}>{chat.participant.name}</Text>
                <Text style={styles.timestamp}>{chat.lastMessage ? '2 min ago' : 'New'}</Text>
              </View>
              
              <Text style={styles.jobTitle}>{chat.jobTitle}</Text>
              
              <View style={styles.messagePreview}>
                <Text 
                  style={[styles.lastMessage, chat.unreadCount > 0 && styles.unreadMessage]}
                  numberOfLines={1}
                >
                  {chat.lastMessage || 'Start a conversation...'}
                </Text>
                {chat.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{chat.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.chatLine} />
          </Pressable>
        ))}
      </ScrollView>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelectUser={handleNewChat}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  newChatButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#00F0FF',
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(122, 137, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#00F0FF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00F0FF',
    borderWidth: 2,
    borderColor: '#0A0F1E',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  jobTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 4,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  unreadMessage: {
    color: '#00F0FF',
    fontFamily: 'Inter_500Medium',
  },
  unreadBadge: {
    backgroundColor: '#00F0FF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#0A0F1E',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  chatLine: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 2,
    backgroundColor: '#00F0FF',
  },
});