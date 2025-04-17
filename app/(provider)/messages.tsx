import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MessageSquarePlus, Activity } from 'lucide-react-native';

const conversations = [
  {
    id: '1',
    customer: {
      name: 'Emily Rodriguez',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=60',
      online: true,
      vehicle: '2024 Tesla Model S',
    },
    service: 'Quantum Engine Calibration',
    lastMessage: "What's the estimated completion time for the calibration?",
    timestamp: '2 min ago',
    unread: 2,
  },
  {
    id: '2',
    customer: {
      name: 'Michael Chen',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60',
      online: false,
      vehicle: '2023 BMW iX',
      lastSeen: '1 hour ago',
    },
    service: 'Neural Brake System Sync',
    lastMessage: "The diagnostic report shows some interesting patterns.",
    timestamp: '1 hour ago',
    unread: 0,
  },
  {
    id: '3',
    customer: {
      name: 'Sarah Thompson',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=60',
      online: true,
      vehicle: '2024 Porsche Taycan',
    },
    service: 'Battery Optimization',
    lastMessage: "I've completed the initial scan of your vehicle's systems.",
    timestamp: '2 hours ago',
    unread: 1,
  },
];

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>COMMUNICATIONS</Text>
          <Pressable style={styles.newChatButton}>
            <MessageSquarePlus size={24} color="#00F0FF" />
          </Pressable>
        </View>
        <View style={styles.searchBar}>
          <Search size={20} color="#7A89FF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#7A89FF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.conversationList}>
        {conversations.map((chat) => (
          <Pressable key={chat.id} style={styles.chatItem}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: chat.customer.image }} style={styles.avatar} />
              {chat.customer.online && <View style={styles.onlineIndicator} />}
            </View>
            
            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <Text style={styles.customerName}>{chat.customer.name.toUpperCase()}</Text>
                <Text style={styles.timestamp}>{chat.timestamp}</Text>
              </View>
              
              <Text style={styles.vehicleInfo}>{chat.customer.vehicle}</Text>
              <Text style={styles.service}>{chat.service}</Text>
              
              <View style={styles.messagePreview}>
                <Text 
                  style={[styles.lastMessage, chat.unread > 0 && styles.unreadMessage]}
                  numberOfLines={1}
                >
                  {chat.lastMessage}
                </Text>
                {chat.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{chat.unread}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.chatLine} />
          </Pressable>
        ))}
      </ScrollView>
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
  conversationList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#00F0FF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00F0FF',
    borderWidth: 2,
    borderColor: '#0A0F1E',
  },
  chatContent: {
    flex: 1,
    marginLeft: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
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
  vehicleInfo: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 2,
  },
  service: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
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