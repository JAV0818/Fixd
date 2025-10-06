import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { componentStyles, colors, globalStyles } from '@/styles/theme';

type QuoteRequest = {
  id: string;
  customerId: string;
  vehicleInfo?: string;
  description: string;
  preferredTime?: string;
  status: 'draft' | 'submitted' | 'published' | 'assigned' | 'closed';
};

type MechanicQuote = {
  id: string;
  requestId: string;
  mechanicId: string;
};

export default function QuoteMarketplaceScreen() {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFormFor, setOpenFormFor] = useState<string | null>(null);
  const [amountText, setAmountText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [myQuotes, setMyQuotes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const q = query(collection(firestore, 'quoteRequests'), where('status', '==', 'published'));
    const unsub = onSnapshot(q, (snap) => {
      const rows: QuoteRequest[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setRequests(rows);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    // Listen to quotes submitted by the current mechanic
    const quotesQuery = query(
      collection(firestore, 'mechanicQuotes'),
      where('mechanicId', '==', auth.currentUser.uid)
    );
    const unsub = onSnapshot(quotesQuery, (snap) => {
      const submittedQuotes: Record<string, boolean> = {};
      snap.docs.forEach(doc => {
        const data = doc.data() as MechanicQuote;
        if (data.requestId) {
          submittedQuotes[data.requestId] = true;
        }
      });
      setMyQuotes(submittedQuotes);
    });
    return () => unsub();
  }, []);

  const handleSubmitQuote = async (request: QuoteRequest) => {
    if (!auth.currentUser) return;
    try {
      const amount = parseFloat(amountText);
      if (!openFormFor || openFormFor !== request.id) {
        setOpenFormFor(request.id);
        return;
      }
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Enter price', 'Please enter a valid quote amount.');
        return;
      }
      await addDoc(collection(firestore, 'mechanicQuotes'), {
        requestId: request.id,
        customerId: request.customerId,
        mechanicId: auth.currentUser.uid,
        amount,
        message: messageText.trim() || null,
        approved: false,
        accepted: false,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Submitted', 'Your quote was submitted. Awaiting admin approval.');
      setOpenFormFor(null);
      setAmountText('');
      setMessageText('');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not submit quote');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}> 
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Open Requests</Text>
        {requests.length === 0 ? (
          <Text style={styles.empty}>No published requests.</Text>
        ) : (
          requests.map(req => (
            <View key={req.id} style={[globalStyles?.card, styles.card]}> 
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

              <Pressable
                style={[componentStyles.tealButton, { alignItems: 'center', marginTop: 10 }]}
                onPress={() => setExpanded(prev => ({ ...prev, [req.id]: !prev[req.id] }))}
              >
                <Text style={{ color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>
                  {expanded[req.id] ? 'Hide Details' : 'View Details'}
                </Text>
              </Pressable>

              {expanded[req.id] && (
                <View style={styles.detailsBox}>
                  {!!(req as any).issueCategory && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Category</Text>
                      <Text style={styles.detailValue}>{String((req as any).issueCategory)}</Text>
                    </View>
                  )}
                  {!!(req as any).vin && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>VIN</Text>
                      <Text style={styles.detailValue}>{String((req as any).vin)}</Text>
                    </View>
                  )}
                  {!!(req as any).mileage && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Mileage</Text>
                      <Text style={styles.detailValue}>{String((req as any).mileage)}</Text>
                    </View>
                  )}
                  {!!(req as any).driveable && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Driveable</Text>
                      <Text style={styles.detailValue}>{String((req as any).driveable)}</Text>
                    </View>
                  )}
                  {!!(req as any).hasWarningLights && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Warning Lights</Text>
                      <Text style={styles.detailValue}>{String((req as any).hasWarningLights)}</Text>
                    </View>
                  )}
                  {!!(req as any).serviceLocation && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>{String((req as any).serviceLocation)}</Text>
                    </View>
                  )}
                </View>
              )}
              {openFormFor === req.id ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.formLabel}>Quote amount (USD)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 125.00"
                    placeholderTextColor="#6E7191"
                    keyboardType="numeric"
                    value={amountText}
                    onChangeText={setAmountText}
                  />
                  <Text style={styles.formLabel}>Message (optional)</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                    placeholder="Notes for admin/customer"
                    placeholderTextColor="#6E7191"
                    multiline
                    value={messageText}
                    onChangeText={setMessageText}
                  />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <Pressable style={[componentStyles.tealButton, { flex: 1, alignItems: 'center' }]} onPress={() => handleSubmitQuote(req)}>
                      <Text style={{ color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>Submit</Text>
                    </Pressable>
                    <Pressable style={[componentStyles.tealButton, { flex: 1, alignItems: 'center' }]} onPress={() => { setOpenFormFor(null); setAmountText(''); setMessageText(''); }}>
                      <Text style={{ color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : myQuotes[req.id] ? (
                <View style={styles.submittedContainer}>
                  <Text style={styles.submittedText}>You have already submitted a quote for this request.</Text>
                </View>
              ) : (
                <Pressable style={[componentStyles.tealButton, { alignItems: 'center', marginTop: 10 }]} onPress={() => setOpenFormFor(req.id)}>
                  <Text style={{ color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>Submit Quote</Text>
                </Pressable>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  title: { color: colors.accent, fontFamily: 'Inter_700Bold', fontSize: 22, marginBottom: 8 },
  empty: { color: '#7A89FF', fontFamily: 'Inter_500Medium' },
  card: {
    borderWidth: 1,
    borderColor: '#2A3555',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(18,24,39,0.85)',
    marginBottom: 12,
  },
  cardTitle: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  cardText: { color: '#D0DFFF' },
  cardHint: { color: '#7A89FF', marginTop: 4 },
  formLabel: { color: '#7A89FF', marginTop: 8, marginBottom: 4, fontFamily: 'Inter_600SemiBold' },
  input: {
    backgroundColor: 'rgba(18, 24, 39, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3555',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
  },
  detailsBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2A3555',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'rgba(10,15,30,0.6)'
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { color: '#7A89FF', fontFamily: 'Inter_600SemiBold' },
  detailValue: { color: '#D0DFFF' },
  submittedContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: 'rgba(26, 33, 56, 1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  submittedText: {
    color: colors.accent,
    fontFamily: 'Inter_500Medium',
  },
});


