import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';

interface AddVehicleModalProps {
  onClose: () => void;
  onSubmit: (vehicle: {
    vehicleName: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    miles: number;
  }) => void;
}

export default function AddVehicleModal({ onClose, onSubmit }: AddVehicleModalProps) {
  const [formData, setFormData] = useState({
    vehicleName: '',
    vin: '',
    make: '',
    model: '',
    year: '',
    miles: '',
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    // Basic validation
    if (Object.values(formData).some(value => !value)) {
      setError('Please fill in all fields');
      return;
    }

    const year = parseInt(formData.year);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      setError('Please enter a valid year');
      return;
    }

    const miles = parseInt(formData.miles);
    if (isNaN(miles) || miles < 0) {
      setError('Please enter valid mileage');
      return;
    }

    onSubmit({
      ...formData,
      year,
      miles,
    });
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Vehicle</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#00F0FF" />
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., My Daily Driver"
              placeholderTextColor="#7A89FF"
              value={formData.vehicleName}
              onChangeText={(text) => setFormData({ ...formData, vehicleName: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>VIN</Text>
            <TextInput
              style={styles.input}
              placeholder="Vehicle Identification Number"
              placeholderTextColor="#7A89FF"
              value={formData.vin}
              onChangeText={(text) => setFormData({ ...formData, vin: text })}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Make</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Honda"
              placeholderTextColor="#7A89FF"
              value={formData.make}
              onChangeText={(text) => setFormData({ ...formData, make: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Accord"
              placeholderTextColor="#7A89FF"
              value={formData.model}
              onChangeText={(text) => setFormData({ ...formData, model: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2020"
              placeholderTextColor="#7A89FF"
              value={formData.year}
              onChangeText={(text) => setFormData({ ...formData, year: text })}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Mileage</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 50000"
              placeholderTextColor="#7A89FF"
              value={formData.miles}
              onChangeText={(text) => setFormData({ ...formData, miles: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Add Vehicle</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: '#0A0F1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF3D71',
  },
  errorText: {
    color: '#FF3D71',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#2A3555',
    borderRadius: 8,
    padding: 12,
    color: '#00F0FF',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3D71',
  },
  cancelButtonText: {
    color: '#FF3D71',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  submitButtonText: {
    color: '#00F0FF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
});