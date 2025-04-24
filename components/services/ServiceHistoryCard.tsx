import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type ServiceHistory = {
  id: string;
  vehicleName: string;
  serviceType: string;
  date: string;
  technician: string;
  cost: string;
  status: 'completed' | 'cancelled';
};

interface ServiceHistoryCardProps {
  service: ServiceHistory;
}

const ServiceHistoryCard: React.FC<ServiceHistoryCardProps> = ({ service }) => {
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>{service.date}</Text>
        <Text style={styles.historyCost}>{service.cost}</Text>
      </View>
      
      <Text style={styles.vehicleName}>{service.vehicleName}</Text>
      <Text style={styles.serviceType}>{service.serviceType}</Text>
      <Text style={styles.technicianName}>Technician: {service.technician}</Text>
      
      <View style={styles.historyLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  historyCard: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  historyCost: {
    color: '#00F0FF',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  vehicleName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  serviceType: {
    color: '#D0DFFF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  technicianName: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  historyLine: {
    height: 1,
    backgroundColor: '#2A3555',
    marginTop: 12,
  },
});

export default ServiceHistoryCard; 