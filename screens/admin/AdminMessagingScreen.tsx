import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { colors } from '@/styles/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

type ChatRoom = {
  id: string;
  customerName: string;
  lastMessage: string;
  createdAt: any;
  status?: 'open' | 'closed';
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AdminMessagingScreen() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    const q = query(collection(firestore, 'supportChats'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs
        .map(doc => ({
          id: doc.id,
          customerName: doc.data().customerName || 'Customer',
          lastMessage: doc.data().lastMessage || '...',
          createdAt: doc.data().createdAt?.toDate(),
          status: doc.data().status || 'open',
        } as ChatRoom))
        .filter(room => room.status !== 'closed'); // Filter out closed chats
      setChatRooms(rooms);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Support Chats</Text>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable 
            style={styles.card}
            onPress={() => Alert.alert('Feature Disabled', 'The chat feature is temporarily disabled.')}
            // onPress={() => navigation.navigate('Support', { chatId: item.id, customerId: item.id, isAdmin: true })}
          >
            <Text style={styles.cardTitle}>{item.customerName}</Text>
            <Text style={styles.cardText} numberOfLines={1}>{item.lastMessage}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No active support chats.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
    padding: 16,
  },
  title: {
    color: colors.accent,
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(26, 33, 56, 1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  cardText: {
    color: '#D0DFFF',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  emptyText: {
    color: '#7A89FF',
    textAlign: 'center',
    marginTop: 50,
  },
});