import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '@/lib/firebase';
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where, getDoc, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
import { componentStyles, colors } from '@/styles/theme';

type QuoteRequest = {
  id: string;
  customerId: string;
  vehicleInfo?: string;
  description: string;
  preferredTime?: string;
  status: 'draft' | 'submitted' | 'published' | 'assigned' | 'closed';
  assignedMechanicId?: string;
  assignedMechanicName?: string;
};

type MechanicQuote = {
  id: string;
  requestId: string;
  customerId: string;
  mechanicId: string;
  amount: number;
  message?: string;
  accepted?: boolean;
  isAdminQuote?: boolean;
};

export default function AdminRequestsScreen() {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [quotesByRequest, setQuotesByRequest] = useState<Record<string, MechanicQuote[]>>({});
  const [assignByRequest, setAssignByRequest] = useState<Record<string, string>>({});
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([]);
  const [providerSearch, setProviderSearch] = useState<Record<string, string>>({});
  const [adminQuoteAmount, setAdminQuoteAmount] = useState<Record<string, string>>({});
  const [adminQuoteMessage, setAdminQuoteMessage] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = query(collection(firestore, 'quoteRequests'), where('status', 'in', ['submitted', 'published', 'assigned']));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(firestore, 'users'), where('role', '==', 'provider'));
        const snap = await getDocs(q);
        setProviders(snap.docs.map(d => {
          const data = d.data() as any;
          const name = `${data.firstName || ''} ${data.lastName || ''}`.trim() || d.id;
          return { id: d.id, name };
        }));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const toggleQuotes = async (req: QuoteRequest) => {
    const next = !expanded[req.id];
    setExpanded(prev => ({ ...prev, [req.id]: next }));
    if (next && !quotesByRequest[req.id]) {
      const q = query(collection(firestore, 'mechanicQuotes'), where('requestId', '==', req.id));
      const snap = await getDocs(q);
      const rows: MechanicQuote[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setQuotesByRequest(prev => ({ ...prev, [req.id]: rows }));
    }
  };

  const publish = async (req: QuoteRequest) => {
    try {
      await updateDoc(doc(firestore, 'quoteRequests', req.id), { status: 'published' });
      Alert.alert('Published', 'Request published to marketplace.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not publish');
    }
  };

  const close = async (req: QuoteRequest) => {
    try {
      await updateDoc(doc(firestore, 'quoteRequests', req.id), { status: 'closed' });
      Alert.alert('Closed', 'Request closed.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not close request');
    }
  };

  const assignMechanic = async (requestId: string, providerId: string, providerName: string) => {
    try {
      const requestDoc = await getDoc(doc(firestore, 'quoteRequests', requestId));
      const currentData = requestDoc.data() as QuoteRequest | undefined;
      const previouslyAssignedId = currentData?.assignedMechanicId;

      if (previouslyAssignedId && previouslyAssignedId !== providerId) {
        const oldQuotesQuery = query(
          collection(firestore, 'mechanicQuotes'),
          where('requestId', '==', requestId),
          where('mechanicId', '==', previouslyAssignedId)
        );
        const oldQuotesSnap = await getDocs(oldQuotesQuery);
        const batch = writeBatch(firestore);
        oldQuotesSnap.forEach(quoteDoc => {
          batch.update(quoteDoc.ref, { approved: false, revokedByAdmin: true });
        });
        await batch.commit();
        Alert.alert('Old Quotes Revoked', `Quotes from the previous mechanic have been revoked.`);
      }

      await updateDoc(doc(firestore, 'quoteRequests', requestId), {
        status: 'assigned',
        assignedMechanicId: providerId,
        assignedMechanicName: providerName,
      });

      Alert.alert('Assigned', `${providerName} has been assigned to the request.`);
      setAssignByRequest(prev => ({ ...prev, [requestId]: '' })); // Clear selection
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not assign mechanic');
    }
  };

  const handleAdminQuoteSubmit = async (req: QuoteRequest) => {
    const assignedMechanicId = req.assignedMechanicId;
    if (!assignedMechanicId) {
      Alert.alert('No Mechanic Assigned', 'You must assign a mechanic to the request before creating a quote.');
      return;
    }

    const amount = parseFloat(adminQuoteAmount[req.id] || '');
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid price for the quote.');
      return;
    }

    try {
      await addDoc(collection(firestore, 'mechanicQuotes'), {
        requestId: req.id,
        customerId: req.customerId,
        mechanicId: assignedMechanicId,
        amount: amount,
        message: adminQuoteMessage[req.id] || `Quote provided by Admin.`,
        approved: true,
        isAdminQuote: true,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Quote Submitted', 'The quote has been created and is now visible to the customer.');
      setAdminQuoteAmount(prev => ({ ...prev, [req.id]: '' }));
      setAdminQuoteMessage(prev => ({ ...prev, [req.id]: '' }));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not submit the quote.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Admin Requests</Text>
        {requests.map(req => (
          <View key={req.id} style={styles.card}>
            <Text style={styles.cardTitle}>{req.vehicleInfo || 'Vehicle'}</Text>
            <Text style={styles.cardText}>{req.description}</Text>
            {!!req.preferredTime && (
              <Text style={styles.cardHint}>
                Preferred: {(() => {
                  try {
                    const d = new Date(req.preferredTime);
                    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
                  } catch { return String(req.preferredTime); }
                })()}
              </Text>
            )}
            <Text style={styles.badge}>Status: {req.status.toUpperCase()}</Text>
            {req.assignedMechanicName && (
              <Text style={styles.cardHint}>Assigned to: {req.assignedMechanicName}</Text>
            )}
            <View style={styles.row}>
              <Pressable style={[componentStyles.tealButton, styles.action]} onPress={() => publish(req)}>
                <Text style={styles.actionText}>Publish</Text>
              </Pressable>
              <Pressable style={[componentStyles.tealButton, styles.action]} onPress={() => close(req)}>
                <Text style={styles.actionText}>Close</Text>
              </Pressable>
            </View>

            <View style={[styles.row, { marginTop: 10, alignItems: 'center' }]}>
              <TextInput
                style={styles.input}
                placeholder="Search mechanics by name"
                placeholderTextColor="#6E7191"
                value={providerSearch[req.id] || ''}
                onChangeText={text => setProviderSearch(prev => ({ ...prev, [req.id]: text }))}
              />
            </View>
            {(providerSearch[req.id] || '').length > 0 && (
              <View style={styles.quotesBox}>
                {providers.filter(p => p.name.toLowerCase().includes((providerSearch[req.id] || '').toLowerCase())).slice(0, 5).map(p => (
                  <Pressable
                    key={p.id}
                    style={styles.quoteRow}
                    onPress={() => assignMechanic(req.id, p.id, p.name)}
                  >
                    <View>
                      <Text style={styles.cardText}>{p.name}</Text>
                      <Text style={styles.cardHint}>{p.id}</Text>
                    </View>
                    <Text style={styles.actionText}>{req.assignedMechanicId === p.id ? 'Assigned' : 'Assign'}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Pressable style={[componentStyles.tealButton, { alignItems: 'center', marginTop: 10 }]} onPress={() => toggleQuotes(req)}>
              <Text style={styles.actionText}>{expanded[req.id] ? 'Hide Quotes' : 'View Quotes'}</Text>
            </Pressable>
            {expanded[req.id] && (
              <View style={styles.quotesBox}>
                {(quotesByRequest[req.id] || []).length === 0 ? (
                  <Text style={styles.cardHint}>No quotes yet.</Text>
                ) : (
                  (quotesByRequest[req.id] || []).map(q => (
                    <View key={q.id} style={styles.quoteRow}>
                      <Text style={styles.cardText}>${q.amount?.toFixed(2) || '—'} — {q.message || '—'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
            
            <View style={styles.adminQuoteSection}>
              <Text style={styles.formLabel}>Create Quote for Customer</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter quote amount (e.g., 150.00)"
                placeholderTextColor="#6E7191"
                keyboardType="numeric"
                value={adminQuoteAmount[req.id] || ''}
                onChangeText={text => setAdminQuoteAmount(prev => ({ ...prev, [req.id]: text }))}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Enter a message (optional)"
                placeholderTextColor="#6E7191"
                value={adminQuoteMessage[req.id] || ''}
                onChangeText={text => setAdminQuoteMessage(prev => ({ ...prev, [req.id]: text }))}
              />
              <Pressable
                style={[componentStyles.tealButton, { alignItems: 'center', marginTop: 10 }]}
                onPress={() => handleAdminQuoteSubmit(req)}
              >
                <Text style={styles.actionText}>Submit Quote to Customer</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  content: { padding: 16 },
  title: { color: colors.accent, fontFamily: 'Inter_700Bold', fontSize: 22, marginBottom: 8 },
  card: { borderWidth: 1, borderColor: '#2A3555', borderRadius: 12, padding: 12, backgroundColor: 'rgba(26,33,56,1)', marginBottom: 12 },
  cardTitle: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  cardText: { color: '#D0DFFF' },
  cardHint: { color: '#7A89FF', marginTop: 4 },
  badge: { color: colors.accent, marginTop: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 10 },
  action: { alignItems: 'center', flex: 1 },
  actionText: { color: colors.accent, fontFamily: 'Inter_600SemiBold' },
  input: {
    flex: 1,
    backgroundColor: 'rgba(18, 24, 39, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3555',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
  },
  quotesBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2A3555',
    borderRadius: 8,
    padding: 8,
    backgroundColor: 'rgba(18,24,39,0.6)'
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  smallBtn: { alignItems: 'center', paddingHorizontal: 10 },
  adminQuoteSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#2A3555',
  },
  formLabel: {
    color: '#7A89FF',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
});