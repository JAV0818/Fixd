import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Calendar, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Car } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const upcomingServices = [
  {
    id: '1',
    vehicleName: '2024 Tesla Model S',
    serviceType: 'Quantum Engine Calibration',
    date: 'March 15, 2025',
    time: '10:30 AM',
    status: 'confirmed',
    technician: 'Aaren Johnson',
    location: '123 Tech Ave, Boston MA',
  },
  {
    id: '2',
    vehicleName: '2024 Tesla Model S',
    serviceType: 'Battery Health Check',
    date: 'April 2, 2025',
    time: '2:00 PM',
    status: 'pending',
    technician: 'Sarah Chen',
    location: '123 Tech Ave, Boston MA',
  },
];

const serviceHistory = [
  {
    id: '1',
    vehicleName: '2024 Tesla Model S',
    serviceType: 'Oil Change & Filter',
    date: 'February 1, 2025',
    technician: 'Michael Rodriguez',
    cost: '$89.99',
    status: 'completed',
  },
  {
    id: '2',
    vehicleName: '2024 Tesla Model S',
    serviceType: 'Brake Pad Replacement',
    date: 'January 15, 2025',
    technician: 'Emily Thompson',
    cost: '$299.99',
    status: 'completed',
  },
  {
    id: '3',
    vehicleName: '2024 Tesla Model S',
    serviceType: 'Tire Rotation',
    date: 'December 20, 2024',
    technician: 'Aaren Johnson',
    cost: '$79.99',
    status: 'completed',
  },
];

export default function ServiceScheduleScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <Text style={styles.title}>SERVICE SCHEDULE</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#00F0FF" />
            <Text style={styles.sectionTitle}>UPCOMING SERVICES</Text>
          </View>
          
          {upcomingServices.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Car size={20} color="#00F0FF" />
                <Text style={styles.vehicleName}>{service.vehicleName}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: service.status === 'confirmed' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 184, 0, 0.1)' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: service.status === 'confirmed' ? '#00F0FF' : '#FFB800' }
                  ]}>
                    {service.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.serviceType}>{service.serviceType}</Text>
              
              <View style={styles.serviceDetails}>
                <View style={styles.detailItem}>
                  <Clock size={16} color="#7A89FF" />
                  <Text style={styles.detailText}>{service.date} at {service.time}</Text>
                </View>
                <Text style={styles.detailText}>Technician: {service.technician}</Text>
                <Text style={styles.detailText}>Location: {service.location}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle2 size={20} color="#00F0FF" />
            <Text style={styles.sectionTitle}>SERVICE HISTORY</Text>
          </View>

          {serviceHistory.map((service) => (
            <View key={service.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>{service.date}</Text>
                <Text style={styles.historyCost}>{service.cost}</Text>
              </View>
              
              <Text style={styles.vehicleName}>{service.vehicleName}</Text>
              <Text style={styles.serviceType}>{service.serviceType}</Text>
              <Text style={styles.technicianName}>Technician: {service.technician}</Text>
              
              <View style={styles.historyLine} />
            </View>
          ))}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  serviceCard: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  vehicleName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  serviceType: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 12,
  },
  serviceDetails: {
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  historyCard: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
    position: 'relative',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
  },
  historyCost: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
  },
  technicianName: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    marginTop: 4,
  },
  historyLine: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 2,
    backgroundColor: '#00F0FF',
  },
});