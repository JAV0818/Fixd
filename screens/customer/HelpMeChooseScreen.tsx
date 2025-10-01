import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useCart, CartItem } from '@/contexts/CartContext';
import { componentStyles, colors } from '@/styles/theme';

type HelpRoute = RouteProp<RootStackParamList, 'HelpMeChoose'>;
type HelpNav = NativeStackNavigationProp<RootStackParamList, 'HelpMeChoose'>;

const SERVICE_BASE_PRICES: Record<string, { title: string; basePrice: number }> = {
  'oil-change': { title: 'Oil Change Service', basePrice: 40 },
  'battery-jump-start': { title: 'Battery Jump Start', basePrice: 50 },
  'flat-tire-change': { title: 'Flat Tire Change', basePrice: 45 },
  'fuel-delivery': { title: 'Fuel Delivery', basePrice: 40 },
  'diagnostics': { title: 'Diagnostics Check', basePrice: 70 },
  'brake-inspection': { title: 'Brake Inspection', basePrice: 50 },
};

export default function HelpMeChooseScreen() {
  const route = useRoute<HelpRoute>();
  const navigation = useNavigation<HelpNav>();
  const { addItem } = useCart();

  const serviceId = route.params?.id;
  const vehicleId = (route.params as any)?.vehicleId ?? null;

  const [notes, setNotes] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const base = SERVICE_BASE_PRICES[serviceId] ?? { title: 'Service', basePrice: 0 };

  const recommendation = useMemo(() => {
    // Direct customer choice: fixed variants for oil change; otherwise base
    if (serviceId === 'oil-change') {
      const options: Record<string, number> = {
        'Synthetic Blend': 0,
        'Full Synthetic': 25,
        'High Mileage Synthetic': 35,
      };
      const delta = selectedVariant ? (options[selectedVariant] ?? 0) : 0;
      return { variant: selectedVariant ?? 'Select an option', price: base.basePrice + delta };
    }
    return { variant: null as any, price: base.basePrice };
  }, [serviceId, selectedVariant, base.basePrice]);

  const handleAddEstimated = () => {
    const item: CartItem = {
      id: serviceId || 'custom-service',
      name: base.title + (recommendation.variant && recommendation.variant !== 'Select an option' ? ` - ${recommendation.variant}` : ''),
      price: recommendation.price,
      quantity: 1,
      vehicleId: vehicleId,
      vehicleDisplay: null,
      image: undefined as any,
      // @ts-ignore allow metadata without breaking other code paths
      isEstimated: true,
    };

    addItem(item);
    Alert.alert('Added', 'An estimated item was added to your cart. The provider will verify pricing.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Help Me Choose</Text>
        <Text style={styles.subtitle}>{base.title}</Text>

        {serviceId === 'oil-change' && (
          <>
            <Text style={styles.label}>Select Oil Type</Text>
            <View style={styles.pillRow}>
              {['Synthetic Blend', 'Full Synthetic', 'High Mileage Synthetic'].map(v => (
                <Pressable
                  key={v}
                  onPress={() => setSelectedVariant(v)}
                  style={[styles.pill, selectedVariant === v && styles.pillActive]}
                >
                  <Text style={[styles.pillText, selectedVariant === v && styles.pillTextActive]}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          placeholder="Tell us anything helpful (e.g., oil cap 0W-20)"
          placeholderTextColor="#6E7191"
          style={[styles.input, { width: '100%' }]}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Selected</Text>
          <Text style={styles.summaryLine}>{base.title}{recommendation.variant && recommendation.variant !== 'Select an option' ? ` · ${recommendation.variant}` : ''}</Text>
          <Text style={styles.summaryPrice}>${recommendation.price.toFixed(2)}</Text>
          <Text style={styles.summaryHint}>Price is estimated; provider will verify before you’re charged.</Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[componentStyles.tealButton, styles.actionFlex, { marginRight: 8 }]}
          >
            <Text style={styles.actionText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleAddEstimated}
            style={[componentStyles.tealButton, styles.actionFlex]}
          >
            <Text style={styles.actionText}>Add Estimated to Cart</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: '#00F0FF', fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  subtitle: { color: '#7A89FF', marginTop: 4, marginBottom: 16, fontFamily: 'Inter_500Medium' },
  label: { color: '#7A89FF', marginTop: 10, marginBottom: 6, fontFamily: 'Inter_600SemiBold' },
  row: { flexDirection: 'row', gap: 8 },
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
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
    backgroundColor: 'rgba(122, 137, 255, 0.1)'
  },
  pillActive: { borderColor: '#00F0FF', backgroundColor: 'rgba(0, 240, 255, 0.1)' },
  pillText: { color: '#7A89FF', fontFamily: 'Inter_600SemiBold' },
  pillTextActive: { color: '#00F0FF' },
  summaryBox: { marginTop: 16, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2A3555', backgroundColor: 'rgba(26, 33, 56, 1)' },
  summaryTitle: { color: '#7A89FF', fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  summaryLine: { color: '#FFFFFF', fontFamily: 'Inter_500Medium' },
  summaryPrice: { color: '#00F0FF', fontFamily: 'Inter_700Bold', marginTop: 4, fontSize: 18 },
  summaryHint: { color: '#7A89FF', marginTop: 6, fontSize: 12 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  actionFlex: { flex: 1, alignItems: 'center' },
  actionText: { color: colors.accent, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
});


