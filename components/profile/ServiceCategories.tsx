import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Wrench } from 'lucide-react-native';

const categories = [
  'Washer/Dryer Repair',
  'Refrigerator Repair',
  'HVAC Service',
  'Dishwasher Repair',
  'Oven/Stove Repair',
  'Microwave Repair',
  'Small Appliance Repair',
  'Commercial Appliance Repair'
];

export default function ServiceCategories() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Washer/Dryer Repair',
    'Refrigerator Repair',
    'HVAC Service'
  ]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Wrench size={20} color="#0891b2" />
        <Text style={styles.title}>Service Categories</Text>
      </View>
      <Text style={styles.subtitle}>Select the services you provide</Text>
      
      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <Pressable
            key={category}
            style={[
              styles.categoryButton,
              selectedCategories.includes(category) && styles.categoryButtonSelected
            ]}
            onPress={() => toggleCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategories.includes(category) && styles.categoryTextSelected
              ]}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </View>
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonSelected: {
    backgroundColor: '#0891b2',
    borderColor: '#0891b2',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#4b5563',
  },
  categoryTextSelected: {
    color: '#ffffff',
  },
});