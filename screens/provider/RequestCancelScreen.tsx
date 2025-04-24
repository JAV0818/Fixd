import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, MapPin, X, AlertCircle } from 'lucide-react-native';

type Props = NativeStackScreenProps<ProviderStackParamList, 'RequestCancel'>;

const CANCELLATION_REASONS = [
  'Schedule conflict',
  'Emergency situation',
  'Equipment issue',
  'Distance too far',
  'Other reason'
];

export default function RequestCancelScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  
  // In a real app, you would fetch the request details using the ID
  const requestDetails = {
    id: requestId,
    customerName: 'John Smith',
    customerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    service: 'Home Cleaning',
    date: 'May 15, 2023',
    time: '14:00 - 16:00',
    address: '123 Main St, Anytown, CA 94501',
    status: 'Pending',
  };

  const handleCancel = () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a cancellation reason');
      return;
    }
    
    if (selectedReason === 'Other reason' && !otherReason) {
      Alert.alert('Error', 'Please provide details for the other reason');
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Request Cancelled",
        "This service request has been successfully cancelled.",
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate('Requests')
          }
        ]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CANCEL REQUEST</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.warningCard}>
          <AlertCircle size={24} color="#FF3D71" />
          <Text style={styles.warningText}>
            You are about to cancel this service request. This action cannot be undone.
          </Text>
        </View>
        
        <View style={styles.requestCard}>
          <Image source={{ uri: requestDetails.customerAvatar }} style={styles.avatar} />
          <View style={styles.requestInfo}>
            <Text style={styles.customerName}>{requestDetails.customerName.toUpperCase()}</Text>
            <Text style={styles.serviceName}>{requestDetails.service}</Text>
            
            <View style={styles.detailRow}>
              <Calendar size={14} color="#00F0FF" />
              <Text style={styles.detailText}>{requestDetails.date}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Clock size={14} color="#00F0FF" />
              <Text style={styles.detailText}>{requestDetails.time}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <MapPin size={14} color="#00F0FF" />
              <Text style={styles.detailText}>{requestDetails.address}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>SELECT CANCELLATION REASON</Text>
        
        <View style={styles.reasonsContainer}>
          {CANCELLATION_REASONS.map(reason => (
            <TouchableOpacity
              key={reason}
              style={[
                styles.reasonButton,
                selectedReason === reason && styles.selectedReasonButton
              ]}
              onPress={() => setSelectedReason(reason)}
            >
              <Text style={[
                styles.reasonText,
                selectedReason === reason && styles.selectedReasonText
              ]}>
                {reason}
              </Text>
              {selectedReason === reason && (
                <X size={16} color="#0A0F1E" />
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {selectedReason === 'Other reason' && (
          <View style={styles.otherReasonContainer}>
            <Text style={styles.otherReasonLabel}>Please specify:</Text>
            <TextInput
              style={styles.otherReasonInput}
              value={otherReason}
              onChangeText={setOtherReason}
              placeholder="Enter your reason here..."
              placeholderTextColor="#7A89FF"
              multiline
            />
          </View>
        )}
        
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Note: Frequent cancellations may affect your provider rating and future request assignments.
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.cancelButton, loading && styles.loadingButton]}
          onPress={handleCancel}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.buttonText}>CANCELLING...</Text>
          ) : (
            <>
              <X size={20} color="#0A0F1E" />
              <Text style={styles.buttonText}>CONFIRM CANCELLATION</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backToRequestButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backToRequestText}>BACK TO REQUEST</Text>
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
    color: '#FF3D71',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningCard: {
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF3D71',
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#FF3D71',
    marginLeft: 12,
    lineHeight: 20,
  },
  requestCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#7A89FF',
  },
  requestInfo: {
    marginLeft: 12,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: 1,
  },
  serviceName: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 12,
    letterSpacing: 1,
  },
  reasonsContainer: {
    marginBottom: 24,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  selectedReasonButton: {
    backgroundColor: '#FF3D71',
    borderColor: '#FF3D71',
  },
  reasonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
  },
  selectedReasonText: {
    color: '#0A0F1E',
    fontFamily: 'Inter_600SemiBold',
  },
  otherReasonContainer: {
    marginBottom: 24,
  },
  otherReasonLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 8,
  },
  otherReasonInput: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3555',
    padding: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  noteCard: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  noteText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3D71',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 12,
  },
  loadingButton: {
    backgroundColor: 'rgba(255, 61, 113, 0.5)',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0A0F1E',
    marginLeft: 8,
    letterSpacing: 1,
  },
  backToRequestButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToRequestText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    letterSpacing: 1,
  },
}); 