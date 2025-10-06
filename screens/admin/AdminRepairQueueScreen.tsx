import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { colors, componentStyles } from '@/styles/theme';

type RepairOrder = any;

export default function AdminRepairQueueScreen() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const q = query(collection(firestore, 'repairOrders'));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setOrders(rows);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>All Repair Orders</Text>
        {orders.length === 0 ? (
          <Text style={styles.empty}>No orders found.</Text>
        ) : (
          orders.map(o => (
            <View key={o.id} style={styles.card}>
              <Text style={styles.cardTitle}>#{o.id.slice(0,6)} — {o.status || 'Unknown'}</Text>
              <Text style={styles.cardText}>Customer: {o.customerId}</Text>
              <Text style={styles.cardText}>Provider: {o.providerId || 'Unassigned'}</Text>
              <Text style={styles.cardHint}>Type: {o.orderType || '—'}</Text>
              <Text style={styles.cardHint}>Created: {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : '—'}</Text>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.divider} />
                <Text style={styles.sectionTitle}>Details</Text>
                <Text style={styles.cardText}>Quote: {o.quoteId || '—'}</Text>
                <Text style={styles.cardText}>Vehicle: {o.vehicleDisplay || '—'}</Text>
                <Text style={styles.cardText}>Location: {o.locationDetails?.address || '—'}</Text>
              </View>

              <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
                <Text style={[componentStyles.tealButtonText, { opacity: 0.8 }]}>Tap to expand for more</Text>
                <Text onPress={() => setExpanded(prev => ({ ...prev, [o.id]: !prev[o.id] }))} style={componentStyles.tealButtonText}>
                  {expanded[o.id] ? 'Hide' : 'View'}
                </Text>
              </View>
              {expanded[o.id] && (
                <View style={styles.detailsBox}>
                  <Text style={styles.cardText}>Notes: {o.notes || '—'}</Text>
                  <Text style={styles.cardText}>Status History: {Array.isArray(o.history) ? o.history.length : 0} events</Text>
                </View>
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
  card: { borderWidth: 1, borderColor: '#2A3555', borderRadius: 12, padding: 12, backgroundColor: 'rgba(18,24,39,0.85)', marginBottom: 12 },
  cardTitle: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  cardText: { color: '#D0DFFF' },
  cardHint: { color: '#7A89FF', marginTop: 4 },
  divider: { color: '#2A3555', marginVertical: 4 },
  sectionTitle: { color: colors.accent, fontFamily: 'Inter_600SemiBold', marginTop: 4, marginBottom: 6 },
  detailsBox: { marginTop: 8, borderWidth: 1, borderColor: '#2A3555', borderRadius: 8, padding: 8, backgroundColor: 'rgba(10,15,30,0.6)' },
});


