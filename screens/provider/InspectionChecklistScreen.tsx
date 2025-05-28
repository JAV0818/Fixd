import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';

export type Props = NativeStackScreenProps<ProviderStackParamList, 'InspectionChecklist'>;

export default function InspectionChecklistScreen({ route }: Props) {
  const { orderId } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Inspection Checklist Placeholder for Order {orderId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0F1E',
  },
  text: {
    color: '#00F0FF',
    fontSize: 18,
  },
}); 