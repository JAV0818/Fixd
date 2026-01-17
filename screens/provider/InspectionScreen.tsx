import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '@/navigation/ProviderNavigator';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { firestore } from '@/lib/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

const INSPECTION_ITEMS: { key: string; label: string }[] = [
  { key: 'horn', label: 'Horn' },
  { key: 'lights', label: 'Lights' },
  { key: 'turnSignals', label: 'Turn Signals & Emergency Flashers' },
  { key: 'instruments', label: 'Instruments & Gauges' },
  { key: 'wipers', label: 'Wiper Operation' },
  { key: 'wiperBlades', label: 'Wiper Blades' },
  { key: 'washers', label: 'Washers' },
  { key: 'seatBelts', label: 'Seat Belt Operation' },
  { key: 'hvac', label: 'HVAC Operation' },
  { key: 'brakePedal', label: 'Brake Pedal Operation' },
  { key: 'parkingBrake', label: 'Parking Brake Operation' },
  { key: 'clutch', label: 'Clutch' },
  { key: 'glassWindows', label: 'Glass / Power Window Operation' },
  { key: 'mirrors', label: 'Mirror Operation' },
  { key: 'doorLatches', label: 'Door Latches / Power Lock Operation' },
  { key: 'fuelCap', label: 'Fuel Cap' },
  // ... you can keep adding all items here ...
];

type Props = NativeStackScreenProps<ProviderStackParamList, 'Inspection'>;

type Rating = 'green' | 'yellow' | 'red';

export default function InspectionScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const [ratings, setRatings] = useState<Record<string, Rating | null>>(() => {
    const initial: Record<string, Rating | null> = {};
    INSPECTION_ITEMS.forEach(item => { initial[item.key] = null; });
    return initial;
  });

  const handleSelect = (key: string, rating: Rating) => {
    setRatings(prev => ({ ...prev, [key]: rating }));
  };

  const handleSubmit = async () => {
    try {
      await updateDoc(doc(firestore, 'repair-orders', orderId), {
        inspectionRatings: ratings,
        status: 'InProgress',
        inspectionTimestamp: Timestamp.now(),
      });
      Alert.alert('Inspection Saved', 'Inspection results have been saved.');
      navigation.goBack();
    } catch (err) {
      console.error('Error saving inspection', err);
      Alert.alert('Error', 'Could not save inspection.');
    }
  };

  const renderRatingButtons = (key: string) => (
    <View style={styles.ratingRow}>
      {(['green', 'yellow', 'red'] as Rating[]).map(color => (
        <Pressable
          key={color}
          onPress={() => handleSelect(key, color)}
          style={[styles.ratingButton, { backgroundColor: color === 'green' ? '#34C759' : color === 'yellow' ? '#FFCC00' : '#FF3B30',
            opacity: ratings[key] === color ? 1 : 0.4 }]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <Text style={styles.headerTitle}>VEHICLE INSPECTION</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {INSPECTION_ITEMS.map(item => (
          <View key={item.key} style={styles.itemRow}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            {renderRatingButtons(item.key)}
          </View>
        ))}
      </ScrollView>

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>SAVE INSPECTION</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A3555',
  },
  backButton: { padding: 8 },
  headerTitle: { color: '#00F0FF', fontSize: 18, fontFamily: 'Inter_700Bold' },
  content: { flex: 1, padding: 16 },
  itemRow: { marginBottom: 12 },
  itemLabel: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  ratingRow: { flexDirection: 'row', gap: 8 },
  ratingButton: { width: 32, height: 32, borderRadius: 16 },
  submitButton: { margin: 16, backgroundColor: '#00F0FF', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#0A0F1E', fontSize: 16, fontFamily: 'Inter_700Bold' },
}); 