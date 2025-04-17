import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Filter, X, DollarSign, Clock, MapPin } from 'lucide-react-native';

export type FilterOption = {
  id: string;
  name: string;
};

type FilterMenuProps = {
  isVisible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
  selectedFilters: any;
};

const budgetRanges: FilterOption[] = [
  { id: '0-100', name: '$0 - $100' },
  { id: '100-500', name: '$100 - $500' },
  { id: '500-1000', name: '$500 - $1,000' },
  { id: '1000+', name: '$1,000+' },
];

const urgencyLevels: FilterOption[] = [
  { id: 'urgent', name: 'Urgent' },
  { id: 'standard', name: 'Standard' },
  { id: 'flexible', name: 'Flexible' },
];

const locations: FilterOption[] = [
  { id: 'manhattan', name: 'Manhattan' },
  { id: 'brooklyn', name: 'Brooklyn' },
  { id: 'queens', name: 'Queens' },
  { id: 'bronx', name: 'Bronx' },
  { id: 'staten-island', name: 'Staten Island' },
];

export default function FilterMenu({
  isVisible,
  onClose,
  onApplyFilters,
  selectedFilters,
}: FilterMenuProps) {
  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#1f2937" />
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <DollarSign size={20} color="#0891b2" />
              <Text style={styles.sectionTitle}>Budget Range</Text>
            </View>
            <View style={styles.optionsGrid}>
              {budgetRanges.map((range) => (
                <Pressable
                  key={range.id}
                  style={[
                    styles.optionButton,
                    selectedFilters.budget === range.id && styles.optionButtonSelected
                  ]}
                  onPress={() => onApplyFilters({ ...selectedFilters, budget: range.id })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedFilters.budget === range.id && styles.optionTextSelected
                    ]}
                  >
                    {range.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color="#0891b2" />
              <Text style={styles.sectionTitle}>Urgency Level</Text>
            </View>
            <View style={styles.optionsGrid}>
              {urgencyLevels.map((level) => (
                <Pressable
                  key={level.id}
                  style={[
                    styles.optionButton,
                    selectedFilters.urgency === level.id && styles.optionButtonSelected
                  ]}
                  onPress={() => onApplyFilters({ ...selectedFilters, urgency: level.id })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedFilters.urgency === level.id && styles.optionTextSelected
                    ]}
                  >
                    {level.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color="#0891b2" />
              <Text style={styles.sectionTitle}>Location</Text>
            </View>
            <View style={styles.optionsGrid}>
              {locations.map((location) => (
                <Pressable
                  key={location.id}
                  style={[
                    styles.optionButton,
                    selectedFilters.location === location.id && styles.optionButtonSelected
                  ]}
                  onPress={() => onApplyFilters({ ...selectedFilters, location: location.id })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedFilters.location === location.id && styles.optionTextSelected
                    ]}
                  >
                    {location.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={styles.resetButton}
            onPress={() => onApplyFilters({})}
          >
            <Text style={styles.resetButtonText}>Reset All</Text>
          </Pressable>
          <Pressable
            style={styles.applyButton}
            onPress={onClose}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </Pressable>
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
    marginLeft: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionButtonSelected: {
    backgroundColor: '#0891b2',
    borderColor: '#0891b2',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#4b5563',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  resetButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#6b7280',
  },
  applyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#0891b2',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#ffffff',
  },
});