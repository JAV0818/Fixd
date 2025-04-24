import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { ArrowLeft, MessageCircle, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

type PastChatsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PastChats'>;

type ChatHistory = {
  id: string;
  orderId: string;
  serviceName: string;
  mechanicName: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
};

// Mock chat history data (would come from API in real app)
const CHAT_HISTORY: ChatHistory[] = [
  {
    id: '1',
    orderId: '1',
    serviceName: 'Battery Jump Start',
    mechanicName: 'Michael Rodriguez',
    lastMessage: "I've completed the service. Your car should start now.",
    timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    unreadCount: 0,
  },
  {
    id: '2',
    orderId: '2',
    serviceName: 'Tire Change',
    mechanicName: 'John Mechanic',
    lastMessage: "Don't forget to replace your spare tire soon. Thanks!",
    timestamp: new Date(Date.now() - 2 * 86400000), // 2 days ago
    unreadCount: 1,
  },
  {
    id: '3',
    orderId: '3',
    serviceName: 'Fuel Delivery',
    mechanicName: 'Sarah Technician',
    lastMessage: "Is your car running smoothly since the service?",
    timestamp: new Date(Date.now() - 5 * 86400000), // 5 days ago
    unreadCount: 2,
  },
];

export default function PastChatsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<PastChatsScreenNavigationProp>();

  const formatTimestamp = (date: Date) => {
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

  const handleChatPress = (chat: ChatHistory) => {
    navigation.navigate('MechanicChat', { 
      orderId: chat.orderId, 
      mechanicName: chat.mechanicName 
    });
  };

  const renderChatItem = ({ item }: { item: ChatHistory }) => {
    return (
      <Pressable 
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
      >
        <View style={styles.chatIconContainer}>
          <MessageCircle size={24} color="#00F0FF" />
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.mechanicName}>{item.mechanicName}</Text>
            <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
          </View>
          
          <Text style={styles.serviceName}>{item.serviceName}</Text>
          <Text 
            style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]} 
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>
        
        <ChevronRight size={20} color="#7A89FF" />
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <Text style={styles.headerTitle}>Past Chats</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {CHAT_HISTORY.length > 0 ? (
        <FlatList
          data={CHAT_HISTORY}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MessageCircle size={48} color="#7A89FF" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Chat History</Text>
          <Text style={styles.emptyMessage}>
            When you chat with mechanics about your orders, they will appear here.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030515',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0A0F1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  backButton: {
    padding: 4,
  },
  chatList: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 15, 30, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  chatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3D71',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  chatContent: {
    flex: 1,
    marginRight: 8,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mechanicName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  timestamp: {
    color: '#7A89FF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  serviceName: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  lastMessage: {
    color: '#D0DFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  unreadMessage: {
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  emptyMessage: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    maxWidth: '80%',
  },
}); 