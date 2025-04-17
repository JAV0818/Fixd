import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Image, Platform, Dimensions } from 'react-native';
import { X, Search, Mail, Phone } from 'lucide-react-native';

export type UserSuggestion = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
};

type NewChatModalProps = {
  onClose: () => void;
  onSelectUser: (user: UserSuggestion) => void;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const mockUsers: UserSuggestion[] = [
  {
    id: '1',
    name: 'Emma Wilson',
    email: 'emma.wilson@example.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=60',
    role: 'Interior Designer',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60',
    role: 'Electrician',
  },
  {
    id: '3',
    name: 'Sofia Rodriguez',
    email: 'sofia.r@example.com',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=60',
    role: 'Plumber',
  },
];

export default function NewChatModal({ onClose, onSelectUser }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  return (
    <View style={styles.wrapper}>
      <Pressable 
        style={[
          styles.overlay,
          Platform.select({
            web: styles.overlayWeb,
            default: styles.overlayNative
          })
        ]} 
        onPress={onClose} 
      />
      <View 
        style={[
          styles.container,
          Platform.select({
            web: styles.containerWeb,
            default: styles.containerNative
          })
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>New Message</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#1f2937" />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, or phone"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        </View>

        <ScrollView style={styles.suggestions}>
          {suggestions.map((user) => (
            <Pressable
              key={user.id}
              style={styles.userItem}
              onPress={() => onSelectUser(user)}
            >
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userRole}>{user.role}</Text>
                <View style={styles.contactInfo}>
                  <View style={styles.contactItem}>
                    <Mail size={14} color="#6b7280" />
                    <Text style={styles.contactText}>{user.email}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    <Phone size={14} color="#6b7280" />
                    <Text style={styles.contactText}>{user.phone}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
          {searchQuery.length > 0 && suggestions.length === 0 && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No users found</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  overlayWeb: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayNative: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: Platform.select({
      web: '90%',
      default: SCREEN_WIDTH - 32
    }),
    maxWidth: 500,
    maxHeight: Platform.select({
      web: '80%',
      default: SCREEN_HEIGHT - 100
    }),
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  containerWeb: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
  },
  containerNative: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1f2937',
  },
  suggestions: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
    marginBottom: 8,
  },
  contactInfo: {
    gap: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
  },
  noResults: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
  },
});