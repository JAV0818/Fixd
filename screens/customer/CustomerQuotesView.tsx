import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { auth, firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where, updateDoc, doc, getDoc } from 'firebase/firestore';

type MechanicQuote = {
  id: string;
  requestId: string;
  customerId: string;
  mechanicId: string;
  amount: number;
  message?: string;
  approved?: boolean;
  accepted?: boolean;
  status?: 'pending' | 'declined' | 'accepted';
};

export default function CustomerQuotesView() {
  const [quotes, setQuotes] = useState<MechanicQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestStatusById, setRequestStatusById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(firestore, 'mechanicQuotes'),
      where('customerId', '==', auth.currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: MechanicQuote[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setQuotes(rows);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Load related request statuses to hide closed ones
  useEffect(() => {
    (async () => {
      const uniqueIds = Array.from(new Set(quotes.map((q) => q.requestId).filter(Boolean)));
      const entries: [string, string][] = [];
      for (const rid of uniqueIds) {
        try {
          const reqDoc = await getDoc(doc(firestore, 'quoteRequests', rid));
          const status = (reqDoc.exists() && (reqDoc.data() as any)?.status) || 'unknown';
          entries.push([rid, status]);
        } catch {}
      }
      if (entries.length) setRequestStatusById(Object.fromEntries(entries));
    })();
  }, [quotes]);

  const acceptQuote = async (q: MechanicQuote) => {
    Alert.alert('Temporarily Disabled', 'Payment functionality is currently unavailable. Please check back later.');
  };

  const declineQuote = async (quoteId: string) => {
    try {
      await updateDoc(doc(firestore, 'mechanicQuotes', quoteId), {
        status: 'declined',
      });
      Alert.alert('Quote Declined', 'You have declined this quote.');
    } catch (e: any) {
      console.error('Failed to decline quote:', e);
      Alert.alert('Error', 'Could not decline the quote. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#5B57F5" size="large" />
      </View>
    );
  }

  const approvedQuotes = quotes.filter(
    (q) =>
      !q.accepted &&
      requestStatusById[q.requestId] !== 'closed' &&
      requestStatusById[q.requestId] !== 'cancelled' &&
      q.status !== 'declined'
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {approvedQuotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Quotes Yet</Text>
          <Text style={styles.emptyText}>
            When mechanics submit quotes for your requests, they'll appear here.
          </Text>
        </View>
      ) : (
        approvedQuotes.map((q) => (
          <View key={q.id} style={styles.quoteCard}>
            <View style={styles.quoteHeader}>
              <Text style={styles.quoteAmount}>${(Number(q.amount || 0) + 25).toFixed(2)}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{q.accepted ? 'ACCEPTED' : 'PENDING'}</Text>
              </View>
            </View>
            {!!q.message && <Text style={styles.quoteMessage}>{q.message}</Text>}
            
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.declineButton]}
                onPress={() => declineQuote(q.id)}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.acceptButton, q.accepted && styles.buttonDisabled]}
                onPress={() => acceptQuote(q)}
                disabled={!!q.accepted}
              >
                <Text style={styles.acceptButtonText}>
                  {q.accepted ? 'Accepted' : 'Accept'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E9F3',
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#14142B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6E7191',
    textAlign: 'center',
    lineHeight: 20,
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteAmount: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#14142B',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F0F0FF',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#5B57F5',
  },
  quoteMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#4E4B66',
    lineHeight: 20,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  declineButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#EF4444',
  },
  acceptButton: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  acceptButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#34C759',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

