import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Circle, Loader } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '@/navigation/ProviderNavigator';
import { RepairOrder } from '@/types/orders';

type Props = NativeStackScreenProps<ProviderStackParamList, 'UpdateStatus'>;

// Define possible statuses
const STATUS_OPTIONS: Array<RepairOrder['status']> = [
  // 'Pending', // Provider shouldn't set back to Pending manually?
  'Accepted',
  'InProgress',
  'Completed',
  'Cancelled'
];

export default function UpdateStatusScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  // In a real app, fetch the current status for this orderId
  const [currentStatus, setCurrentStatus] = useState('Scheduled'); 
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);

  const handleUpdateStatus = () => {
    if (selectedStatus === currentStatus) {
      Alert.alert("No Change", "The status has not been changed.");
      return;
    }
    
    setUpdating(true);
    // Simulate API call to update status
    setTimeout(() => {
      setUpdating(false);
      // In a real app, update the currentStatus based on API response
      setCurrentStatus(selectedStatus); 
      Alert.alert("Status Updated", `Order status changed to ${selectedStatus}.`);
      navigation.goBack(); // Navigate back after successful update
    }, 1000); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>UPDATE ORDER STATUS</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <View style={styles.content}>
        <Text style={styles.infoText}>Order ID: {orderId}</Text>
        <Text style={styles.infoText}>Current Status: {currentStatus}</Text>
        
        <Text style={styles.selectTitle}>Select New Status:</Text>
        
        <View style={styles.statusOptionsContainer}>
          {STATUS_OPTIONS.map((status) => (
            <TouchableOpacity 
              key={status} 
              style={styles.statusOption}
              onPress={() => setSelectedStatus(status)}
              disabled={updating}
            >
              {selectedStatus === status ? (
                <CheckCircle size={20} color="#00F0FF" />
              ) : (
                <Circle size={20} color="#7A89FF" />
              )}
              <Text 
                style={[
                  styles.statusLabel,
                  selectedStatus === status && styles.selectedStatusLabel
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[
            styles.updateButton, 
            (selectedStatus === currentStatus || updating) && styles.disabledButton
          ]} 
          onPress={handleUpdateStatus}
          disabled={selectedStatus === currentStatus || updating}
        >
          {updating ? (
            <Loader size={20} color="#0A0F1E" style={styles.loaderIcon} />
          ) : (
            <Text style={styles.updateButtonText}>UPDATE STATUS</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    marginBottom: 8,
    opacity: 0.8,
  },
  selectTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginTop: 24,
    marginBottom: 16,
    letterSpacing: 1,
  },
  statusOptionsContainer: {
    backgroundColor: 'rgba(26, 33, 56, 1)',
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 32,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  selectedStatusLabel: {
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
  },
  updateButton: {
    backgroundColor: '#00F0FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto', // Push to bottom
  },
  updateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0A0F1E',
    letterSpacing: 1,
  },
  disabledButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.5)',
  },
  loaderIcon: {
    animationName: 'spin',
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
  // Add keyframes for spinning animation if needed, typically done via native animation modules
}); 