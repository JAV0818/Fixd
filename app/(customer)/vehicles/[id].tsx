import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Activity, Clock, PenTool as Tool, Plus, ChevronRight, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const serviceHistory = [
  {
    id: '1',
    date: 'March 15, 2025',
    description: 'Oil Change & Filter Replacement',
    mileage: 100000,
    technician: 'John Smith',
    cost: '$89.99',
  },
  {
    id: '2',
    date: 'December 1, 2024',
    description: 'Brake Pad Replacement',
    mileage: 95000,
    technician: 'Sarah Johnson',
    cost: '$299.99',
  },
  {
    id: '3',
    date: 'September 15, 2024',
    description: 'Tire Rotation & Balance',
    mileage: 90000,
    technician: 'Mike Chen',
    cost: '$79.99',
  },
];

type VehicleStatus = 'optimal' | 'attention' | 'critical';

export default function VehicleServiceDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  console.log("--- Vehicle Details Screen Rendered ---");
  console.log("Received ID:", id);

  // In a real app, fetch vehicle details using the ID
  const vehicle = {
    name: 'My Daily Driver',
    year: 2023,
    make: 'Toyota',
    model: 'Camry',
    image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&auto=format&fit=crop&q=60',
    status: 'attention' as VehicleStatus,
    lastService: 'March 15, 2025',
    nextService: 'September 15, 2025',
    currentMileage: 100000,
    nextServiceMileage: 105000,
  };

  const statusConfig = {
    optimal: {
      color: '#00F0FF',
      label: 'OPTIMAL',
      description: 'All systems functioning normally',
    },
    attention: {
      color: '#FFB800',
      label: 'NEEDS ATTENTION',
      description: 'Maintenance required soon',
    },
    critical: {
      color: '#FF3D71',
      label: 'SERVICE REQUIRED',
      description: 'Immediate attention needed',
    },
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#00F0FF" />
          </Pressable>
          <Text style={styles.title}>Service Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.vehicleCard}>
            <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {vehicle.name}
              </Text>
              <Text style={styles.vehicleModel}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
            </View>
          </View>

          <View style={styles.statusSection}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: `${statusConfig[vehicle.status].color}20` }
            ]}>
              <Activity size={20} color={statusConfig[vehicle.status].color} />
              <Text style={[styles.statusText, { color: statusConfig[vehicle.status].color }]}>
                {statusConfig[vehicle.status].label}
              </Text>
            </View>
            <Text style={styles.statusDescription}>
              {statusConfig[vehicle.status].description}
            </Text>
          </View>

          <View style={styles.maintenanceSection}>
            <View style={styles.maintenanceCard}>
              <View style={styles.maintenanceHeader}>
                <Clock size={20} color="#00F0FF" />
                <Text style={styles.maintenanceTitle}>Last Service</Text>
              </View>
              <Text style={styles.maintenanceDate}>{vehicle.lastService}</Text>
              <Text style={styles.maintenanceMileage}>
                at {vehicle.currentMileage.toLocaleString()} miles
              </Text>
            </View>

            <View style={styles.maintenanceCard}>
              <View style={styles.maintenanceHeader}>
                <AlertTriangle size={20} color="#FFB800" />
                <Text style={styles.maintenanceTitle}>Next Service Due</Text>
              </View>
              <Text style={styles.maintenanceDate}>{vehicle.nextService}</Text>
              <Text style={styles.maintenanceMileage}>
                or at {vehicle.nextServiceMileage.toLocaleString()} miles
              </Text>
            </View>
          </View>

          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Tool size={20} color="#00F0FF" />
                <Text style={styles.sectionTitle}>Service History</Text>
              </View>
              <Pressable style={styles.addRecordButton}>
                <Plus size={16} color="#00F0FF" />
                <Text style={styles.addRecordText}>ADD RECORD</Text>
              </Pressable>
            </View>

            {serviceHistory.map((service) => (
              <Pressable key={service.id} style={styles.historyCard}>
                <View style={styles.historyMain}>
                  <Text style={styles.historyDate}>{service.date}</Text>
                  <Text style={styles.historyDescription}>
                    {service.description}
                  </Text>
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyMileage}>
                      Mileage: {service.mileage.toLocaleString()}
                    </Text>
                    <Text style={styles.historyTechnician}>
                      Technician: {service.technician}
                    </Text>
                    <Text style={styles.historyCost}>
                      Cost: {service.cost}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#7A89FF" />
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.scheduleButton}>
            <Text style={styles.scheduleButtonText}>SCHEDULE SERVICE</Text>
          </Pressable>
          <Pressable style={styles.updateButton}>
            <Text style={styles.updateButtonText}>UPDATE MILEAGE</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
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
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
  },
  vehicleCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#2A3555',
    overflow: 'hidden',
  },
  vehicleImage: {
    width: '100%',
    height: 200,
  },
  vehicleInfo: {
    padding: 16,
  },
  vehicleName: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  statusDescription: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  maintenanceSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  maintenanceCard: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  maintenanceTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
  },
  maintenanceDate: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 4,
  },
  maintenanceMileage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  historySection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  addRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    gap: 4,
  },
  addRecordText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  historyMain: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 4,
  },
  historyDescription: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 8,
  },
  historyDetails: {
    gap: 4,
  },
  historyMileage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  historyTechnician: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  historyCost: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  footer: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
  },
  scheduleButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  scheduleButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  updateButton: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7A89FF',
  },
  updateButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    letterSpacing: 2,
  },
});