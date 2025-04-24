import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<ProviderStackParamList, 'RequestDetail'>;

export default function RequestDetailScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  
  // In a real app, you would fetch the request details using the ID
  const requestDetails = {
    id: requestId,
    customerName: 'John Smith',
    service: 'Home Cleaning',
    date: 'May 15, 2023',
    time: '14:00 - 16:00',
    address: '123 Main St, Anytown, CA 94501',
    status: 'Pending',
    description: 'Need a full house cleaning, including kitchen, bathrooms, and all bedrooms. Please bring eco-friendly cleaning supplies.',
    price: '$120.00',
  };

  const handleAccept = () => {
    // Logic to accept the request
    alert('Request accepted!');
    navigation.goBack();
  };

  const handleDecline = () => {
    // Logic to decline the request
    alert('Request declined');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service:</Text>
            <Text style={styles.detailValue}>{requestDetails.service}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{requestDetails.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{requestDetails.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>{requestDetails.price}</Text>
          </View>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{requestDetails.customerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue}>{requestDetails.address}</Text>
          </View>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Request Details</Text>
          <Text style={styles.description}>{requestDetails.description}</Text>
        </View>
      </ScrollView>
      
      {requestDetails.status === 'Pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={handleDecline}>
            <X size={20} color="#fff" />
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={handleAccept}>
            <Check size={20} color="#fff" />
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    flex: 2,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopColor: '#eee',
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  declineButton: {
    backgroundColor: '#dc3545',
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    marginLeft: 8,
    color: '#fff',
    fontWeight: '600',
  },
}); 