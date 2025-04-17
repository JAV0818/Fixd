import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Activity, TriangleAlert as AlertTriangle, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AddVehicleModal from '@/components/vehicles/AddVehicleModal';
import { Vehicle, addVehicle, deleteVehicle, getUserVehicles } from '@/lib/vehicles';

const vehicleStatuses = {
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

export default function VehiclesScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const userVehicles = await getUserVehicles();
      setVehicles(userVehicles);
    } catch (err) {
      setError('Failed to load vehicles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (vehicleData: Omit<Vehicle, 'id'>) => {
    try {
      setError(null);
      await addVehicle(vehicleData);
      await loadVehicles();
      setShowAddVehicle(false);
    } catch (err) {
      setError('Failed to add vehicle');
      console.error(err);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      setError(null);
      await deleteVehicle(vehicleId);
      await loadVehicles();
    } catch (err) {
      setError('Failed to delete vehicle');
      console.error(err);
    }
  };

  const handleImagePick = async (vehicleId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      // In a real app, you would upload this image to storage
      // and update the vehicle document with the image URL
      console.log('Selected image:', result.assets[0].uri);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Activity size={32} color="#00F0FF" />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>QUANTUM GARAGE</Text>
        <Pressable 
          style={styles.addButton}
          onPress={() => setShowAddVehicle(true)}
        >
          <Plus size={24} color="#00F0FF" />
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No vehicles added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to add your first vehicle
            </Text>
          </View>
        ) : (
          vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.vehicleCard}>
              <Pressable 
                style={styles.imageContainer}
                onPress={() => handleImagePick(vehicle.id)}
              >
                <Image 
                  source={{ 
                    uri: vehicle.image || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=60'
                  }} 
                  style={styles.vehicleImage} 
                />
                <View style={styles.imageOverlay}>
                  <Camera size={24} color="#FFFFFF" />
                </View>
              </Pressable>

              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleHeader}>
                  <Text style={styles.vehicleName}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: `${vehicleStatuses[vehicle.status || 'optimal'].color}20` }
                  ]}>
                    <Activity size={16} color={vehicleStatuses[vehicle.status || 'optimal'].color} />
                    <Text style={[
                      styles.statusText,
                      { color: vehicleStatuses[vehicle.status || 'optimal'].color }
                    ]}>
                      {vehicleStatuses[vehicle.status || 'optimal'].label}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>VIN</Text>
                    <Text style={styles.detailValue}>{vehicle.vin}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>MILEAGE</Text>
                    <Text style={styles.detailValue}>{vehicle.miles.toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>LAST SERVICE</Text>
                    <Text style={styles.detailValue}>{vehicle.lastService}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>NEXT SERVICE</Text>
                    <Text style={styles.detailValue}>{vehicle.nextService}</Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Pressable 
                    style={styles.actionButton}
                    onPress={() => router.push(`/vehicles/${vehicle.id}`)}
                  >
                    <Text style={styles.actionText}>SERVICE</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteVehicle(vehicle.id)}
                  >
                    <Text style={styles.deleteButtonText}>DELETE</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {showAddVehicle && (
        <AddVehicleModal
          onClose={() => setShowAddVehicle(false)}
          onSubmit={handleAddVehicle}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#00F0FF',
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
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3D71',
  },
  errorText: {
    color: '#FF3D71',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  vehicleCard: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
    overflow: 'hidden',
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 15, 30, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  vehicleInfo: {
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleName: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    width: '45%',
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    borderColor: '#FF3D71',
  },
  deleteButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FF3D71',
    letterSpacing: 2,
  },
});