import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { Award, Plus, X } from 'lucide-react-native';

const commonCertifications = [
  'EPA 608 Universal',
  'HVAC Excellence',
  'NATE Certification',
  'ASE Certification',
  'Electrical License',
  'Plumbing License',
];

export default function CertificationManager() {
  const [certifications, setCertifications] = useState([
    'EPA 608 Universal Certification',
    'HVAC Excellence',
    'NASTeC Certification'
  ]);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newCertification, setNewCertification] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleAddCertification = () => {
    if (newCertification.trim()) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
      setShowAddNew(false);
    }
  };

  const handleRemoveCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleSearchCertification = (text: string) => {
    setNewCertification(text);
    if (text.trim()) {
      const filtered = commonCertifications.filter(cert => 
        cert.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Award size={20} color="#0891b2" />
        <Text style={styles.title}>Certifications & Licenses</Text>
      </View>
      <Text style={styles.subtitle}>Add your professional certifications</Text>

      <ScrollView style={styles.certificateList}>
        {certifications.map((cert, index) => (
          <View key={index} style={styles.certificateItem}>
            <Award size={16} color="#0891b2" />
            <Text style={styles.certificateText}>{cert}</Text>
            <Pressable
              onPress={() => handleRemoveCertification(index)}
              style={styles.removeButton}
            >
              <X size={16} color="#ef4444" />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {showAddNew ? (
        <View style={styles.addNewContainer}>
          <TextInput
            style={styles.input}
            value={newCertification}
            onChangeText={handleSearchCertification}
            placeholder="Enter certification name"
            autoFocus
          />
          {suggestions.length > 0 && (
            <View style={styles.suggestions}>
              {suggestions.map((suggestion, index) => (
                <Pressable
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setNewCertification(suggestion);
                    setSuggestions([]);
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={styles.addNewActions}>
            <Pressable
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setShowAddNew(false);
                setNewCertification('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.addButton]}
              onPress={handleAddCertification}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={styles.addCertButton}
          onPress={() => setShowAddNew(true)}
        >
          <Plus size={20} color="#0891b2" />
          <Text style={styles.addCertText}>Add Certification</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
    marginBottom: 16,
  },
  certificateList: {
    maxHeight: 200,
  },
  certificateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  certificateText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#1f2937',
  },
  removeButton: {
    padding: 4,
  },
  addCertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    marginTop: 8,
  },
  addCertText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0891b2',
  },
  addNewContainer: {
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  suggestions: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1f2937',
  },
  addNewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  addButton: {
    backgroundColor: '#0891b2',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});