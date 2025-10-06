import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where, updateDoc, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
// import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { componentStyles, colors } from '@/styles/theme';

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

export default function CustomerQuotesScreen() {
  const navigation = useNavigation<any>();
  const [quotes, setQuotes] = useState<MechanicQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestStatusById, setRequestStatusById] = useState<Record<string, string>>({});
  // Hosted checkout flow (no local card capture), so no Stripe hooks/states needed

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(firestore, 'mechanicQuotes'),
      where('customerId', '==', auth.currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows: MechanicQuote[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setQuotes(rows);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load related request statuses to hide closed ones
  useEffect(() => {
    (async () => {
      const uniqueIds = Array.from(new Set(quotes.map(q => q.requestId).filter(Boolean)));
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
    // try {
    //   const functions = getFunctions();
    //   const preparePaymentSheet = httpsCallable(functions, 'preparePaymentSheet');
    //   const amountCents = Math.round((Number(q.amount || 0) + 25) * 100);
    //   const { data }: any = await preparePaymentSheet({ amount: amountCents, currency: 'usd', quoteId: q.id });
    //
    //   const initRes = await initPaymentSheet({
    //     merchantDisplayName: 'Fixd',
    //     customerId: data.customerId,
    //     customerEphemeralKeySecret: data.customerEphemeralKeySecret,
    //     paymentIntentClientSecret: data.paymentIntentClientSecret,
    //     allowsDelayedPaymentMethods: false,
    //     returnURL: 'fixd://stripe-redirect', // for payment methods that require redirect
    //     // applePay: { merchantCountryCode: 'US' }, // Temporarily disabled
    //     googlePay: { merchantCountryCode: 'US', currencyCode: 'usd' },
    //   });
    //   if (initRes.error) throw initRes.error;
    //
    //   const presentRes = await presentPaymentSheet();
    //   if (presentRes.error) {
    //     throw presentRes.error;
    //   }
    //
    //   // Payment successful — mark accepted
    //   await updateDoc(doc(firestore, 'mechanicQuotes', q.id), { accepted: true });
    //   Alert.alert('Success', 'Deposit paid and quote accepted');
    // } catch (e: any) {
    //   console.error(e);
    //   Alert.alert('Payment failed', e?.message || 'Could not complete payment');
    // }
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
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  const approvedQuotes = quotes.filter(
    (q) =>
      !q.accepted &&
      requestStatusById[q.requestId] !== 'closed' &&
      requestStatusById[q.requestId] !== 'cancelled' &&
      q.status !== 'declined'
  );
  const pendingQuotes: MechanicQuote[] = []; // no admin approval phase now

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Pressable onPress={() => navigation.goBack()} style={{ padding: 6, marginRight: 6 }}>
            <ArrowLeft size={22} color={colors.accent} />
          </Pressable>
          <Text style={styles.title}>My Quotes</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Quotes</Text>
          <Text style={styles.infoText}>Review and approve a quote by paying a deposit.</Text>
        </View>

        {approvedQuotes.length === 0 ? (
          <Text style={styles.empty}>No approved quotes yet.</Text>
        ) : (
          approvedQuotes.map(q => (
            <View key={q.id} style={styles.card}>
              <Text style={styles.cardTitle}>Total: ${(Number(q.amount || 0) + 25).toFixed(2)}</Text>
              {!!q.message && <Text style={styles.cardText}>{q.message}</Text>}
              <Text style={styles.badge}>Status: {q.accepted ? 'ACCEPTED' : 'AVAILABLE'}</Text>
              <View style={styles.buttonRow}>
                <Pressable
                  style={[componentStyles.tealButton, styles.actionButton, styles.declineButton]}
                  onPress={() => declineQuote(q.id)}
                >
                  <Text style={styles.declineButtonText}>Decline</Text>
                </Pressable>
                <Pressable
                  style={[componentStyles.tealButton, styles.actionButton]}
                  onPress={() => acceptQuote(q)}
                  disabled={!!q.accepted}
                >
                  <Text style={{ color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>{q.accepted ? 'Accepted' : 'Approve (Pay Deposit)'}</Text>
                </Pressable>
              </View>
              {/* Hosted checkout opened in browser; no inline card capture */}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.accent, fontFamily: 'Inter_700Bold', fontSize: 22, marginBottom: 8 },
  empty: { color: '#7A89FF', fontFamily: 'Inter_500Medium' },
  card: { borderWidth: 1, borderColor: '#2A3555', borderRadius: 12, padding: 12, backgroundColor: 'rgba(26,33,56,1)', marginBottom: 12 },
  cardTitle: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  cardText: { color: '#D0DFFF' },
  badge: { color: colors.accent, marginTop: 6 },
  infoBox: { marginTop: 10, borderWidth: 1, borderColor: '#2A3555', borderRadius: 12, padding: 12, backgroundColor: 'rgba(26, 33, 56, 1)' },
  infoTitle: { color: colors.accent, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  infoText: { color: '#D0DFFF' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF7A7A',
  },
  declineButtonText: {
    color: '#FF7A7A',
    fontFamily: 'Inter_600SemiBold',
  },
});


