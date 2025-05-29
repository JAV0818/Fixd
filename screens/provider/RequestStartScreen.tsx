import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle, Briefcase, User } from 'lucide-react-native';

type Props = NativeStackScreenProps<ProviderStackParamList, 'RequestStart'>;

export default function RequestStartScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [loading, setLoading] = useState(false);
  
  // In a real app, you would fetch the request details using the ID
  const requestDetails = {
    id: orderId,
    customerName: 'John Smith',
    customerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    service: 'Home Cleaning',
    date: 'May 15, 2023',
    time: '14:00 - 16:00',
    address: '123 Main St, Anytown, CA 94501',
    status: 'Pending',
    description: 'Need a full house cleaning, including kitchen, bathrooms, and all bedrooms. Please bring eco-friendly cleaning supplies.',
    price: '$120.00',
    estimatedDuration: '2 hours',
  };

  const handleStartService = () => {
    setLoading(true);
    
    // Simulate API call / status update if needed here
    // For now, directly navigate
    setTimeout(() => { // Keep timeout to simulate some processing if desired
      setLoading(false);
      // Directly navigate without the alert
      navigation.navigate('InspectionChecklist', { orderId });
    }, 500); // Reduced timeout slightly
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>START SERVICE</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.customerCard}>
          <Image source={{ uri: requestDetails.customerAvatar }} style={styles.avatar} />
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{requestDetails.customerName.toUpperCase()}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>CLIENT</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Briefcase size={20} color="#00F0FF" />
            <Text style={styles.sectionTitle}>SERVICE DETAILS</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Type:</Text>
            <Text style={styles.detailValue}>{requestDetails.service}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Calendar size={16} color="#00F0FF" />
            </View>
            <Text style={styles.detailValue}>{requestDetails.date}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Clock size={16} color="#00F0FF" />
            </View>
            <Text style={styles.detailValue}>
              {requestDetails.time} ({requestDetails.estimatedDuration})
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MapPin size={16} color="#00F0FF" />
            </View>
            <Text style={styles.detailValue}>{requestDetails.address}</Text>
          </View>
        </View>
        
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#00F0FF" />
            <Text style={styles.sectionTitle}>CLIENT INSTRUCTIONS</Text>
          </View>
          <Text style={styles.descriptionText}>{requestDetails.description}</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Once you start this service, the client will be notified and your GPS location will be shared during the service duration.
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.startButton, loading && styles.loadingButton]}
          onPress={handleStartService}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.buttonText}>STARTING...</Text>
          ) : (
            <>
              <CheckCircle size={20} color="#0A0F1E" />
              <Text style={styles.buttonText}>START SERVICE NOW</Text>
            </>
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
    padding: 16,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#00F0FF',
  },
  customerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginLeft: 8,
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#00F0FF',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00F0FF',
    borderRadius: 8,
    paddingVertical: 16,
  },
  loadingButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.5)',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0A0F1E',
    marginLeft: 8,
    letterSpacing: 1,
  },
}); 